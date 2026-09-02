import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Clock, Heart, Disc3, Music, ListMusic, PlusCircle, RefreshCw } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { Song, Album, Playlist } from '../types';

export const HomeView: React.FC = () => {
  const { 
    songs, 
    favoriteSongs, 
    albums, 
    playlists, 
    openAlbumDetail, 
    openPlaylistDetail,
    setActiveView,
    triggerScan,
    isScanning
  } = useLibrary();

  const { playList, playSong } = usePlayer();
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);

  useEffect(() => {
    api.getRecentlyPlayed(8).then(setRecentlyPlayed).catch(console.warn);
  }, [songs]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickTiles = [
    { 
      title: 'Liked Songs', 
      count: `${favoriteSongs.length} songs`, 
      onClick: () => setActiveView('favorites'), 
      icon: <Heart className="w-5 h-5 text-rose-400 fill-rose-400" /> 
    },
    ...playlists.slice(0, 5).map(p => ({
      title: p.name,
      count: 'Playlist',
      onClick: () => openPlaylistDetail(p),
      icon: <Music className="w-5 h-5 text-sonora-accent" />
    }))
  ].slice(0, 6);

  const recentlyAdded = songs.slice(0, 10);

  return (
    <div className="p-4 sm:p-8 space-y-8 overflow-y-auto h-full pb-32 select-none">
      {/* Top Greeting & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-xs text-sonora-muted mt-0.5">
            Sonora Audio Station • Android Edition
          </p>
        </div>

        <button
          onClick={() => triggerScan()}
          disabled={isScanning}
          title="Rescan Device Music"
          className="p-2.5 rounded-full bg-sonora-surface hover:bg-sonora-elevated text-sonora-muted hover:text-sonora-light border border-sonora-border/60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-sonora-accent' : ''}`} />
        </button>
      </div>

      {/* Quick 6-Grid Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {quickTiles.map((tile, idx) => (
          <div
            key={idx}
            onClick={tile.onClick}
            className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-sonora-card/80 hover:bg-sonora-elevated border border-sonora-border/50 hover:border-sonora-accent/30 cursor-pointer transition-all duration-200 shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-sonora-surface flex items-center justify-center flex-shrink-0 shadow-inner">
                {tile.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate group-hover:text-sonora-accent transition-colors">
                  {tile.title}
                </h4>
                <p className="text-[10px] text-sonora-muted truncate">{tile.count}</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (tile.title === 'Liked Songs' && favoriteSongs.length > 0) {
                  playList(favoriteSongs);
                } else {
                  tile.onClick();
                }
              }}
              className="hidden sm:flex w-8 h-8 rounded-full bg-sonora-accent text-sonora-base opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 items-center justify-center transition-all shadow-md shadow-sonora-accent/30 mr-1"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-sonora-accent" />
              <span>Recently Played</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {recentlyPlayed.map((song: Song) => (
              <div
                key={song.id}
                onClick={() => playSong(song, recentlyPlayed)}
                className="group glass-card p-2.5 sm:p-3 rounded-2xl cursor-pointer active:scale-95 transition-transform"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-sonora-elevated mb-2.5 shadow-md">
                  {song.cover_path ? (
                    <img
                      src={api.getCoverArtUrl(song.cover_path) || ''}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                      <Music className="w-8 h-8" />
                    </div>
                  )}
                  <button className="hidden sm:flex absolute right-2 bottom-2 w-9 h-9 rounded-full bg-sonora-accent text-sonora-base opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 items-center justify-center shadow-lg shadow-sonora-accent/30">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate group-hover:text-sonora-accent">
                  {song.title}
                </h4>
                <p className="text-[11px] text-sonora-muted truncate mt-0.5">
                  {song.artist}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span>Recently Added</span>
          </h2>
          <button
            onClick={() => setActiveView('songs')}
            className="text-xs font-semibold text-sonora-muted hover:text-sonora-accent transition-colors"
          >
            Show all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {recentlyAdded.map((song: Song) => (
            <div
              key={song.id}
              onClick={() => playSong(song, recentlyAdded)}
              className="group glass-card p-2.5 sm:p-3 rounded-2xl cursor-pointer active:scale-95 transition-transform"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-sonora-elevated mb-2.5 shadow-md">
                {song.cover_path ? (
                  <img
                    src={api.getCoverArtUrl(song.cover_path) || ''}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                    <Music className="w-8 h-8" />
                  </div>
                )}
                <button className="hidden sm:flex absolute right-2 bottom-2 w-9 h-9 rounded-full bg-sonora-accent text-sonora-base opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 items-center justify-center shadow-lg shadow-sonora-accent/30">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate group-hover:text-sonora-accent">
                {song.title}
              </h4>
              <p className="text-[11px] text-sonora-muted truncate mt-0.5">
                {song.artist}
              </p>
            </div>
          ))}

          {songs.length === 0 && (
            <div className="col-span-full py-10 text-center text-sonora-muted space-y-2 bg-sonora-card/50 rounded-2xl border border-sonora-border/40 p-6">
              <Music className="w-10 h-10 mx-auto text-sonora-muted/40 mb-2" />
              <p className="text-sm font-semibold text-sonora-light">Your library is currently empty</p>
              <p className="text-xs">Import YouTube tracks or scan your local storage to get started.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Albums */}
      {albums.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Disc3 className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
              <span>Albums in Library</span>
            </h2>
            <button
              onClick={() => setActiveView('albums')}
              className="text-xs font-semibold text-sonora-muted hover:text-sonora-accent transition-colors"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {albums.slice(0, 6).map((album: Album) => (
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
                      <Disc3 className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate group-hover:text-sonora-accent">
                  {album.name}
                </h4>
                <p className="text-[11px] text-sonora-muted truncate mt-0.5">
                  {album.artist}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
