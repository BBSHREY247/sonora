import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export interface Song {
  id: number;
  uri: string;
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  duration: number;
  genre?: string;
  year?: number;
  trackNumber?: number;
  artworkUri?: string;
  favorite: boolean;
  playCount: number;
  lastPlayed?: number;
  dateAdded: number;
  isAvailable: boolean;
}

export interface Album {
  id: number;
  name: string;
  artist: string;
  artworkUri?: string;
  year?: number;
  songCount: number;
  totalDuration: number;
}

export interface Artist {
  id: number;
  name: string;
  artworkUri?: string;
  songCount: number;
  albumCount: number;
}

export interface Playlist {
  id: number;
  name: string;
  artworkUri?: string;
  description?: string;
  dateCreated: number;
  dateModified: number;
  songCount: number;
  totalDuration: number;
}

export interface PlaylistWithSongs {
  playlist: Playlist;
  songs: Song[];
}

export interface DownloadJob {
  id: number;
  title: string;
  artist?: string;
  sourceUrl: string;
  outputPath?: string;
  fileSize?: number;
  downloadedBytes: number;
  status: string;
  errorMessage?: string;
  progress: number;
  speed?: number;
  eta?: number;
  dateCreated: number;
  dateStarted?: number;
  dateCompleted?: number;
  songId?: number;
}

export interface StorageStats {
  total: number;
  free: number;
}

export interface LibraryPlugin {
  getSongs(): Promise<{ songs: Song[] }>;
  getFavorites(): Promise<{ songs: Song[] }>;
  getAlbums(): Promise<{ albums: Album[] }>;
  getArtists(): Promise<{ artists: Artist[] }>;
  getPlaylists(): Promise<{ playlists: Playlist[] }>;
  getPlaylistSongs(options: { playlistId: number }): Promise<{ playlist: Playlist; songs: Song[] }>;
  createPlaylist(options: { name: string; songIds?: number[] }): Promise<{ id: number }>;
  updatePlaylist(options: { id: number; name?: string }): Promise<void>;
  deletePlaylist(options: { id: number }): Promise<void>;
  addSongToPlaylist(options: { playlistId: number; songId: number }): Promise<void>;
  removeSongFromPlaylist(options: { playlistId: number; songId: number }): Promise<void>;
  toggleFavorite(options: { songId: number; favorite: boolean }): Promise<void>;
  getRecentlyAdded(options: { limit?: number }): Promise<{ songs: Song[] }>;
  getRecentlyPlayed(options: { limit?: number }): Promise<{ songs: Song[] }>;
  searchSongs(options: { query: string }): Promise<{ songs: Song[] }>;
  recordPlay(options: { songId: number }): Promise<void>;
  scanLibrary(): Promise<{ success: boolean }>;
}

export interface PlayerPlugin {
  playSong(options: { song: Song }): Promise<void>;
  playSongs(options: { songs: Song[]; startIndex?: number }): Promise<void>;
  togglePlayPause(): Promise<void>;
  playNext(): Promise<void>;
  playPrevious(): Promise<void>;
  seekTo(options: { position: number }): Promise<void>;
  setVolume(options: { volume: number }): Promise<void>;
  setShuffle(options: { enabled: boolean }): Promise<void>;
  setRepeatMode(options: { mode: number }): Promise<void>;
  getCurrentState(): Promise<{ currentSong?: Song; queueSize: number }>;
  addListener(eventName: 'playbackStateChanged', listener: (data: { playing: boolean }) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'progressChanged', listener: (data: { current: number; duration: number }) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'playbackError', listener: (data: { error: string }) => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

export interface StoragePlugin {
  pickFolder(): Promise<{ uri: string }>;
  getPersistedUris(): Promise<{ uris: string[] }>;
  checkAvailability(options: { uri: string }): Promise<{ available: boolean }>;
  createPyracubeStructure(options: { uri: string }): Promise<{ success: boolean }>;
  getStorageStats(options: { uri: string }): Promise<StorageStats>;
}

export interface DownloadPlugin {
  getDownloads(): Promise<{ downloads: DownloadJob[] }>;
  getActiveDownloads(): Promise<{ downloads: DownloadJob[] }>;
  queueDownload(options: { title: string; artist?: string; sourceUrl: string; metadataJson?: string }): Promise<{ id: number }>;
  cancelDownload(options: { id: number }): Promise<void>;
  retryDownload(options: { id: number }): Promise<void>;
  clearCompleted(): Promise<void>;
  clearFailed(): Promise<void>;
  updateProgress(options: { id: number; bytes: number; progress: number; speed?: number; eta?: number }): Promise<void>;
}

export interface SettingsPlugin {
  getSettings(): Promise<Record<string, string>>;
  getSetting(options: { key: string }): Promise<{ value?: string }>;
  setSetting(options: { key: string; value: string }): Promise<void>;
  setMultipleSettings(options: { settings: Record<string, string> }): Promise<void>;
}

export const Library = registerPlugin<LibraryPlugin>('LibraryPlugin');
export const Player = registerPlugin<PlayerPlugin>('PlayerPlugin');
export const Storage = registerPlugin<StoragePlugin>('StoragePlugin');
export const Download = registerPlugin<DownloadPlugin>('DownloadPlugin');
export const Settings = registerPlugin<SettingsPlugin>('SettingsPlugin');