import aiosqlite
import os
import json
import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

logger = logging.getLogger("sonora.db")

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DB_PATH = os.path.join(DB_DIR, "sonora.db")

@asynccontextmanager
async def get_db_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        yield db

async def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    async with get_db_connection() as db:
        # Songs table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT DEFAULT 'Unknown Artist',
                album TEXT DEFAULT 'Unknown Album',
                genre TEXT DEFAULT 'Unknown Genre',
                duration REAL DEFAULT 0.0,
                file_path TEXT UNIQUE NOT NULL,
                cover_path TEXT,
                date_added TEXT NOT NULL,
                play_count INTEGER DEFAULT 0,
                last_played TEXT,
                favorite INTEGER DEFAULT 0,
                track_number INTEGER DEFAULT 0,
                year INTEGER
            )
        """)
        
        # Albums table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS albums (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                artist TEXT DEFAULT 'Unknown Artist',
                cover_path TEXT,
                year INTEGER,
                song_count INTEGER DEFAULT 0
            )
        """)
        
        # Artists table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS artists (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                song_count INTEGER DEFAULT 0,
                album_count INTEGER DEFAULT 0,
                cover_path TEXT
            )
        """)
        
        # Playlists table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                cover_path TEXT,
                created_at TEXT NOT NULL
            )
        """)
        
        # Playlist songs junction
        await db.execute("""
            CREATE TABLE IF NOT EXISTS playlist_songs (
                id TEXT PRIMARY KEY,
                playlist_id TEXT NOT NULL,
                song_id TEXT NOT NULL,
                position INTEGER NOT NULL,
                added_at TEXT NOT NULL,
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
            )
        """)
        
        # Play history table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS play_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                song_id TEXT NOT NULL,
                played_at TEXT NOT NULL,
                FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
            )
        """)
        
        # Settings table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        
        # Indexes for fast querying
        await db.execute("CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_songs_favorite ON songs(favorite)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_songs_date_added ON songs(date_added)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_playlist_songs_pid ON playlist_songs(playlist_id)")
        
        # Default settings if not existing
        default_settings = {
            "music_directory": os.path.join(os.path.expanduser("~"), "Music", "Sonora"),
            "download_directory": os.path.join(os.path.expanduser("~"), "Music", "Sonora", "Downloads"),
            "audio_format": "mp3",
            "audio_quality": "320k",
            "auto_scan": "true",
            "crossfade_seconds": "0",
            "theme_accent": "#00E599"
        }
        for k, v in default_settings.items():
            await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))
            
        await db.commit()
        logger.info("SQLite Database initialized successfully.")

# Helper queries
async def get_all_songs(sort_by: str = "title", order: str = "ASC", favorite_only: bool = False) -> List[Dict[str, Any]]:
    allowed_sorts = {"title", "artist", "album", "date_added", "duration", "play_count", "track_number"}
    sort_col = sort_by if sort_by in allowed_sorts else "title"
    order_dir = "DESC" if order.upper() == "DESC" else "ASC"
    
    async with get_db_connection() as db:
        query = f"SELECT * FROM songs"
        params = []
        if favorite_only:
            query += " WHERE favorite = 1"
        query += f" ORDER BY {sort_col} {order_dir}"
        
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_song_by_id(song_id: str) -> Optional[Dict[str, Any]]:
    async with get_db_connection() as db:
        async with db.execute("SELECT * FROM songs WHERE id = ?", (song_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

async def toggle_favorite(song_id: str) -> bool:
    async with get_db_connection() as db:
        async with db.execute("SELECT favorite FROM songs WHERE id = ?", (song_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return False
            new_fav = 0 if row["favorite"] else 1
            
        await db.execute("UPDATE songs SET favorite = ? WHERE id = ?", (new_fav, song_id))
        await db.commit()
        return bool(new_fav)

async def record_play(song_id: str, timestamp: str):
    async with get_db_connection() as db:
        await db.execute("""
            UPDATE songs 
            SET play_count = play_count + 1, last_played = ? 
            WHERE id = ?
        """, (timestamp, song_id))
        await db.execute("INSERT INTO play_history (song_id, played_at) VALUES (?, ?)", (song_id, timestamp))
        await db.commit()

async def get_recently_played(limit: int = 10) -> List[Dict[str, Any]]:
    async with get_db_connection() as db:
        query = """
            SELECT DISTINCT s.* 
            FROM play_history ph 
            JOIN songs s ON ph.song_id = s.id 
            ORDER BY ph.played_at DESC 
            LIMIT ?
        """
        async with db.execute(query, (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_recently_added(limit: int = 12) -> List[Dict[str, Any]]:
    async with get_db_connection() as db:
        query = "SELECT * FROM songs ORDER BY date_added DESC LIMIT ?"
        async with db.execute(query, (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_albums() -> List[Dict[str, Any]]:
    async with get_db_connection() as db:
        query = """
            SELECT 
                album as name, 
                artist, 
                MIN(cover_path) as cover_path, 
                MIN(year) as year, 
                COUNT(*) as song_count 
            FROM songs 
            GROUP BY album, artist 
            ORDER BY album ASC
        """
        async with db.execute(query) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_album_songs(album_name: str, artist_name: Optional[str] = None) -> List[Dict[str, Any]]:
    async with get_db_connection() as db:
        if artist_name:
            query = "SELECT * FROM songs WHERE album = ? AND artist = ? ORDER BY track_number ASC, title ASC"
            params = (album_name, artist_name)
        else:
            query = "SELECT * FROM songs WHERE album = ? ORDER BY track_number ASC, title ASC"
            params = (album_name,)
            
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_artists() -> List[Dict[str, Any]]:
    async with get_db_connection() as db:
        query = """
            SELECT 
                artist as name, 
                COUNT(*) as song_count, 
                COUNT(DISTINCT album) as album_count, 
                MIN(cover_path) as cover_path 
            FROM songs 
            GROUP BY artist 
            ORDER BY artist ASC
        """
        async with db.execute(query) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_artist_songs(artist_name: str) -> List[Dict[str, Any]]:
    async with get_db_connection() as db:
        query = "SELECT * FROM songs WHERE artist = ? ORDER BY album ASC, track_number ASC, title ASC"
        async with db.execute(query, (artist_name,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_playlists() -> List[Dict[str, Any]]:
    async with get_db_connection() as db:
        query = """
            SELECT 
                p.*, 
                COUNT(ps.song_id) as song_count,
                COALESCE(p.cover_path, MIN(s.cover_path)) as dynamic_cover
            FROM playlists p
            LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
            LEFT JOIN songs s ON ps.song_id = s.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """
        async with db.execute(query) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_playlist_by_id(playlist_id: str) -> Optional[Dict[str, Any]]:
    async with get_db_connection() as db:
        async with db.execute("SELECT * FROM playlists WHERE id = ?", (playlist_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            playlist = dict(row)
            
        # Get songs in order
        song_query = """
            SELECT s.*, ps.id as playlist_item_id, ps.position, ps.added_at
            FROM playlist_songs ps
            JOIN songs s ON ps.song_id = s.id
            WHERE ps.playlist_id = ?
            ORDER BY ps.position ASC
        """
        async with db.execute(song_query, (playlist_id,)) as cursor:
            songs = await cursor.fetchall()
            playlist["songs"] = [dict(s) for s in songs]
            return playlist

async def create_playlist(playlist_id: str, name: str, description: str = "", cover_path: Optional[str] = None, created_at: str = "") -> Dict[str, Any]:
    async with get_db_connection() as db:
        await db.execute("""
            INSERT INTO playlists (id, name, description, cover_path, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (playlist_id, name, description, cover_path, created_at))
        await db.commit()
        return {"id": playlist_id, "name": name, "description": description, "cover_path": cover_path, "created_at": created_at}

async def add_song_to_playlist(playlist_id: str, song_id: str, added_at: str) -> bool:
    import uuid
    async with get_db_connection() as db:
        # get max position
        async with db.execute("SELECT COALESCE(MAX(position), -1) as max_pos FROM playlist_songs WHERE playlist_id = ?", (playlist_id,)) as cursor:
            row = await cursor.fetchone()
            next_pos = row["max_pos"] + 1 if row else 0
            
        item_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO playlist_songs (id, playlist_id, song_id, position, added_at)
            VALUES (?, ?, ?, ?, ?)
        """, (item_id, playlist_id, song_id, next_pos, added_at))
        await db.commit()
        return True

async def remove_song_from_playlist(playlist_id: str, item_id: str) -> bool:
    async with get_db_connection() as db:
        await db.execute("DELETE FROM playlist_songs WHERE playlist_id = ? AND (id = ? OR song_id = ?)", (playlist_id, item_id, item_id))
        await db.commit()
        return True

async def delete_playlist(playlist_id: str) -> bool:
    async with get_db_connection() as db:
        await db.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
        await db.commit()
        return True

async def search_all(query: str) -> Dict[str, List[Dict[str, Any]]]:
    pattern = f"%{query}%"
    async with get_db_connection() as db:
        # Songs
        async with db.execute("SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? LIMIT 20", (pattern, pattern, pattern)) as cursor:
            songs = [dict(r) for r in await cursor.fetchall()]
            
        # Artists
        async with db.execute("SELECT artist as name, COUNT(*) as song_count, MIN(cover_path) as cover_path FROM songs WHERE artist LIKE ? GROUP BY artist LIMIT 10", (pattern,)) as cursor:
            artists = [dict(r) for r in await cursor.fetchall()]
            
        # Albums
        async with db.execute("SELECT album as name, artist, MIN(cover_path) as cover_path, MIN(year) as year, COUNT(*) as song_count FROM songs WHERE album LIKE ? OR artist LIKE ? GROUP BY album, artist LIMIT 10", (pattern, pattern)) as cursor:
            albums = [dict(r) for r in await cursor.fetchall()]
            
        # Playlists
        async with db.execute("SELECT * FROM playlists WHERE name LIKE ? OR description LIKE ? LIMIT 10", (pattern, pattern)) as cursor:
            playlists = [dict(r) for r in await cursor.fetchall()]
            
        return {
            "songs": songs,
            "artists": artists,
            "albums": albums,
            "playlists": playlists
        }

async def get_settings() -> Dict[str, str]:
    async with get_db_connection() as db:
        async with db.execute("SELECT key, value FROM settings") as cursor:
            rows = await cursor.fetchall()
            return {r["key"]: r["value"] for r in rows}

async def update_setting(key: str, value: str):
    async with get_db_connection() as db:
        await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
        await db.commit()
