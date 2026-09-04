import React, { useState } from 'react';
import { Users, Search, User } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Artist } from '../types';

export const ArtistsView: React.FC = () => {
  const { artists, openArtistDetail, activeView, setActiveView } = useLibrary();
  const [filterText, setFilterText] = useState('');

  const libraryTabs: { view: string; label: string }[] = [
    { view: 'songs', label: 'Songs' },
    { view: 'albums', label: 'Albums' },
    { view: 'artists', label: 'Artists' },
    { view: 'playlists', label: 'Playlists' },
    { view: 'favorites', label: 'Liked' },
  ];

  const filteredArtists = artists.filter(a =>
    a.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto h-full pb-32 select-none">
      {/* Mobile Library Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {libraryTabs.map(tab => (
          <button
            key={tab.view}
            onClick={() => setActiveView(tab.view as any)}
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
      <div className="flex items-end justify-between pb-4 border-b border-sonora-border/40">
        <div>
          <p className="text-[11px] font-bold text-sonora-accent uppercase tracking-widest">
            YOUR LIBRARY
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            Artists
          </h1>
          <p className="text-xs text-sonora-muted mt-1">
            {artists.length} {artists.length === 1 ? 'artist' : 'artists'} in collection
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-sonora-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search artists..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full bg-sonora-card border border-sonora-border/60 focus:border-sonora-accent rounded-xl pl-9 pr-3 py-1.5 text-xs text-sonora-light placeholder-sonora-muted focus:outline-none"
        />
      </div>

      {/* Artists Circular Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredArtists.map((artist: Artist) => (
          <div
            key={artist.id}
            onClick={() => openArtistDetail(artist)}
            className="group glass-card p-4 rounded-2xl cursor-pointer flex flex-col items-center text-center active:scale-95 transition-transform"
          >
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-sonora-elevated mb-3 shadow-lg border border-white/10 group-hover:border-sonora-accent/40 transition-colors">
              {artist.artworkUri ? (
                <img
                  src={artist.artworkUri}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            <h4 className="text-sm font-bold text-sonora-light truncate w-full group-hover:text-sonora-accent">
              {artist.name}
            </h4>
            <p className="text-xs text-sonora-muted mt-0.5">
              Artist • {artist.songCount} {artist.songCount === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        ))}

        {filteredArtists.length === 0 && (
          <div className="col-span-full py-16 text-center text-sonora-muted space-y-2">
            <Users className="w-12 h-12 mx-auto text-sonora-muted/30" />
            <p className="text-sm font-semibold text-sonora-light">No artists found</p>
          </div>
        )}
      </div>
    </div>
  );
};