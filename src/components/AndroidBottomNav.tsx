import React from 'react';
import { Home, Search, Library, Download, PlusCircle } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { ActiveView } from '../types';

interface AndroidBottomNavProps {
  onOpenImporter: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({ onOpenImporter }) => {
  const { activeView, setActiveView, activeDownloadsCount } = useLibrary();

  const isLibraryActive = ['songs', 'albums', 'artists', 'playlists', 'favorites', 'album-detail', 'artist-detail', 'playlist-detail'].includes(activeView);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-sonora-surface/95 backdrop-blur-xl border-t border-sonora-border/60 z-30 flex items-center justify-around px-2 select-none safe-area-pb">
      {/* Home */}
      <button
        onClick={() => setActiveView('home')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeView === 'home' ? 'text-sonora-accent' : 'text-sonora-muted hover:text-sonora-light'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold">Home</span>
      </button>

      {/* Search */}
      <button
        onClick={() => setActiveView('search')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeView === 'search' ? 'text-sonora-accent' : 'text-sonora-muted hover:text-sonora-light'
        }`}
      >
        <Search className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold">Search</span>
      </button>

      {/* Your Library */}
      <button
        onClick={() => setActiveView('songs')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isLibraryActive ? 'text-sonora-accent' : 'text-sonora-muted hover:text-sonora-light'
        }`}
      >
        <Library className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold">Library</span>
      </button>

      {/* Downloads */}
      <button
        onClick={() => setActiveView('downloads')}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeView === 'downloads' ? 'text-sonora-accent' : 'text-sonora-muted hover:text-sonora-light'
        }`}
      >
        <Download className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold">Downloads</span>
        {activeDownloadsCount > 0 && (
          <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full bg-sonora-accent animate-pulse" />
        )}
      </button>

      {/* Import Modal */}
      <button
        onClick={onOpenImporter}
        className="flex flex-col items-center justify-center flex-1 py-1 text-sonora-accent hover:text-sonora-accentHover transition-colors"
      >
        <PlusCircle className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-bold">Import</span>
      </button>
    </nav>
  );
};
