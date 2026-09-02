import React, { useState, useEffect } from 'react';
import { useLibrary } from './context/LibraryContext';
import { usePlayer } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { AndroidMiniPlayer } from './components/AndroidMiniPlayer';
import { AndroidExpandedPlayer } from './components/AndroidExpandedPlayer';
import { QueueDrawer } from './components/QueueDrawer';
import { VisualizerOverlay } from './components/VisualizerOverlay';
import { ImportModal } from './components/ImportModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { SettingsModal } from './components/SettingsModal';
import { setupMediaSession } from './services/mediaSession';

import { HomeView } from './views/HomeView';
import { SongsView } from './views/SongsView';
import { AlbumsView } from './views/AlbumsView';
import { AlbumDetailView } from './views/AlbumDetailView';
import { ArtistsView } from './views/ArtistsView';
import { ArtistDetailView } from './views/ArtistDetailView';
import { PlaylistsView } from './views/PlaylistsView';
import { PlaylistDetailView } from './views/PlaylistDetailView';
import { FavoritesView } from './views/FavoritesView';
import { DownloadsView } from './views/DownloadsView';
import { SearchView } from './views/SearchView';

export const AppContent: React.FC = () => {
  const { activeView } = useLibrary();
  const { currentSong, isPlaying, togglePlay, playNext, playPrevious, seek } = usePlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAndroidPlayerExpanded, setIsAndroidPlayerExpanded] = useState(false);

  // Sync with Android MediaSession for Lock Screen & Notification Controls
  useEffect(() => {
    setupMediaSession(currentSong, {
      onPlay: togglePlay,
      onPause: togglePlay,
      onNext: playNext,
      onPrevious: playPrevious,
      onSeek: seek,
    });
  }, [currentSong, togglePlay, playNext, playPrevious, seek]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'songs':
        return <SongsView />;
      case 'albums':
        return <AlbumsView />;
      case 'album-detail':
        return <AlbumDetailView />;
      case 'artists':
        return <ArtistsView />;
      case 'artist-detail':
        return <ArtistDetailView />;
      case 'playlists':
        return <PlaylistsView onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)} />;
      case 'playlist-detail':
        return <PlaylistDetailView />;
      case 'favorites':
        return <FavoritesView />;
      case 'downloads':
        return <DownloadsView onOpenImporter={() => setIsImporterOpen(true)} />;
      case 'search':
        return <SearchView searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-sonora-base text-sonora-light overflow-hidden font-sans select-none">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:flex">
        <Sidebar
          onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          onOpenImporter={() => setIsImporterOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Desktop Header (hidden on mobile) */}
        <div className="hidden md:block">
          <Header
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenImporter={() => setIsImporterOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto relative">
          {renderActiveView()}
        </main>

        {/* Desktop Player Bar (hidden on mobile) */}
        <div className="hidden md:block">
          <PlayerBar
            onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
            isQueueOpen={isQueueOpen}
          />
        </div>

        {/* Mobile Android Mini Player */}
        <div className="block md:hidden">
          <AndroidMiniPlayer onExpand={() => setIsAndroidPlayerExpanded(true)} />
        </div>

        {/* Mobile Android Bottom Navigation */}
        <div className="block md:hidden">
          <AndroidBottomNav onOpenImporter={() => setIsImporterOpen(true)} />
        </div>
      </div>

      {/* Slide-out Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {/* Android Expanded Fullscreen Player */}
      <AndroidExpandedPlayer
        isOpen={isAndroidPlayerExpanded}
        onClose={() => setIsAndroidPlayerExpanded(false)}
        onOpenQueue={() => {
          setIsAndroidPlayerExpanded(false);
          setIsQueueOpen(true);
        }}
      />

      {/* Visualizer Overlay */}
      <VisualizerOverlay />

      {/* Modals */}
      <ImportModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
      />

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default AppContent;
