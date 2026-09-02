import React from 'react';
import { 
  Home, 
  Music2, 
  Disc3, 
  Users, 
  ListMusic, 
  Heart, 
  Download, 
  PlusCircle,
  Radio
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { ActiveView, Playlist } from '../types';

interface SidebarProps {
  onOpenCreatePlaylist: () => void;
  onOpenImporter: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreatePlaylist, onOpenImporter }) => {
  const { 
    activeView, 
    setActiveView, 
    playlists, 
    activeDownloadsCount, 
    openPlaylistDetail, 
    selectedPlaylist 
  } = useLibrary();

  const navItems: { view: ActiveView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { view: 'songs', label: 'Songs', icon: <Music2 className="w-5 h-5" /> },
    { view: 'albums', label: 'Albums', icon: <Disc3 className="w-5 h-5" /> },
    { view: 'artists', label: 'Artists', icon: <Users className="w-5 h-5" /> },
    { view: 'playlists', label: 'Playlists', icon: <ListMusic className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-sonora-surface flex flex-col h-full border-r border-sonora-border/60 select-none">
      {/* Brand Logo & Name */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-sonora-accent to-teal-400 flex items-center justify-center shadow-lg shadow-sonora-accent/20">
          <Radio className="w-6 h-6 text-sonora-base stroke-[2.5]" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-sonora-muted bg-clip-text text-transparent font-['Plus_Jakarta_Sans']">
            SONORA
          </span>
          <p className="text-[10px] tracking-widest text-sonora-accent font-semibold uppercase">
            Music Station
          </p>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="px-3 space-y-1">
        <p className="px-3 text-[11px] font-bold text-sonora-muted uppercase tracking-wider mb-2">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sonora-accent/15 text-sonora-accent font-semibold'
                  : 'text-sonora-muted hover:text-sonora-light hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-sonora-accent text-sonora-base font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="my-4 mx-3 border-t border-sonora-border/40" />

      {/* Library Collections & Import */}
      <div className="px-3 space-y-1">
        <p className="px-3 text-[11px] font-bold text-sonora-muted uppercase tracking-wider mb-2">
          Library
        </p>
        
        <button
          onClick={() => setActiveView('favorites')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeView === 'favorites'
              ? 'bg-sonora-accent/15 text-sonora-accent font-semibold'
              : 'text-sonora-muted hover:text-sonora-light hover:bg-white/5'
          }`}
        >
          <Heart className="w-5 h-5 text-rose-400" />
          <span>Favorites</span>
        </button>

        <button
          onClick={() => setActiveView('downloads')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeView === 'downloads'
              ? 'bg-sonora-accent/15 text-sonora-accent font-semibold'
              : 'text-sonora-muted hover:text-sonora-light hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-sky-400" />
            <span>Downloads</span>
          </div>
          {activeDownloadsCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500 text-white font-bold animate-pulse">
              {activeDownloadsCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenImporter}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-sonora-accent hover:bg-sonora-accent/10 transition-all group"
        >
          <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span>Import Music</span>
        </button>
      </div>

      <div className="my-4 mx-3 border-t border-sonora-border/40" />

      {/* Playlists List */}
      <div className="px-3 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[11px] font-bold text-sonora-muted uppercase tracking-wider">
            Playlists
          </p>
          <button
            onClick={onOpenCreatePlaylist}
            title="Create Playlist"
            className="text-sonora-muted hover:text-sonora-accent transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {playlists.map((playlist: Playlist) => {
            const isSelected = activeView === 'playlist-detail' && selectedPlaylist?.id === playlist.id;
            return (
              <button
                key={playlist.id}
                onClick={() => openPlaylistDetail(playlist)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-all ${
                  isSelected
                    ? 'bg-white/10 text-sonora-light font-semibold'
                    : 'text-sonora-muted hover:text-sonora-light hover:bg-white/5'
                }`}
              >
                {playlist.name}
              </button>
            );
          })}
          {playlists.length === 0 && (
            <p className="px-3 py-2 text-xs text-sonora-muted/60 italic">
              No playlists yet. Create one!
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
