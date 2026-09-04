import React, { useState } from 'react';
import { Play, Shuffle, Music2, Search, ArrowUpDown } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongRow';
import { Song, ActiveView } from '../types';

export const SongsView: React.FC = () => {
  const { songs, activeView, setActiveView } = useLibrary();
  const { playList, toggleShuffle } = usePlayer();
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'album' | 'duration' | 'dateAdded'>('title');
  const [sortAsc, setSortAsc] = useState(true);

  const libraryTabs: { view: ActiveView; label: string }[] = [
    { view: 'songs', label: 'Songs' },
    { view: 'albums', label: 'Albums' },
    { view: 'artists', label: 'Artists' },
    { view: 'playlists', label: 'Playlists' },
    { view: 'favorites', label: 'Liked' },
  ];

  const filteredSongs = songs
    .filter(s => 
      s.title.toLowerCase().includes(filterText.toLowerCase()) ||
      s.artist.toLowerCase().includes(filterText.toLowerCase()) ||
      (s.album || '').toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      playList(filteredSongs, 0);
    }
  };

  const handleShuffleAll = () => {
    if (filteredSongs.length > 0) {
      toggleShuffle();
      playList(filteredSongs, Math.floor(Math.random() * filteredSongs.length));
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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-sonora-border/40">
        <div>
          <p className="text-[11px] font-bold text-sonora-accent uppercase tracking-widest">
            YOUR LIBRARY
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            All Songs
          </h1>
          <p className="text-xs text-sonora-muted mt-1">
            {songs.length} {songs.length === 1 ? 'track' : 'tracks'} stored locally
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayAll}
            disabled={filteredSongs.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sonora-accent text-sonora-base font-bold text-xs hover:bg-sonora-accentHover active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-sonora-accent/30"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <span>Play All</span>
          </button>

          <button
            onClick={handleShuffleAll}
            disabled={filteredSongs.length === 0}
            className="p-2.5 rounded-full bg-sonora-surface hover:bg-sonora-elevated text-sonora-muted hover:text-sonora-light border border-sonora-border/60 active:scale-95 transition-all"
            title="Shuffle All"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-sonora-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter songs by title, artist, album..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-sonora-card border border-sonora-border/60 focus:border-sonora-accent rounded-xl pl-9 pr-3 py-1.5 text-xs text-sonora-light placeholder-sonora-muted focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sonora-card hover:bg-sonora-elevated border border-sonora-border/60 text-xs text-sonora-muted hover:text-white"
        >
          <ArrowUpDown className="w-3 h-3" />
          <span className="hidden sm:inline">Order: {sortAsc ? 'Asc' : 'Desc'}</span>
        </button>
      </div>

      {/* Track List Table Header */}
      <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-sonora-border/40 text-[11px] font-bold text-sonora-muted uppercase tracking-wider">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">Title</div>
        <div className="col-span-3">Album</div>
        <div className="col-span-2 hidden md:block">Date Added</div>
        <div className="col-span-2 text-right pr-4">Duration</div>
      </div>

      {/* Track List Items */}
      <div className="space-y-1">
        {filteredSongs.map((song: Song, idx: number) => (
          <SongRow
            key={song.id}
            song={song}
            index={idx}
            songList={filteredSongs}
          />
        ))}

        {filteredSongs.length === 0 && (
          <div className="py-16 text-center text-sonora-muted space-y-2">
            <Music2 className="w-12 h-12 mx-auto text-sonora-muted/30" />
            <p className="text-sm font-semibold text-sonora-light">
              {filterText ? 'No matching songs found' : 'No songs in your library'}
            </p>
            <p className="text-xs">
              {filterText ? 'Try a different search term' : 'Scan your music folder or import tracks.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
