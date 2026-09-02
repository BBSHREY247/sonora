import React from 'react';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  ListMusic, 
  Activity, 
  Volume2, 
  VolumeX,
  Music
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { api } from '../services/api';

interface AndroidExpandedPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQueue: () => void;
}

export const AndroidExpandedPlayer: React.FC<AndroidExpandedPlayerProps> = ({
  isOpen,
  onClose,
  onOpenQueue
}) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    visualizerActive,
    frequencyData,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleVisualizer
  } = usePlayer();

  const { toggleFavorite } = useLibrary();

  if (!isOpen || !currentSong) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const coverUrl = api.getCoverArtUrl(currentSong.cover_path);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bars = frequencyData ? Array.from(frequencyData.slice(0, 24)) : Array(24).fill(10);

  return (
    <div className="fixed inset-0 z-50 bg-sonora-base flex flex-col justify-between p-6 select-none animate-slide-up overflow-hidden safe-area-pt safe-area-pb">
      {/* Background Ambient Glow */}
      {coverUrl && (
        <div 
          className="absolute inset-0 opacity-25 filter blur-[100px] pointer-events-none scale-150 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-sonora-light transition-colors active:scale-95"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-[10px] font-bold tracking-widest text-sonora-accent uppercase">
            PLAYING FROM YOUR LIBRARY
          </p>
          <p className="text-xs font-semibold text-sonora-light truncate max-w-[200px]">
            {currentSong.album || 'Sonora Tracks'}
          </p>
        </div>

        <button
          onClick={onOpenQueue}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-sonora-light transition-colors active:scale-95"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>

      {/* Center Artwork & Visualizer */}
      <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-sm mx-auto">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6 group">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={currentSong.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-sonora-elevated text-sonora-muted">
              <Music className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Live Visualizer spectrum */}
        {visualizerActive && (
          <div className="w-full flex items-end justify-center gap-1 h-12 mb-4 px-2">
            {bars.map((val, idx) => {
              const heightPercent = isPlaying ? Math.max(10, (val / 255) * 100) : 10;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-gradient-to-t from-sonora-accent/40 via-sonora-accent to-teal-200 rounded-t-full transition-all duration-75 shadow-sm shadow-sonora-accent/50"
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>
        )}

        {/* Track Title & Artist & Favorite */}
        <div className="flex items-center justify-between w-full mb-4 px-1">
          <div className="min-w-0 flex-1 mr-3">
            <h2 className="text-xl font-bold text-white truncate">
              {currentSong.title}
            </h2>
            <p className="text-sm text-sonora-muted truncate mt-0.5">
              {currentSong.artist}
            </p>
          </div>

          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className="p-2 text-sonora-muted hover:text-rose-500 transition-colors active:scale-125"
          >
            <Heart
              className={`w-6 h-6 ${
                currentSong.favorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Scrubber Bar */}
        <div className="w-full space-y-1 mb-6">
          <div className="relative flex items-center h-4 cursor-pointer group">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-sonora-accent group-hover:bg-sonora-accentHover transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[11px] text-sonora-muted font-mono px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between w-full mb-6 px-2">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${
              shuffle ? 'text-sonora-accent' : 'text-sonora-muted hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={playPrevious}
            className="p-2 text-sonora-light hover:text-white active:scale-90 transition-transform"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-sonora-accent text-sonora-base hover:bg-sonora-accentHover flex items-center justify-center shadow-xl shadow-sonora-accent/40 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current stroke-none" />
            ) : (
              <Play className="w-7 h-7 fill-current stroke-none ml-1" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-2 text-sonora-light hover:text-white active:scale-90 transition-transform"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2 transition-colors ${
              repeatMode !== 'off' ? 'text-sonora-accent' : 'text-sonora-muted hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Extra Toolbar (Visualizer Toggle & Volume) */}
        <div className="flex items-center justify-between w-full px-4 text-sonora-muted">
          <button
            onClick={toggleVisualizer}
            className={`p-2 rounded-lg transition-colors ${
              visualizerActive ? 'text-sonora-accent bg-sonora-accent/15' : 'hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 w-32">
            <button onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full cursor-pointer accent-sonora-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
