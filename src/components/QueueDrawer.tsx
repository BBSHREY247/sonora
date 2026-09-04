import React from 'react';
import { X, Trash2, Music, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Song } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    queue, 
    queueIndex, 
    currentSong, 
    isPlaying, 
    playSong, 
    removeFromQueue, 
    clearQueue 
  } = usePlayer();

  if (!isOpen) return null;

  const upNextSongs = queue.slice(queueIndex + 1);

  return (
    <aside className="w-80 bg-sonora-surface/95 backdrop-blur-xl border-l border-sonora-border/60 flex flex-col h-full z-20 select-none animate-slide-left">
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-sonora-border/40">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base text-sonora-light">Play Queue</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-sonora-muted">
            {queue.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              title="Clear Queue"
              className="p-1.5 rounded-lg hover:bg-white/10 text-sonora-muted hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sonora-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Now Playing Section */}
        {currentSong && (
          <div>
            <p className="text-[11px] font-bold text-sonora-muted uppercase tracking-wider mb-2.5">
              Now Playing
            </p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sonora-accent/10 border border-sonora-accent/20">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-sonora-elevated flex-shrink-0">
                {currentSong.artworkUri ? (
                  <img
                    src={currentSong.artworkUri}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                    <Music className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-sonora-accent truncate">
                  {currentSong.title}
                </h4>
                <p className="text-xs text-sonora-muted truncate">
                  {currentSong.artist}
                </p>
              </div>
              {isPlaying && (
                <div className="flex items-center gap-0.5 pr-1">
                  <span className="sound-bar h-3" />
                  <span className="sound-bar h-5" />
                  <span className="sound-bar h-4" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Up Next Section */}
        <div>
          <p className="text-[11px] font-bold text-sonora-muted uppercase tracking-wider mb-2.5">
            Up Next ({upNextSongs.length})
          </p>
          <div className="space-y-1">
            {upNextSongs.map((song: Song, idx: number) => {
              const realIndex = queueIndex + 1 + idx;
              return (
                <div
                  key={`${song.id}-${realIndex}`}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div
                    onClick={() => playSong(song, queue)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded overflow-hidden bg-sonora-elevated flex-shrink-0 relative">
                      {song.artworkUri ? (
                        <img
                          src={song.artworkUri}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                          <Music className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-3 h-3 text-white fill-current" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-sonora-light truncate group-hover:text-sonora-accent">
                        {song.title}
                      </p>
                      <p className="text-[10px] text-sonora-muted truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromQueue(realIndex)}
                    className="p-1 text-sonora-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from queue"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {upNextSongs.length === 0 && (
              <p className="text-xs text-sonora-muted/60 italic p-3 text-center">
                Queue is empty. Add songs to keep the music playing!
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};