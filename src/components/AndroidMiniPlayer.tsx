import React from 'react';
import { Play, Pause, Heart, Music, SkipForward } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { api } from '../services/api';

interface AndroidMiniPlayerProps {
  onExpand: () => void;
}

export const AndroidMiniPlayer: React.FC<AndroidMiniPlayerProps> = ({ onExpand }) => {
  const { currentSong, isPlaying, currentTime, duration, togglePlay, playNext } = usePlayer();
  const { toggleFavorite } = useLibrary();

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const coverUrl = api.getCoverArtUrl(currentSong.cover_path);

  return (
    <div className="fixed bottom-16 left-2 right-2 z-20 select-none animate-slide-up">
      <div 
        onClick={onExpand}
        className="relative overflow-hidden rounded-xl bg-sonora-card/95 backdrop-blur-xl border border-sonora-border/80 shadow-2xl p-2.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
      >
        {/* Top Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/10">
          <div 
            className="h-full bg-sonora-accent transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Thumbnail & Title/Artist */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-sonora-elevated flex-shrink-0 shadow-sm">
            {coverUrl ? (
              <img src={coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                <Music className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-sonora-light truncate">
              {currentSong.title}
            </h4>
            <p className="text-[11px] text-sonora-muted truncate">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 pl-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentSong.id);
            }}
            className="p-1.5 text-sonora-muted hover:text-rose-500 transition-colors"
          >
            <Heart className={`w-4 h-4 ${currentSong.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-8 h-8 rounded-full bg-sonora-accent text-sonora-base flex items-center justify-center shadow-md shadow-sonora-accent/20 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current stroke-none" />
            ) : (
              <Play className="w-4 h-4 fill-current stroke-none ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="p-1.5 text-sonora-muted hover:text-sonora-light transition-colors"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
