import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Shuffle, ListMusic, Trash2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongRow';
import { PlaylistWithSongs, Song } from '../types';

export const PlaylistDetailView: React.FC = () => {
  const { selectedPlaylist, setActiveView, deletePlaylistById, removeSongFromPlaylistById } = useLibrary();
  const { playList, toggleShuffle } = usePlayer();
  const [playlistData, setPlaylistData] = useState<PlaylistWithSongs | null>(selectedPlaylist);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedPlaylist) {
      setPlaylistData(selectedPlaylist);
    }
  }, [selectedPlaylist]);

  if (!selectedPlaylist || !playlistData) return null;

  const songs: Song[] = playlistData.songs || [];

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playList(songs, 0);
    }
  };

  const handleShuffleAll = () => {
    if (songs.length > 0) {
      toggleShuffle();
      playList(songs, Math.floor(Math.random() * songs.length));
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${playlistData.playlist.name}"?`)) {
      deletePlaylistById(playlistData.playlist.id);
    }
  };

  const handleRemoveSong = async (itemId: string) => {
    const songId = parseInt(itemId.split('-').pop() || '0', 10);
    if (songId) {
      await removeSongFromPlaylistById(playlistData.playlist.id, songId);
    }
    // Refresh playlist from database would be needed here
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto h-full pb-32 select-none">
      {/* Back Button */}
      <button
        onClick={() => setActiveView('playlists')}
        className="flex items-center gap-2 text-xs font-semibold text-sonora-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Playlists</span>
      </button>

      {/* Hero Playlist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-sonora-border/40">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-800 shadow-2xl flex-shrink-0 border border-white/10 flex items-center justify-center">
          {playlistData.playlist.artworkUri ? (
            <img src={playlistData.playlist.artworkUri} alt={playlistData.playlist.name} className="w-full h-full object-cover" />
          ) : (
            <ListMusic className="w-20 h-20 text-sonora-accent stroke-[1.5]" />
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <p className="text-[11px] font-bold text-sonora-accent uppercase tracking-widest">
            PLAYLIST
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            {playlistData.playlist.name}
          </h1>
          {playlistData.playlist.description && (
            <p className="text-xs text-sonora-muted max-w-lg">
              {playlistData.playlist.description}
            </p>
          )}
          <p className="text-xs font-medium text-sonora-muted">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-sonora-accent text-sonora-base font-bold text-xs hover:bg-sonora-accentHover active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-sonora-accent/30"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play</span>
            </button>

            <button
              onClick={handleShuffleAll}
              disabled={songs.length === 0}
              className="p-2.5 rounded-full bg-sonora-surface hover:bg-sonora-elevated text-sonora-muted hover:text-white border border-sonora-border/60 active:scale-95 transition-all"
              title="Shuffle Playlist"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2.5 rounded-full bg-sonora-surface hover:bg-rose-500/20 text-sonora-muted hover:text-rose-400 border border-sonora-border/60 active:scale-95 transition-all"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {songs.map((song: Song, idx: number) => (
          <SongRow
            key={`${song.id}-${idx}`}
            song={song}
            index={idx}
            songList={songs}
            playlistItemId={`${playlistData.playlist.id}-${song.id}`}
            onRemoveFromPlaylist={handleRemoveSong}
          />
        ))}

        {!isLoading && songs.length === 0 && (
          <div className="py-16 text-center text-sonora-muted space-y-2">
            <ListMusic className="w-12 h-12 mx-auto text-sonora-muted/30" />
            <p className="text-sm font-semibold text-sonora-light">This playlist is empty</p>
            <p className="text-xs">Add songs from the Songs or Albums view using the 3-dots menu.</p>
          </div>
        )}
      </div>
    </div>
  );
};