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

export type DownloadStatus = 'queued' | 'downloading' | 'processing' | 'tagging' | 'completed' | 'failed' | 'cancelled';

export interface DownloadJob {
  id: number;
  title: string;
  artist?: string;
  sourceUrl: string;
  outputPath?: string;
  fileSize?: number;
  downloadedBytes: number;
  status: DownloadStatus;
  errorMessage?: string;
  progress: number;
  speed?: number;
  eta?: number;
  dateCreated: number;
  dateStarted?: number;
  dateCompleted?: number;
  songId?: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface AppSettings {
  music_directory: string;
  audio_format: string;
  audio_quality: string;
  auto_scan: string;
  theme_accent: string;
}

export type ActiveView = 
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