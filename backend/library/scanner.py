import os
import hashlib
import datetime
import logging
from typing import Dict, Any, List, Optional
import mutagen
from mutagen.id3 import ID3, APIC
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4
from mutagen.flac import FLAC
from mutagen.oggvorbis import OggVorbis
from mutagen.wave import WAVE
import aiofiles
import aiofiles.os
from backend.database.db import get_db_connection

logger = logging.getLogger("sonora.scanner")

COVERS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "covers")
SUPPORTED_EXTENSIONS = {'.mp3', '.m4a', '.wav', '.flac', '.ogg', '.opus', '.aac', '.wma'}

def get_file_hash(file_path: str) -> str:
    return hashlib.md5(file_path.encode('utf-8')).hexdigest()

def extract_and_save_cover(audio_meta: Any, file_path: str) -> Optional[str]:
    os.makedirs(COVERS_DIR, exist_ok=True)
    cover_data = None
    ext = "jpg"
    
    try:
        if isinstance(audio_meta, MP3) or (hasattr(audio_meta, 'tags') and isinstance(audio_meta.tags, ID3)):
            for tag in audio_meta.tags.values():
                if isinstance(tag, APIC):
                    cover_data = tag.data
                    if 'png' in tag.mime.lower():
                        ext = "png"
                    break
        elif isinstance(audio_meta, MP4):
            if 'covr' in audio_meta.tags and audio_meta.tags['covr']:
                cover_data = bytes(audio_meta.tags['covr'][0])
                # MP4 cover format (13=JPEG, 14=PNG)
                if hasattr(audio_meta.tags['covr'][0], 'imageformat') and audio_meta.tags['covr'][0].imageformat == 14:
                    ext = "png"
        elif isinstance(audio_meta, FLAC):
            if audio_meta.pictures:
                cover_data = audio_meta.pictures[0].data
                if 'png' in audio_meta.pictures[0].mime.lower():
                    ext = "png"
        elif isinstance(audio_meta, OggVorbis):
            if 'metadata_block_picture' in audio_meta:
                import base64
                from mutagen.flac import Picture
                for b64 in audio_meta['metadata_block_picture']:
                    pic = Picture(base64.b64decode(b64))
                    cover_data = pic.data
                    if 'png' in pic.mime.lower():
                        ext = "png"
                    break
    except Exception as e:
        logger.debug(f"Could not extract embedded cover for {file_path}: {e}")

    # If no embedded cover, look for folder.jpg / cover.jpg in the same directory
    if not cover_data:
        try:
            folder_dir = os.path.dirname(file_path)
            for candidate in ["cover.jpg", "cover.png", "folder.jpg", "folder.png", "front.jpg", "album.jpg"]:
                cand_path = os.path.join(folder_dir, candidate)
                if os.path.exists(cand_path):
                    with open(cand_path, 'rb') as f:
                        cover_data = f.read()
                        ext = "png" if cand_path.endswith(".png") else "jpg"
                    break
        except Exception:
            pass

    if cover_data:
        cover_hash = hashlib.md5(cover_data).hexdigest()
        cover_filename = f"{cover_hash}.{ext}"
        cover_filepath = os.path.join(COVERS_DIR, cover_filename)
        
        if not os.path.exists(cover_filepath):
            with open(cover_filepath, 'wb') as f:
                f.write(cover_data)
                
        return f"/api/covers/{cover_filename}"

    return None

def extract_metadata(file_path: str) -> Dict[str, Any]:
    default_title = os.path.splitext(os.path.basename(file_path))[0]
    # Check if filename has format "Artist - Title"
    default_artist = "Unknown Artist"
    if " - " in default_title:
        parts = default_title.split(" - ", 1)
        default_artist = parts[0].strip()
        default_title = parts[1].strip()

    info: Dict[str, Any] = {
        "id": get_file_hash(file_path),
        "title": default_title,
        "artist": default_artist,
        "album": "Unknown Album",
        "genre": "Unknown Genre",
        "duration": 0.0,
        "file_path": os.path.abspath(file_path),
        "cover_path": None,
        "track_number": 0,
        "year": None,
    }

    try:
        audio = mutagen.File(file_path, easy=True)
        if audio is not None:
            if hasattr(audio.info, 'length') and audio.info.length:
                info["duration"] = round(float(audio.info.length), 2)

            if audio.tags:
                if 'title' in audio.tags and audio.tags['title']:
                    info["title"] = str(audio.tags['title'][0]).strip()
                if 'artist' in audio.tags and audio.tags['artist']:
                    info["artist"] = str(audio.tags['artist'][0]).strip()
                if 'album' in audio.tags and audio.tags['album']:
                    info["album"] = str(audio.tags['album'][0]).strip()
                if 'genre' in audio.tags and audio.tags['genre']:
                    info["genre"] = str(audio.tags['genre'][0]).strip()
                if 'date' in audio.tags and audio.tags['date']:
                    try:
                        info["year"] = int(str(audio.tags['date'][0])[:4])
                    except ValueError:
                        pass
                if 'tracknumber' in audio.tags and audio.tags['tracknumber']:
                    try:
                        tn_str = str(audio.tags['tracknumber'][0]).split('/')[0]
                        info["track_number"] = int(tn_str)
                    except ValueError:
                        pass

        # Extract cover using full mutagen file
        full_audio = mutagen.File(file_path)
        if full_audio is not None:
            info["cover_path"] = extract_and_save_cover(full_audio, file_path)
            
    except Exception as e:
        logger.warning(f"Error reading metadata from {file_path}: {e}")

    return info

async def scan_directory(directory_path: str, progress_callback=None) -> Dict[str, int]:
    if not os.path.exists(directory_path):
        logger.warning(f"Directory does not exist: {directory_path}")
        return {"added": 0, "updated": 0, "total": 0}

    logger.info(f"Scanning directory: {directory_path}")
    audio_files = []
    
    for root, _, files in os.walk(directory_path):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in SUPPORTED_EXTENSIONS:
                audio_files.append(os.path.join(root, f))

    total = len(audio_files)
    added = 0
    updated = 0
    now_iso = datetime.datetime.now().isoformat()

    async with get_db_connection() as db:
        for idx, file_path in enumerate(audio_files):
            try:
                meta = extract_metadata(file_path)
                
                # Check if song exists
                async with db.execute("SELECT id, favorite, play_count, date_added FROM songs WHERE file_path = ?", (meta["file_path"],)) as cursor:
                    existing = await cursor.fetchone()

                if existing:
                    await db.execute("""
                        UPDATE songs SET
                            title = ?, artist = ?, album = ?, genre = ?,
                            duration = ?, cover_path = ?, track_number = ?, year = ?
                        WHERE file_path = ?
                    """, (
                        meta["title"], meta["artist"], meta["album"], meta["genre"],
                        meta["duration"], meta["cover_path"], meta["track_number"], meta["year"],
                        meta["file_path"]
                    ))
                    updated += 1
                else:
                    await db.execute("""
                        INSERT INTO songs (
                            id, title, artist, album, genre, duration,
                            file_path, cover_path, date_added, play_count,
                            favorite, track_number, year
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
                    """, (
                        meta["id"], meta["title"], meta["artist"], meta["album"],
                        meta["genre"], meta["duration"], meta["file_path"],
                        meta["cover_path"], now_iso, meta["track_number"], meta["year"]
                    ))
                    added += 1

                if progress_callback:
                    await progress_callback(idx + 1, total, file_path)

            except Exception as e:
                logger.error(f"Failed to process {file_path}: {e}")

        # Commit batch changes
        await db.commit()

        # Update artists and albums summary tables
        await db.execute("DELETE FROM artists")
        await db.execute("""
            INSERT INTO artists (id, name, song_count, album_count, cover_path)
            SELECT 
                LOWER(artist) as id, 
                artist as name, 
                COUNT(*) as song_count, 
                COUNT(DISTINCT album) as album_count,
                MIN(cover_path) as cover_path
            FROM songs
            GROUP BY artist
        """)

        await db.execute("DELETE FROM albums")
        await db.execute("""
            INSERT INTO albums (id, name, artist, cover_path, year, song_count)
            SELECT 
                LOWER(album || '---' || artist) as id,
                album as name,
                artist,
                MIN(cover_path) as cover_path,
                MIN(year) as year,
                COUNT(*) as song_count
            FROM songs
            GROUP BY album, artist
        """)

        await db.commit()

    logger.info(f"Scan complete. Total: {total}, Added: {added}, Updated: {updated}")
    return {"added": added, "updated": updated, "total": total}
