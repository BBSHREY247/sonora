import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Song, Album, Artist, Playlist, DownloadJob, PlaylistWithSongs } from '../plugins';
import { Library, Download, Settings } from '../plugins';

type ActiveView = 
  | 'home'
  | 'songs'
  | 'albums'
  | 'album-detail'
  | 'artists'
  | 'artist-detail'
  | 'playlists'
  | 'playlist-detail'
  | 'favorites'
  | 'downloads'
  | 'search'
  | 'settings';

interface LibraryContextType {
  songs: Song[];
  favoriteSongs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  downloads: DownloadJob[];
  settings: Record<string, string>;
  activeView: ActiveView;
  selectedAlbum: Album | null;
  selectedArtist: Artist | null;
  selectedPlaylist: PlaylistWithSongs | null;
  isScanning: boolean;
  activeDownloadsCount: number;
  
  // Actions
  setActiveView: (view: ActiveView) => void;
  refreshLibrary: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  refreshDownloads: () => Promise<void>;
  triggerScan: () => Promise<void>;
  toggleFavorite: (songId: number, favorite: boolean) => Promise<void>;
  createNewPlaylist: (name: string, description?: string, songIds?: number[]) => Promise<number>;
  deletePlaylistById: (id: number) => Promise<void>;
  addSongToPlaylistById: (playlistId: number, songId: number) => Promise<void>;
  removeSongFromPlaylistById: (playlistId: number, songId: number) => Promise<void>;
  openAlbumDetail: (album: Album) => void;
  openArtistDetail: (artist: Artist) => void;
  openPlaylistDetail: (playlist: PlaylistWithSongs) => void;
  getSongsByAlbum: (albumName: string, artistName: string) => Promise<Song[]>;
  getSongsByArtist: (artistName: string) => Promise<Song[]>;
  saveAppSettings: (newSettings: Record<string, string>) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [downloads, setDownloads] = useState<DownloadJob[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithSongs | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const activeDownloadsCount = downloads.filter(d => 
    d.status === 'queued' || d.status === 'downloading' || d.status === 'processing' || d.status === 'tagging'
  ).length;

  const refreshLibrary = useCallback(async () => {
    try {
      const [allSongs, favSongs, allAlbums, allArtists, allPlaylists] = await Promise.all([
        Library.getSongs(),
        Library.getFavorites(),
        Library.getAlbums(),
        Library.getArtists(),
        Library.getPlaylists(),
      ]);
      setSongs(allSongs.songs);
      setFavoriteSongs(favSongs.songs);
      setAlbums(allAlbums.albums);
      setArtists(allArtists.artists);
      setPlaylists(allPlaylists.playlists);
    } catch (e) {
      console.error('Error fetching library:', e);
    }
  }, []);

  const refreshPlaylists = async () => {
    try {
      const allPlaylists = await Library.getPlaylists();
      setPlaylists(allPlaylists.playlists);
    } catch (e) {
      console.error('Error fetching playlists:', e);
    }
  };

  const refreshDownloads = async () => {
    try {
      const list = await Download.getDownloads();
      setDownloads(list.downloads);
    } catch (e) {
      console.error('Error fetching downloads:', e);
    }
  };

  const loadSettings = async () => {
    try {
      const current = await Settings.getSettings();
      setSettings(current);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  };

  const saveAppSettings = async (newSettings: Record<string, string>) => {
    try {
      await Settings.setMultipleSettings({ settings: newSettings });
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (e) {
      console.error('Error saving settings:', e);
      throw e;
    }
  };

  useEffect(() => {
    refreshLibrary();
    refreshDownloads();
    loadSettings();
  }, [refreshLibrary]);

  const triggerScan = async () => {
    setIsScanning(true);
    try {
      await Library.scanLibrary();
      await refreshLibrary();
    } finally {
      setIsScanning(false);
    }
  };

  const toggleFavorite = async (songId: number, favorite: boolean) => {
    try {
      await Library.toggleFavorite({ songId, favorite });
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, favorite } : s));
      if (favorite) {
        const target = songs.find(s => s.id === songId);
        if (target) {
          setFavoriteSongs(prev => [{ ...target, favorite: true }, ...prev]);
        }
      } else {
        setFavoriteSongs(prev => prev.filter(s => s.id !== songId));
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  const createNewPlaylist = async (name: string, description?: string, songIds: number[] = []) => {
    const result = await Library.createPlaylist({ name, songIds });
    await refreshPlaylists();
    return result.id;
  };

  const deletePlaylistById = async (id: number) => {
    await Library.deletePlaylist({ id });
    await refreshPlaylists();
    if (selectedPlaylist?.playlist.id === id) {
      setActiveView('playlists');
      setSelectedPlaylist(null);
    }
  };

  const addSongToPlaylistById = async (playlistId: number, songId: number) => {
    await Library.addSongToPlaylist({ playlistId, songId });
    await refreshPlaylists();
    if (selectedPlaylist?.playlist.id === playlistId) {
      const updated = await Library.getPlaylistSongs({ playlistId });
      setSelectedPlaylist(updated);
    }
  };

  const removeSongFromPlaylistById = async (playlistId: number, songId: number) => {
    await Library.removeSongFromPlaylist({ playlistId, songId });
    await refreshPlaylists();
    if (selectedPlaylist?.playlist.id === playlistId) {
      const updated = await Library.getPlaylistSongs({ playlistId });
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

  const openPlaylistDetail = (playlist: PlaylistWithSongs) => {
    setSelectedPlaylist(playlist);
    setActiveView('playlist-detail');
  };

  const getSongsByAlbum = async (albumName: string, artistName: string): Promise<Song[]> => {
    return songs.filter(s => s.album === albumName && s.artist === artistName);
  };

  const getSongsByArtist = async (artistName: string): Promise<Song[]> => {
    return songs.filter(s => s.artist === artistName);
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
        getSongsByAlbum,
        getSongsByArtist,
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