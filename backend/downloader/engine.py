import os
import re
import asyncio
import logging
import datetime
import uuid
import urllib.request
from typing import Dict, Any, List, Optional, Callable
import yt_dlp
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, APIC
from mutagen.mp3 import MP3
from backend.database.db import get_settings, get_db_connection
from backend.library.scanner import extract_metadata

logger = logging.getLogger("sonora.downloader")

def sanitize_filename(name: str) -> str:
    # Remove invalid filesystem characters
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()

class DownloadJob:
    def __init__(self, job_id: str, url: str, title: str, artist: str, album: str, thumbnail: str, duration: float):
        self.id = job_id
        self.url = url
        self.title = title
        self.artist = artist
        self.album = album
        self.thumbnail = thumbnail
        self.duration = duration
        self.status = "queued"  # queued, downloading, converting, tagging, complete, error, cancelled
        self.progress = 0.0
        self.speed = "0 KB/s"
        self.eta = "--:--"
        self.error_message: Optional[str] = None
        self.file_path: Optional[str] = None
        self.cancel_requested = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "url": self.url,
            "title": self.title,
            "artist": self.artist,
            "album": self.album,
            "thumbnail": self.thumbnail,
            "duration": self.duration,
            "status": self.status,
            "progress": round(self.progress, 1),
            "speed": self.speed,
            "eta": self.eta,
            "error": self.error_message,
            "file_path": self.file_path
        }

class DownloadManager:
    def __init__(self):
        self.jobs: Dict[str, DownloadJob] = {}
        self.queue: asyncio.Queue = asyncio.Queue()
        self.is_running = False
        self.broadcast_callback: Optional[Callable[[Dict[str, Any]], Any]] = None
        self.active_tasks: Dict[str, asyncio.Task] = {}

    def set_broadcast_callback(self, callback: Callable[[Dict[str, Any]], Any]):
        self.broadcast_callback = callback

    async def emit_update(self, job: DownloadJob):
        if self.broadcast_callback:
            try:
                await self.broadcast_callback({
                    "type": "DOWNLOAD_UPDATE",
                    "job": job.to_dict()
                })
            except Exception as e:
                logger.debug(f"Broadcast error: {e}")

    async def analyze_url(self, url: str) -> Dict[str, Any]:
        """Analyzes a YouTube video or playlist without downloading audio."""
        ydl_opts = {
            'extract_flat': 'in_playlist',
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
        }
        
        loop = asyncio.get_event_loop()
        def _extract():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
                
        try:
            info = await loop.run_in_executor(None, _extract)
            if not info:
                raise ValueError("Could not retrieve media info")

            is_playlist = 'entries' in info and info['entries'] is not None
            items = []

            if is_playlist:
                playlist_title = info.get('title', 'Unknown Playlist')
                for entry in info['entries']:
                    if not entry:
                        continue
                    title = entry.get('title', 'Unknown Title')
                    artist = entry.get('uploader') or entry.get('channel') or 'Unknown Artist'
                    duration = entry.get('duration') or 0.0
                    thumb = entry.get('thumbnail') or (entry.get('thumbnails', [{}])[-1].get('url') if entry.get('thumbnails') else None)
                    webpage = entry.get('url') or entry.get('webpage_url')
                    if webpage and not webpage.startswith('http'):
                        webpage = f"https://www.youtube.com/watch?v={entry.get('id')}"

                    items.append({
                        "id": entry.get('id') or str(uuid.uuid4()),
                        "url": webpage or url,
                        "title": title,
                        "artist": artist,
                        "album": playlist_title,
                        "duration": duration,
                        "thumbnail": thumb
                    })
                return {
                    "is_playlist": True,
                    "title": playlist_title,
                    "count": len(items),
                    "items": items
                }
            else:
                title = info.get('title', 'Unknown Title')
                artist = info.get('artist') or info.get('uploader') or info.get('channel') or 'Unknown Artist'
                duration = info.get('duration') or 0.0
                thumb = info.get('thumbnail') or (info.get('thumbnails', [{}])[-1].get('url') if info.get('thumbnails') else None)
                
                return {
                    "is_playlist": False,
                    "title": title,
                    "count": 1,
                    "items": [{
                        "id": info.get('id') or str(uuid.uuid4()),
                        "url": info.get('webpage_url') or url,
                        "title": title,
                        "artist": artist,
                        "album": "Singles",
                        "duration": duration,
                        "thumbnail": thumb
                    }]
                }
        except Exception as e:
            logger.error(f"Error analyzing URL {url}: {e}")
            raise

    async def add_download(self, item: Dict[str, Any]) -> DownloadJob:
        job_id = str(uuid.uuid4())
        job = DownloadJob(
            job_id=job_id,
            url=item["url"],
            title=item.get("title", "Unknown Title"),
            artist=item.get("artist", "Unknown Artist"),
            album=item.get("album", "Downloads"),
            thumbnail=item.get("thumbnail", ""),
            duration=item.get("duration", 0.0)
        )
        self.jobs[job_id] = job
        await self.queue.put(job)
        await self.emit_update(job)

        if not self.is_running:
            asyncio.create_task(self.worker())

        return job

    async def cancel_job(self, job_id: str) -> bool:
        if job_id in self.jobs:
            job = self.jobs[job_id]
            job.cancel_requested = True
            job.status = "cancelled"
            job.error_message = "Cancelled by user"
            await self.emit_update(job)
            return True
        return False

    async def retry_job(self, job_id: str) -> bool:
        if job_id in self.jobs:
            job = self.jobs[job_id]
            job.status = "queued"
            job.progress = 0.0
            job.error_message = None
            job.cancel_requested = False
            await self.queue.put(job)
            await self.emit_update(job)
            if not self.is_running:
                asyncio.create_task(self.worker())
            return True
        return False

    def clear_completed(self):
        to_delete = [jid for jid, j in self.jobs.items() if j.status in ("complete", "cancelled", "error")]
        for jid in to_delete:
            del self.jobs[jid]

    async def worker(self):
        self.is_running = True
        try:
            while not self.queue.empty():
                job: DownloadJob = await self.queue.get()
                if job.cancel_requested:
                    self.queue.task_done()
                    continue

                try:
                    await self.process_download(job)
                except Exception as e:
                    logger.error(f"Failed job {job.id}: {e}")
                    job.status = "error"
                    job.error_message = str(e)
                    await self.emit_update(job)
                finally:
                    self.queue.task_done()
        finally:
            self.is_running = False

    async def process_download(self, job: DownloadJob):
        settings = await get_settings()
        music_dir = settings.get("music_directory", os.path.join(os.path.expanduser("~"), "Music", "Sonora"))
        
        # Organize path: Music/Artist/Album/Title.mp3
        artist_folder = sanitize_filename(job.artist) or "Unknown Artist"
        album_folder = sanitize_filename(job.album) or "Unknown Album"
        song_file = sanitize_filename(job.title) or f"Track_{job.id[:6]}"
        
        target_dir = os.path.join(music_dir, artist_folder, album_folder)
        os.makedirs(target_dir, exist_ok=True)
        
        output_template = os.path.join(target_dir, f"{song_file}.%(ext)s")
        final_mp3_path = os.path.join(target_dir, f"{song_file}.mp3")

        job.status = "downloading"
        await self.emit_update(job)

        loop = asyncio.get_event_loop()

        def ytdl_hook(d):
            if job.cancel_requested:
                raise Exception("Download cancelled by user")
            if d['status'] == 'downloading':
                total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                downloaded = d.get('downloaded_bytes') or 0
                if total_bytes > 0:
                    job.progress = (downloaded / total_bytes) * 90.0 # 0 - 90%
                speed = d.get('speed')
                if speed:
                    if speed > 1024 * 1024:
                        job.speed = f"{speed / (1024 * 1024):.1f} MB/s"
                    else:
                        job.speed = f"{speed / 1024:.1f} KB/s"
                eta = d.get('eta')
                if eta:
                    mins = eta // 60
                    secs = eta % 60
                    job.eta = f"{mins:02d}:{secs:02d}"
                asyncio.run_coroutine_threadsafe(self.emit_update(job), loop)
            elif d['status'] == 'finished':
                job.status = "converting"
                job.progress = 92.0
                asyncio.run_coroutine_threadsafe(self.emit_update(job), loop)

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '320',
            }],
            'progress_hooks': [ytdl_hook],
            'quiet': True,
            'no_warnings': True,
        }

        def _download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([job.url])

        await loop.run_in_executor(None, _download)

        # Download and embed thumbnail & ID3 metadata
        job.status = "tagging"
        job.progress = 96.0
        await self.emit_update(job)

        # Find the generated audio file
        actual_path = final_mp3_path
        if not os.path.exists(actual_path):
            # Find any audio file matching in target_dir
            for f in os.listdir(target_dir):
                if f.startswith(song_file):
                    actual_path = os.path.join(target_dir, f)
                    break

        job.file_path = actual_path

        # Inject ID3 tags
        try:
            def _tag():
                try:
                    audio = EasyID3(actual_path)
                except Exception:
                    audio = EasyID3()
                    audio.save(actual_path)

                audio['title'] = job.title
                audio['artist'] = job.artist
                audio['album'] = job.album
                audio.save(actual_path)

                # Embed thumbnail
                if job.thumbnail and actual_path.endswith('.mp3'):
                    try:
                        thumb_data = urllib.request.urlopen(job.thumbnail, timeout=10).read()
                        id3 = ID3(actual_path)
                        id3.add(APIC(
                            encoding=3,
                            mime='image/jpeg',
                            type=3, # Front cover
                            desc='Cover',
                            data=thumb_data
                        ))
                        id3.save(v2_version=3)
                    except Exception as te:
                        logger.warning(f"Could not embed thumbnail: {te}")

            await loop.run_in_executor(None, _tag)
        except Exception as e:
            logger.warning(f"Tagging error for {actual_path}: {e}")

        # Add to SQLite Library
        meta = extract_metadata(actual_path)
        now_iso = datetime.datetime.now().isoformat()
        async with get_db_connection() as db:
            await db.execute("""
                INSERT OR REPLACE INTO songs (
                    id, title, artist, album, genre, duration,
                    file_path, cover_path, date_added, play_count,
                    favorite, track_number, year
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
            """, (
                meta["id"], meta["title"], meta["artist"], meta["album"],
                meta["genre"], meta["duration"], meta["file_path"],
                meta["cover_path"], now_iso, meta["track_number"], meta["year"]
            ))
            
            # Refresh artist/album tables
            await db.execute("""
                INSERT OR REPLACE INTO artists (id, name, song_count, album_count, cover_path)
                SELECT 
                    LOWER(artist) as id, 
                    artist as name, 
                    COUNT(*) as song_count, 
                    COUNT(DISTINCT album) as album_count,
                    MIN(cover_path) as cover_path
                FROM songs
                WHERE artist = ?
                GROUP BY artist
            """, (meta["artist"],))
            
            await db.execute("""
                INSERT OR REPLACE INTO albums (id, name, artist, cover_path, year, song_count)
                SELECT 
                    LOWER(album || '---' || artist) as id,
                    album as name,
                    artist,
                    MIN(cover_path) as cover_path,
                    MIN(year) as year,
                    COUNT(*) as song_count
                FROM songs
                WHERE album = ? AND artist = ?
                GROUP BY album, artist
            """, (meta["album"], meta["artist"]))
            
            await db.commit()

        job.status = "complete"
        job.progress = 100.0
        job.speed = "--"
        job.eta = "00:00"
        await self.emit_update(job)
        logger.info(f"Completed download job: {job.title} by {job.artist}")

download_manager = DownloadManager()
