import React, { useState } from 'react';
import { ListMusic, Plus, Music } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Playlist } from '../types';

interface PlaylistsViewProps {
  onOpenCreatePlaylist: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({ onOpenCreatePlaylist }) => {
  const { playlists, openPlaylistDetail, activeView, setActiveView } = useLibrary();

  const libraryTabs: { view: string; label: string }[] = [
    { view: 'songs', label: 'Songs' },
    { view: 'albums', label: 'Albums' },
    { view: 'artists', label: 'Artists' },
    { view: 'playlists', label: 'Playlists' },
    { view: 'favorites', label: 'Liked' },
  ];

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
            Playlists
          </h1>
          <p className="text-xs text-sonora-muted mt-1">
            {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'} created
          </p>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sonora-accent text-sonora-base font-bold text-xs hover:bg-sonora-accentHover active:scale-95 transition-all shadow-md shadow-sonora-accent/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {playlists.map((playlist: Playlist) => (
          <div
            key={playlist.id}
            onClick={() => openPlaylistDetail({ playlist, songs: [] })}
            className="group glass-card p-2.5 sm:p-3 rounded-2xl cursor-pointer active:scale-95 transition-transform"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-sonora-elevated mb-2.5 shadow-md flex items-center justify-center">
              {playlist.artworkUri ? (
                <img
                  src={playlist.artworkUri}
                  alt={playlist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 text-sonora-accent">
                  <ListMusic className="w-12 h-12 stroke-[1.5]" />
                </div>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate group-hover:text-sonora-accent">
              {playlist.name}
            </h4>
            <p className="text-[11px] text-sonora-muted truncate mt-0.5">
              {playlist.songCount || 0} {(playlist.songCount || 0) === 1 ? 'song' : 'songs'}
            </p>
          </div>
        ))}

        {playlists.length === 0 && (
          <div className="col-span-full py-16 text-center text-sonora-muted space-y-3">
            <ListMusic className="w-12 h-12 mx-auto text-sonora-muted/30" />
            <p className="text-sm font-semibold text-sonora-light">No playlists yet</p>
            <button
              onClick={onOpenCreatePlaylist}
              className="px-4 py-2 rounded-xl bg-sonora-accent/15 text-sonora-accent hover:bg-sonora-accent/25 text-xs font-bold transition-colors"
            >
              Create your first playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};