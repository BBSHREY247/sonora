import React, { useState } from 'react';
import { 
  Search, 
  Settings as SettingsIcon, 
  RotateCw, 
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenImporter: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenSettings, 
  onOpenImporter, 
  searchQuery, 
  setSearchQuery 
}) => {
  const { activeView, setActiveView, triggerScan, isScanning } = useLibrary();
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleScanClick = async () => {
    try {
      const res = await triggerScan();
      setScanMessage(`Scan complete: +${res.stats.added} songs`);
      setTimeout(() => setScanMessage(null), 4000);
    } catch (e: any) {
      setScanMessage(e.message || 'Scan failed');
      setTimeout(() => setScanMessage(null), 4000);
    }
  };

  const handleSearchFocus = () => {
    if (activeView !== 'search') {
      setActiveView('search');
    }
  };

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-sonora-border/40 bg-sonora-base/80 backdrop-blur-md z-10 select-none">
      {/* Search Input Bar */}
      <div className="relative w-96 max-w-full">
        <Search className="w-4 h-4 text-sonora-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search songs, artists, albums, playlists..."
          value={searchQuery}
          onFocus={handleSearchFocus}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (activeView !== 'search') setActiveView('search');
          }}
          className="w-full bg-sonora-surface border border-sonora-border/80 focus:border-sonora-accent rounded-full pl-10 pr-4 py-2 text-sm text-sonora-light placeholder-sonora-muted focus:outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sonora-muted hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {scanMessage && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-sonora-accent/20 text-sonora-accent font-medium border border-sonora-accent/30 animate-fade-in">
            {scanMessage}
          </span>
        )}

        <button
          onClick={handleScanClick}
          disabled={isScanning}
          title="Rescan Local Music Library"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sonora-surface hover:bg-sonora-elevated text-sonora-muted hover:text-sonora-light border border-sonora-border/60 transition-all text-xs font-medium"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-sonora-accent' : ''}`} />
          <span>{isScanning ? 'Scanning...' : 'Scan Library'}</span>
        </button>

        <button
          onClick={onOpenImporter}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-sonora-accent text-sonora-base hover:bg-sonora-accentHover transition-all text-xs font-bold shadow-md shadow-sonora-accent/20"
        >
          <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Import</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="App Settings"
          className="p-2 rounded-full bg-sonora-surface hover:bg-sonora-elevated text-sonora-muted hover:text-sonora-light border border-sonora-border/60 transition-all"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
