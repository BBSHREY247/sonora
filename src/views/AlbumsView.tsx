import React, { useState } from 'react';
import { Disc3, Search } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Album, ActiveView } from '../types';
import { api } from '../services/api';

export const AlbumsView: React.FC = () => {
  const { albums, openAlbumDetail, activeView, setActiveView } = useLibrary();
  const [filterText, setFilterText] = useState('');

  const libraryTabs: { view: ActiveView; label: string }[] = [
    { view: 'songs', label: 'Songs' },
    { view: 'albums', label: 'Albums' },
    { view: 'artists', label: 'Artists' },
    { view: 'playlists', label: 'Playlists' },
    { view: 'favorites', label: 'Liked' },
  ];

  const filteredAlbums = albums.filter(a => 
    a.name.toLowerCase().includes(filterText.toLowerCase()) ||
    a.artist.toLowerCase().includes(filterText.toLowerCase())
  );

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
      <div className="flex items-end justify-between pb-4 border-b border-sonora-border/40">
        <div>
          <p className="text-[11px] font-bold text-sonora-accent uppercase tracking-widest">
            YOUR LIBRARY
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            Albums
          </h1>
          <p className="text-xs text-sonora-muted mt-1">
            {albums.length} {albums.length === 1 ? 'album' : 'albums'} available
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-sonora-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter albums by title or artist..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full bg-sonora-card border border-sonora-border/60 focus:border-sonora-accent rounded-xl pl-9 pr-3 py-1.5 text-xs text-sonora-light placeholder-sonora-muted focus:outline-none"
        />
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {filteredAlbums.map((album: Album) => (
          <div
            key={`${album.name}-${album.artist}`}
            onClick={() => openAlbumDetail(album)}
            className="group glass-card p-2.5 sm:p-3 rounded-2xl cursor-pointer active:scale-95 transition-transform"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-sonora-elevated mb-2.5 shadow-md">
              {album.cover_path ? (
                <img
                  src={api.getCoverArtUrl(album.cover_path) || ''}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                  <Disc3 className="w-10 h-10" />
                </div>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate group-hover:text-sonora-accent">
              {album.name}
            </h4>
            <p className="text-[11px] text-sonora-muted truncate mt-0.5">
              {album.artist}
            </p>
            <span className="text-[10px] text-sonora-muted/80">
              {album.song_count} {album.song_count === 1 ? 'song' : 'songs'}
            </span>
          </div>
        ))}

        {filteredAlbums.length === 0 && (
          <div className="col-span-full py-16 text-center text-sonora-muted space-y-2">
            <Disc3 className="w-12 h-12 mx-auto text-sonora-muted/30" />
            <p className="text-sm font-semibold text-sonora-light">No albums found</p>
          </div>
        )}
      </div>
    </div>
  );
};
