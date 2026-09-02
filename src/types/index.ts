export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  file_path: string;
  cover_path: string | null;
  date_added: string;
  play_count: number;
  last_played: string | null;
  favorite: number | boolean;
  track_number: number;
  year: number | null;
}

export interface Album {
  name: string;
  artist: string;
  cover_path: string | null;
  year: number | null;
  song_count: number;
}

export interface Artist {
  name: string;
  song_count: number;
  album_count: number;
  cover_path: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_path: string | null;
  created_at: string;
  song_count?: number;
  dynamic_cover?: string | null;
  songs?: Song[];
}

export type DownloadStatus = 'queued' | 'downloading' | 'converting' | 'tagging' | 'complete' | 'error' | 'cancelled';

export interface DownloadJob {
  id: string;
  url: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  duration: number;
  status: DownloadStatus;
  progress: number;
  speed: string;
  eta: string;
  error?: string | null;
  file_path?: string | null;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface AppSettings {
  music_directory: string;
  download_directory: string;
  audio_format: string;
  audio_quality: string;
  auto_scan: string;
  crossfade_seconds: string;
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
