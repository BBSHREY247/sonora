import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Shuffle, User } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongRow';
import { Song } from '../types';

export const ArtistDetailView: React.FC = () => {
  const { selectedArtist, setActiveView, getSongsByArtist } = useLibrary();
  const { playList, toggleShuffle } = usePlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedArtist) {
      setIsLoading(true);
      getSongsByArtist(selectedArtist.name)
        .then(setSongs)
        .finally(() => setIsLoading(false));
    }
  }, [selectedArtist]);

  if (!selectedArtist) return null;

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

  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto h-full pb-32 select-none">
      {/* Back Button */}
      <button
        onClick={() => setActiveView('artists')}
        className="flex items-center gap-2 text-xs font-semibold text-sonora-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Artists</span>
      </button>

      {/* Hero Artist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-sonora-border/40">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-sonora-elevated shadow-2xl flex-shrink-0 border-2 border-white/10">
          {selectedArtist.artworkUri ? (
            <img src={selectedArtist.artworkUri} alt={selectedArtist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sonora-muted">
              <User className="w-16 h-16" />
            </div>
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <p className="text-[11px] font-bold text-sonora-accent uppercase tracking-widest">
            ARTIST
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            {selectedArtist.name}
          </h1>
          <p className="text-sm font-semibold text-sonora-muted">
            {songs.length} {songs.length === 1 ? 'track' : 'tracks'} in your library
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
              title="Shuffle Artist Tracks"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {songs.map((song: Song, idx: number) => (
          <SongRow
            key={song.id}
            song={song}
            index={idx}
            songList={songs}
          />
        ))}

        {!isLoading && songs.length === 0 && (
          <div className="py-12 text-center text-sonora-muted text-xs">
            No tracks found for this artist.
          </div>
        )}
      </div>
    </div>
  );
};