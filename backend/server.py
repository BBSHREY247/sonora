import os
import mimetypes
import logging
import datetime
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.database.db import (
    init_db, get_all_songs, get_song_by_id, toggle_favorite,
    record_play, get_recently_played, get_recently_added,
    get_albums, get_album_songs, get_artists, get_artist_songs,
    get_playlists, get_playlist_by_id, create_playlist,
    add_song_to_playlist, remove_song_from_playlist, delete_playlist,
    search_all, get_settings, update_setting
)
from backend.library.scanner import scan_directory, COVERS_DIR
from backend.downloader.engine import download_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("sonora.server")

# WebSocket Connection Manager for live events
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

ws_manager = ConnectionManager()

# Link download manager updates to WebSocket broadcast
async def on_download_event(data: dict):
    await ws_manager.broadcast(data)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Sonora Backend...")
    await init_db()
    download_manager.set_broadcast_callback(on_download_event)
    
    # Auto-scan music directory on startup if enabled
    settings = await get_settings()
    if settings.get("auto_scan", "true").lower() == "true":
        music_dir = settings.get("music_directory")
        if music_dir and os.path.exists(music_dir):
            import asyncio
            asyncio.create_task(scan_directory(music_dir))
            
    yield
    logger.info("Sonora Backend shutting down...")

app = FastAPI(title="Sonora API", version="1.0.0", lifespan=lifespan)

# Allow CORS for dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Models -----------------
class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class PlaylistAddSong(BaseModel):
    song_id: str

class SettingsUpdate(BaseModel):
    settings: Dict[str, str]

class AnalyzeRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    items: List[Dict[str, Any]]

class ScanRequest(BaseModel):
    directory: Optional[str] = None

# ----------------- WebSocket -----------------
@app.websocket("/ws/downloads")
async def websocket_downloads(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send current download snapshot
        jobs_list = [job.to_dict() for job in download_manager.jobs.values()]
        await websocket.send_json({"type": "DOWNLOAD_SNAPSHOT", "jobs": jobs_list})
        while True:
            # Keep alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WS error: {e}")
        ws_manager.disconnect(websocket)

# ----------------- Library & Songs -----------------
@app.post("/api/library/scan")
async def trigger_scan(body: ScanRequest):
    settings = await get_settings()
    dir_to_scan = body.directory or settings.get("music_directory")
    if not dir_to_scan or not os.path.exists(dir_to_scan):
        raise HTTPException(status_code=400, detail=f"Directory not found: {dir_to_scan}")
    
    stats = await scan_directory(dir_to_scan)
    await ws_manager.broadcast({"type": "LIBRARY_UPDATED", "stats": stats})
    return {"status": "ok", "stats": stats}

@app.get("/api/songs")
async def list_songs(
    sort_by: str = Query("title", description="Sort by title, artist, album, date_added, duration, play_count"),
    order: str = Query("ASC", description="ASC or DESC"),
    favorite: bool = Query(False, description="Filter favorites only")
):
    songs = await get_all_songs(sort_by=sort_by, order=order, favorite_only=favorite)
    return {"songs": songs, "total": len(songs)}

@app.get("/api/songs/{song_id}")
async def get_song(song_id: str):
    song = await get_song_by_id(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

@app.post("/api/songs/{song_id}/favorite")
async def toggle_song_favorite(song_id: str):
    is_fav = await toggle_favorite(song_id)
    return {"id": song_id, "favorite": is_fav}

@app.post("/api/songs/{song_id}/play")
async def log_song_play(song_id: str):
    now_iso = datetime.datetime.now().isoformat()
    await record_play(song_id, now_iso)
    return {"status": "ok"}

@app.get("/api/recently-played")
async def list_recently_played(limit: int = 10):
    songs = await get_recently_played(limit=limit)
    return {"songs": songs}

@app.get("/api/recently-added")
async def list_recently_added(limit: int = 12):
    songs = await get_recently_added(limit=limit)
    return {"songs": songs}

# ----------------- Albums & Artists -----------------
@app.get("/api/albums")
async def list_albums():
    albums = await get_albums()
    return {"albums": albums}

@app.get("/api/albums/{album_name}/songs")
async def list_album_songs(album_name: str, artist: Optional[str] = None):
    songs = await get_album_songs(album_name, artist_name=artist)
    return {"songs": songs}

@app.get("/api/artists")
async def list_artists():
    artists = await get_artists()
    return {"artists": artists}

@app.get("/api/artists/{artist_name}/songs")
async def list_artist_songs(artist_name: str):
    songs = await get_artist_songs(artist_name)
    return {"songs": songs}

# ----------------- Playlists -----------------
@app.get("/api/playlists")
async def list_playlists():
    playlists = await get_playlists()
    return {"playlists": playlists}

@app.get("/api/playlists/{playlist_id}")
async def get_playlist(playlist_id: str):
    playlist = await get_playlist_by_id(playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@app.post("/api/playlists")
async def create_new_playlist(body: PlaylistCreate):
    import uuid
    pid = str(uuid.uuid4())
    now_iso = datetime.datetime.now().isoformat()
    playlist = await create_playlist(pid, body.name, body.description or "", None, now_iso)
    return playlist

@app.post("/api/playlists/{playlist_id}/songs")
async def add_to_playlist(playlist_id: str, body: PlaylistAddSong):
    now_iso = datetime.datetime.now().isoformat()
    ok = await add_song_to_playlist(playlist_id, body.song_id, now_iso)
    if not ok:
        raise HTTPException(status_code=400, detail="Could not add song to playlist")
    return {"status": "ok"}

@app.delete("/api/playlists/{playlist_id}/songs/{item_id}")
async def remove_from_playlist(playlist_id: str, item_id: str):
    ok = await remove_song_from_playlist(playlist_id, item_id)
    return {"status": "ok" if ok else "failed"}

@app.delete("/api/playlists/{playlist_id}")
async def delete_existing_playlist(playlist_id: str):
    ok = await delete_playlist(playlist_id)
    return {"status": "ok" if ok else "failed"}

# ----------------- Search -----------------
@app.get("/api/search")
async def unified_search(q: str = Query(..., min_length=1)):
    results = await search_all(q)
    return results

# ----------------- Settings -----------------
@app.get("/api/settings")
async def fetch_settings():
    settings = await get_settings()
    return settings

@app.post("/api/settings")
async def save_settings(body: SettingsUpdate):
    for k, v in body.settings.items():
        await update_setting(k, v)
    return {"status": "ok", "settings": await get_settings()}

# ----------------- YouTube / Importer -----------------
@app.post("/api/import/analyze")
async def analyze_import_url(body: AnalyzeRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        data = await download_manager.analyze_url(body.url.strip())
        return data
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/import/download")
async def queue_downloads(body: DownloadRequest):
    if not body.items:
        raise HTTPException(status_code=400, detail="No items to download")
    
    queued_jobs = []
    for item in body.items:
        job = await download_manager.add_download(item)
        queued_jobs.append(job.to_dict())
        
    return {"status": "ok", "queued": len(queued_jobs), "jobs": queued_jobs}

@app.get("/api/downloads")
async def get_downloads():
    jobs = [j.to_dict() for j in download_manager.jobs.values()]
    return {"downloads": jobs}

@app.post("/api/downloads/{job_id}/cancel")
async def cancel_download(job_id: str):
    ok = await download_manager.cancel_job(job_id)
    return {"status": "ok" if ok else "not_found"}

@app.post("/api/downloads/{job_id}/retry")
async def retry_download(job_id: str):
    ok = await download_manager.retry_job(job_id)
    return {"status": "ok" if ok else "not_found"}

@app.post("/api/downloads/clear")
async def clear_downloads():
    download_manager.clear_completed()
    return {"status": "ok"}

# ----------------- Audio Streaming & Artwork Serving -----------------
@app.get("/api/stream/{song_id}")
async def stream_audio(song_id: str, request: Request):
    song = await get_song_by_id(song_id)
    if not song or not os.path.exists(song["file_path"]):
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    path = song["file_path"]
    file_size = os.path.getsize(path)
    content_type, _ = mimetypes.guess_type(path)
    content_type = content_type or "audio/mpeg"

    # Support HTTP 206 Partial Content Range requests for seeking in HTML5 audio
    range_header = request.headers.get("range")
    if range_header:
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0])
        end = int(byte_range[1]) if byte_range[1] else file_size - 1
        length = end - start + 1

        def iterfile():
            with open(path, "rb") as f:
                f.seek(start)
                remaining = length
                chunk_size = 1024 * 64
                while remaining > 0:
                    read_len = min(chunk_size, remaining)
                    data = f.read(read_len)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
            "Content-Type": content_type,
        }
        return StreamingResponse(iterfile(), status_code=206, headers=headers)
    else:
        return FileResponse(path, media_type=content_type, headers={"Accept-Ranges": "bytes"})

@app.get("/api/covers/{cover_file}")
async def get_cover_art(cover_file: str):
    cover_path = os.path.join(COVERS_DIR, cover_file)
    if not os.path.exists(cover_path):
        raise HTTPException(status_code=404, detail="Cover not found")
    media_type = "image/png" if cover_file.endswith(".png") else "image/jpeg"
    return FileResponse(cover_path, media_type=media_type)
