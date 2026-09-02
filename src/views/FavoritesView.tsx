import React from 'react';
import { Play, Shuffle, Heart } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongRow';
import { Song, ActiveView } from '../types';

export const FavoritesView: React.FC = () => {
  const { favoriteSongs, activeView, setActiveView } = useLibrary();
  const { playList, toggleShuffle } = usePlayer();

  const libraryTabs: { view: ActiveView; label: string }[] = [
    { view: 'songs', label: 'Songs' },
    { view: 'albums', label: 'Albums' },
    { view: 'artists', label: 'Artists' },
    { view: 'playlists', label: 'Playlists' },
    { view: 'favorites', label: 'Liked' },
  ];

  const handlePlayAll = () => {
    if (favoriteSongs.length > 0) {
      playList(favoriteSongs, 0);
    }
  };

  const handleShuffleAll = () => {
    if (favoriteSongs.length > 0) {
      toggleShuffle();
      playList(favoriteSongs, Math.floor(Math.random() * favoriteSongs.length));
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto h-full pb-32 select-none">
      {/* Mobile Library Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {libraryTabs.map(tab => (
          <button
            key={tab.view}
            onClick={() => setActiveView(tab.view)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === tab.view
                ? 'bg-sonora-accent text-sonora-base shadow-md shadow-sonora-accent/20'
                : 'bg-sonora-card text-sonora-muted hover:text-white border border-sonora-border/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-sonora-border/40">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-gradient-to-tr from-rose-900 via-rose-600 to-pink-500 shadow-2xl flex-shrink-0 flex items-center justify-center border border-white/10">
          <Heart className="w-24 h-24 text-white fill-white shadow-xl" />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">
            PLAYLIST
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            Liked Songs
          </h1>
          <p className="text-xs font-medium text-sonora-muted">
            {favoriteSongs.length} {favoriteSongs.length === 1 ? 'song' : 'songs'} in your favorites
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              disabled={favoriteSongs.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-sonora-accent text-sonora-base font-bold text-xs hover:bg-sonora-accentHover active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-sonora-accent/30"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play</span>
            </button>

            <button
              onClick={handleShuffleAll}
              disabled={favoriteSongs.length === 0}
              className="p-2.5 rounded-full bg-sonora-surface hover:bg-sonora-elevated text-sonora-muted hover:text-white border border-sonora-border/60 active:scale-95 transition-all"
              title="Shuffle Liked Songs"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {favoriteSongs.map((song: Song, idx: number) => (
          <SongRow
            key={song.id}
            song={song}
            index={idx}
            songList={favoriteSongs}
          />
        ))}

        {favoriteSongs.length === 0 && (
          <div className="py-16 text-center text-sonora-muted space-y-2">
            <Heart className="w-12 h-12 mx-auto text-sonora-muted/30" />
            <p className="text-sm font-semibold text-sonora-light">No liked songs yet</p>
            <p className="text-xs">Tap the heart icon on any song to save it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
