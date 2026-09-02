import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Song, Album, Artist, Playlist, DownloadJob, AppSettings, ActiveView } from '../types';
import { api } from '../services/api';

interface LibraryContextType {
  songs: Song[];
  favoriteSongs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  downloads: DownloadJob[];
  settings: AppSettings | null;
  activeView: ActiveView;
  selectedAlbum: Album | null;
  selectedArtist: Artist | null;
  selectedPlaylist: Playlist | null;
  isScanning: boolean;
  activeDownloadsCount: number;
  
  // Actions
  setActiveView: (view: ActiveView) => void;
  refreshLibrary: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  refreshDownloads: () => Promise<void>;
  triggerScan: (dir?: string) => Promise<any>;
  toggleFavorite: (songId: string) => Promise<void>;
  createNewPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylistById: (id: string) => Promise<void>;
  addSongToPlaylistById: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylistById: (playlistId: string, itemId: string) => Promise<void>;
  openAlbumDetail: (album: Album) => void;
  openArtistDetail: (artist: Artist) => void;
  openPlaylistDetail: (playlist: Playlist) => void;
  saveAppSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [downloads, setDownloads] = useState<DownloadJob[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const activeDownloadsCount = downloads.filter(d => 
    d.status === 'queued' || d.status === 'downloading' || d.status === 'converting' || d.status === 'tagging'
  ).length;

  const refreshLibrary = useCallback(async () => {
    try {
      const [allSongs, favSongs, allAlbums, allArtists, allPlaylists] = await Promise.all([
        api.getSongs(),
        api.getSongs('title', 'ASC', true),
        api.getAlbums(),
        api.getArtists(),
        api.getPlaylists()
      ]);
      setSongs(allSongs);
      setFavoriteSongs(favSongs);
      setAlbums(allAlbums);
      setArtists(allArtists);
      setPlaylists(allPlaylists);
    } catch (e) {
      console.error('Error fetching library:', e);
    }
  }, []);

  const refreshPlaylists = async () => {
    try {
      const allPlaylists = await api.getPlaylists();
      setPlaylists(allPlaylists);
    } catch (e) {
      console.error('Error fetching playlists:', e);
    }
  };

  const refreshDownloads = async () => {
    try {
      const list = await api.getDownloads();
      setDownloads(list);
    } catch (e) {
      console.error('Error fetching downloads:', e);
    }
  };

  const loadSettings = async () => {
    try {
      const current = await api.getSettings();
      setSettings(current);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  };

  const saveAppSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = await api.saveSettings(newSettings);
      setSettings(updated);
    } catch (e) {
      console.error('Error saving settings:', e);
      throw e;
    }
  };

  // Initial load & WebSocket subscription
  useEffect(() => {
    refreshLibrary();
    refreshDownloads();
    loadSettings();

    // WebSocket for real-time download and library notifications
    let ws: WebSocket | null = null;
    try {
      ws = api.createDownloadWebSocket((data) => {
        if (data.type === 'DOWNLOAD_UPDATE') {
          setDownloads(prev => {
            const index = prev.findIndex(j => j.id === data.job.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = data.job;
              return updated;
            }
            return [data.job, ...prev];
          });
          // If job completed, auto-refresh library to show new song
          if (data.job.status === 'complete') {
            refreshLibrary();
          }
        } else if (data.type === 'DOWNLOAD_SNAPSHOT') {
          setDownloads(data.jobs || []);
        } else if (data.type === 'LIBRARY_UPDATED') {
          refreshLibrary();
        }
      });
    } catch (e) {
      console.warn('Could not initialize WebSocket:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [refreshLibrary]);

  const triggerScan = async (dir?: string) => {
    setIsScanning(true);
    try {
      const res = await api.scanLibrary(dir);
      await refreshLibrary();
      return res;
    } finally {
      setIsScanning(false);
    }
  };

  const toggleFavorite = async (songId: string) => {
    try {
      const isFav = await api.toggleFavorite(songId);
      // Optimistic update
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, favorite: isFav } : s));
      if (isFav) {
        const target = songs.find(s => s.id === songId);
        if (target) {
          setFavoriteSongs(prev => [{ ...target, favorite: 1 }, ...prev]);
        }
      } else {
        setFavoriteSongs(prev => prev.filter(s => s.id !== songId));
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  const createNewPlaylist = async (name: string, description: string = '') => {
    const pl = await api.createPlaylist(name, description);
    await refreshPlaylists();
    return pl;
  };

  const deletePlaylistById = async (id: string) => {
    await api.deletePlaylist(id);
    await refreshPlaylists();
    if (selectedPlaylist?.id === id) {
      setActiveView('playlists');
      setSelectedPlaylist(null);
    }
  };

  const addSongToPlaylistById = async (playlistId: string, songId: string) => {
    await api.addSongToPlaylist(playlistId, songId);
    await refreshPlaylists();
    if (selectedPlaylist?.id === playlistId) {
      const updated = await api.getPlaylist(playlistId);
      setSelectedPlaylist(updated);
    }
  };

  const removeSongFromPlaylistById = async (playlistId: string, itemId: string) => {
    await api.removeSongFromPlaylist(playlistId, itemId);
    await refreshPlaylists();
    if (selectedPlaylist?.id === playlistId) {
      const updated = await api.getPlaylist(playlistId);
      setSelectedPlaylist(updated);
    }
  };

  const openAlbumDetail = (album: Album) => {
    setSelectedAlbum(album);
    setActiveView('album-detail');
  };

  const openArtistDetail = (artist: Artist) => {
    setSelectedArtist(artist);
    setActiveView('artist-detail');
  };

  const openPlaylistDetail = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setActiveView('playlist-detail');
  };

  return (
    <LibraryContext.Provider
      value={{
        songs,
        favoriteSongs,
        albums,
        artists,
        playlists,
        downloads,
        settings,
        activeView,
        selectedAlbum,
        selectedArtist,
        selectedPlaylist,
        isScanning,
        activeDownloadsCount,
        setActiveView,
        refreshLibrary,
        refreshPlaylists,
        refreshDownloads,
        triggerScan,
        toggleFavorite,
        createNewPlaylist,
        deletePlaylistById,
        addSongToPlaylistById,
        removeSongFromPlaylistById,
        openAlbumDetail,
        openArtistDetail,
        openPlaylistDetail,
        saveAppSettings
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
};
