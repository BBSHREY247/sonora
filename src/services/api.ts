import { Song, Album, Artist, Playlist, DownloadJob, AppSettings } from '../types';

const API_BASE = 'http://127.0.0.1:8765';

export const api = {
  // Streaming & Media URLs
  getAudioStreamUrl: (songId: string): string => `${API_BASE}/api/stream/${songId}`,
  getCoverArtUrl: (coverPath: string | null | undefined): string | null => {
    if (!coverPath) return null;
    if (coverPath.startsWith('http')) return coverPath;
    if (coverPath.startsWith('/api/covers/')) return `${API_BASE}${coverPath}`;
    return `${API_BASE}/api/covers/${coverPath}`;
  },

  // Songs
  async getSongs(sortBy: string = 'title', order: string = 'ASC', favorite: boolean = false): Promise<Song[]> {
    const res = await fetch(`${API_BASE}/api/songs?sort_by=${sortBy}&order=${order}&favorite=${favorite}`);
    if (!res.ok) throw new Error('Failed to fetch songs');
    const data = await res.json();
    return data.songs;
  },

  async toggleFavorite(songId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/songs/${songId}/favorite`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    const data = await res.json();
    return data.favorite;
  },

  async recordPlay(songId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/songs/${songId}/play`, { method: 'POST' });
    } catch (e) {
      console.warn('Could not record play:', e);
    }
  },

  async getRecentlyPlayed(limit: number = 10): Promise<Song[]> {
    const res = await fetch(`${API_BASE}/api/recently-played?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.songs;
  },

  async getRecentlyAdded(limit: number = 12): Promise<Song[]> {
    const res = await fetch(`${API_BASE}/api/recently-added?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.songs;
  },

  // Albums & Artists
  async getAlbums(): Promise<Album[]> {
    const res = await fetch(`${API_BASE}/api/albums`);
    if (!res.ok) throw new Error('Failed to fetch albums');
    const data = await res.json();
    return data.albums;
  },

  async getAlbumSongs(albumName: string, artist?: string): Promise<Song[]> {
    const url = new URL(`${API_BASE}/api/albums/${encodeURIComponent(albumName)}/songs`);
    if (artist) url.searchParams.append('artist', artist);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch album songs');
    const data = await res.json();
    return data.songs;
  },

  async getArtists(): Promise<Artist[]> {
    const res = await fetch(`${API_BASE}/api/artists`);
    if (!res.ok) throw new Error('Failed to fetch artists');
    const data = await res.json();
    return data.artists;
  },

  async getArtistSongs(artistName: string): Promise<Song[]> {
    const res = await fetch(`${API_BASE}/api/artists/${encodeURIComponent(artistName)}/songs`);
    if (!res.ok) throw new Error('Failed to fetch artist songs');
    const data = await res.json();
    return data.songs;
  },

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    const res = await fetch(`${API_BASE}/api/playlists`);
    if (!res.ok) throw new Error('Failed to fetch playlists');
    const data = await res.json();
    return data.playlists;
  },

  async getPlaylist(id: string): Promise<Playlist> {
    const res = await fetch(`${API_BASE}/api/playlists/${id}`);
    if (!res.ok) throw new Error('Failed to fetch playlist');
    return await res.json();
  },

  async createPlaylist(name: string, description: string = ''): Promise<Playlist> {
    const res = await fetch(`${API_BASE}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create playlist');
    return await res.json();
  },

  async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId }),
    });
    if (!res.ok) throw new Error('Failed to add song to playlist');
  },

  async removeSongFromPlaylist(playlistId: string, itemId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs/${itemId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove song from playlist');
  },

  async deletePlaylist(playlistId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete playlist');
  },

  // Search
  async search(query: string): Promise<{ songs: Song[]; artists: Artist[]; albums: Album[]; playlists: Playlist[] }> {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search request failed');
    return await res.json();
  },

  // Settings & Scan
  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    const data = await res.json();
    return data.settings;
  },

  async scanLibrary(directory?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/library/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directory }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to scan library');
    }
    return await res.json();
  },

  // Importer & Downloads
  async analyzeImportUrl(url: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/import/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to analyze URL');
    }
    return await res.json();
  },

  async queueDownloads(items: any[]): Promise<any> {
    const res = await fetch(`${API_BASE}/api/import/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('Failed to queue downloads');
    return await res.json();
  },

  async getDownloads(): Promise<DownloadJob[]> {
    const res = await fetch(`${API_BASE}/api/downloads`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.downloads;
  },

  async cancelDownload(jobId: string): Promise<void> {
    await fetch(`${API_BASE}/api/downloads/${jobId}/cancel`, { method: 'POST' });
  },

  async retryDownload(jobId: string): Promise<void> {
    await fetch(`${API_BASE}/api/downloads/${jobId}/retry`, { method: 'POST' });
  },

  async clearCompletedDownloads(): Promise<void> {
    await fetch(`${API_BASE}/api/downloads/clear`, { method: 'POST' });
  },

  // WebSocket for Live Download Events
  createDownloadWebSocket(onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(`ws://127.0.0.1:8765/ws/downloads`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };
    return ws;
  }
};
