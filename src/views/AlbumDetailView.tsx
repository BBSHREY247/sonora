import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Shuffle, Disc3 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongRow';
import { api } from '../services/api';
import { Song } from '../types';

export const AlbumDetailView: React.FC = () => {
  const { selectedAlbum, setActiveView, openArtistDetail } = useLibrary();
  const { playList, toggleShuffle } = usePlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedAlbum) {
      setIsLoading(true);
      api.getAlbumSongs(selectedAlbum.name, selectedAlbum.artist)
        .then(setSongs)
        .finally(() => setIsLoading(false));
    }
  }, [selectedAlbum]);

  if (!selectedAlbum) {
    return null;
  }

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

  const coverUrl = api.getCoverArtUrl(selectedAlbum.cover_path);

  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto h-full pb-32 select-none">
      {/* Back Button */}
      <button
        onClick={() => setActiveView('albums')}
        className="flex items-center gap-2 text-xs font-semibold text-sonora-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Albums</span>
      </button>

      {/* Hero Album Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-sonora-border/40">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-sonora-elevated shadow-2xl flex-shrink-0 border border-white/10">
          {coverUrl ? (
            <img src={coverUrl} alt={selectedAlbum.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sonora-muted">
              <Disc3 className="w-16 h-16" />
            </div>
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <p className="text-[11px] font-bold text-sonora-accent uppercase tracking-widest">
            ALBUM
          </p>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            {selectedAlbum.name}
          </h1>
          <p 
            onClick={() => openArtistDetail({ name: selectedAlbum.artist, song_count: 1, album_count: 1, cover_path: selectedAlbum.cover_path })}
            className="text-sm font-semibold text-sonora-light hover:text-sonora-accent cursor-pointer transition-colors"
          >
            {selectedAlbum.artist} {selectedAlbum.year ? `• ${selectedAlbum.year}` : ''} • {songs.length} {songs.length === 1 ? 'song' : 'songs'}
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
              title="Shuffle Album"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List Table */}
      <div className="space-y-1">
        {songs.map((song: Song, idx: number) => (
          <SongRow
            key={song.id}
            song={song}
            index={idx}
            songList={songs}
            showAlbum={false}
          />
        ))}

        {!isLoading && songs.length === 0 && (
          <div className="py-12 text-center text-sonora-muted text-xs">
            No tracks found in this album.
          </div>
        )}
      </div>
    </div>
  );
};
