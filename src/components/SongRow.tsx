import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal, 
  Plus, 
  ListPlus, 
  Music,
  Disc,
  User
} from 'lucide-react';
import { Song, Playlist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

interface SongRowProps {
  song: Song;
  index: number;
  songList: Song[];
  showAlbum?: boolean;
  showDateAdded?: boolean;
  onRemoveFromPlaylist?: (itemId: string) => void;
  playlistItemId?: string;
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  songList,
  showAlbum = true,
  showDateAdded = true,
  onRemoveFromPlaylist,
  playlistItemId
}) => {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue } = usePlayer();
  const { toggleFavorite, playlists, addSongToPlaylistById, openAlbumDetail, openArtistDetail } = useLibrary();
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);

  const isCurrent = currentSong?.id === song.id;

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, songList);
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      onDoubleClick={handleRowClick}
      className={`group relative grid grid-cols-12 gap-4 px-4 py-2.5 rounded-lg items-center text-sm transition-colors ${
        isCurrent ? 'bg-sonora-accent/10 text-sonora-accent' : 'hover:bg-white/5 text-sonora-muted'
      }`}
    >
      {/* Index / Play Button */}
      <div className="col-span-1 flex items-center justify-center text-xs font-medium w-8">
        {isCurrent && isPlaying ? (
          <div className="flex items-center gap-0.5">
            <span className="sound-bar h-2.5" />
            <span className="sound-bar h-4" />
            <span className="sound-bar h-3" />
          </div>
        ) : (
          <>
            <span className="group-hover:hidden">{index + 1}</span>
            <button
              onClick={handleRowClick}
              className="hidden group-hover:block text-sonora-light hover:text-sonora-accent transition-transform active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </>
        )}
      </div>

      {/* Song Title & Cover & Artist */}
      <div className={`flex items-center gap-3 ${showAlbum ? 'col-span-4' : 'col-span-6'} min-w-0`}>
        <div className="w-10 h-10 rounded-md overflow-hidden bg-sonora-elevated flex-shrink-0 shadow-sm">
          {song.artworkUri ? (
            <img
              src={song.artworkUri}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sonora-muted">
              <Music className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className={`font-medium truncate ${isCurrent ? 'text-sonora-accent' : 'text-sonora-light'}`}>
            {song.title}
          </p>
          <p 
            onClick={(e) => {
              e.stopPropagation();
              openArtistDetail({ id: 0, name: song.artist, artworkUri: song.artworkUri, songCount: 1, albumCount: 1 });
            }}
            className="text-xs text-sonora-muted hover:text-sonora-light truncate cursor-pointer"
          >
            {song.artist}
          </p>
        </div>
      </div>

      {/* Album */}
      {showAlbum && (
        <div className="col-span-3 truncate text-xs">
          <span 
            onClick={(e) => {
              e.stopPropagation();
              openAlbumDetail({ id: 0, name: song.album || '', artist: song.artist, artworkUri: song.artworkUri, year: song.year, songCount: 1, totalDuration: 0 });
            }}
            className="hover:text-sonora-light hover:underline cursor-pointer"
          >
            {song.album}
          </span>
        </div>
      )}

      {/* Date Added */}
      {showDateAdded && (
        <div className="col-span-2 text-xs truncate hidden md:block">
          {formatDate(song.dateAdded)}
        </div>
      )}

      {/* Heart, Duration & Menu */}
      <div className="col-span-2 flex items-center justify-end gap-3 text-xs pr-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song.id, !song.favorite);
          }}
          className={`transition-colors ${
            song.favorite ? 'text-rose-500' : 'opacity-0 group-hover:opacity-100 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${song.favorite ? 'fill-current' : ''}`} />
        </button>

        <span className="font-mono text-xs w-10 text-right">
          {formatDuration(song.duration)}
        </span>

        {/* 3-dots Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-white/10 text-sonora-muted hover:text-sonora-light opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div 
              onMouseLeave={() => {
                setShowMenu(false);
                setShowPlaylistSubmenu(false);
              }}
              className="absolute right-0 top-6 w-48 bg-sonora-card/95 backdrop-blur-xl border border-sonora-border rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in text-xs select-none"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(song);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-sonora-light text-left transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-sonora-accent" />
                <span>Add to Queue</span>
              </button>

              <div 
                className="relative"
                onMouseEnter={() => setShowPlaylistSubmenu(true)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlaylistSubmenu(!showPlaylistSubmenu);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-sonora-light text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ListPlus className="w-3.5 h-3.5 text-sky-400" />
                    <span>Add to Playlist</span>
                  </div>
                  <span>▸</span>
                </button>

                {showPlaylistSubmenu && (
                  <div className="absolute left-full top-0 ml-1 w-44 bg-sonora-card border border-sonora-border rounded-xl shadow-2xl p-1.5 z-50 max-h-48 overflow-y-auto">
                    {playlists.map((pl: Playlist) => (
                      <button
                        key={pl.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          addSongToPlaylistById(pl.id, song.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-sonora-light truncate"
                      >
                        {pl.name}
                      </button>
                    ))}
                    {playlists.length === 0 && (
                      <span className="text-[10px] text-sonora-muted px-2 py-1 italic block">
                        No playlists
                      </span>
                    )}
                  </div>
                )}
              </div>

              {onRemoveFromPlaylist && playlistItemId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromPlaylist(playlistItemId);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-rose-500/20 text-rose-400 text-left transition-colors"
                >
                  <span>Remove from Playlist</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};