import React from 'react';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Minimize2,
  Music
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

export const VisualizerOverlay: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    frequencyData,
    visualizerActive,
    isFullscreen,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    toggleVisualizer,
    toggleFullscreen
  } = usePlayer();

  const { toggleFavorite } = useLibrary();

  if (!visualizerActive && !isFullscreen) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const coverUrl = currentSong ? currentSong.artworkUri : null;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Render frequency bars array
  const bars = frequencyData ? Array.from(frequencyData.slice(0, 32)) : Array(32).fill(10);

  return (
    <div className="fixed inset-0 z-50 bg-sonora-base/95 backdrop-blur-3xl flex flex-col justify-between p-8 select-none animate-fade-in overflow-hidden">
      {/* Background Ambient Glow */}
      {coverUrl && (
        <div 
          className="absolute inset-0 opacity-20 filter blur-[120px] pointer-events-none scale-125 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}

      {/* Top Header with Close / Minimize */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-widest text-sonora-accent uppercase">
            PYRACUBE LIVE SPECTRUM
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={isFullscreen ? toggleFullscreen : toggleVisualizer}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-sonora-muted hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Center Artwork & Visualizer */}
      <div className="flex flex-col items-center justify-center my-auto z-10 max-w-xl mx-auto w-full">
        {/* Cover Art */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-8 group">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={currentSong?.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-sonora-elevated text-sonora-muted">
              <Music className="w-20 h-20" />
            </div>
          )}
        </div>

        {/* Live Frequency Spectrum Bars */}
        <div className="w-full flex items-end justify-center gap-1.5 h-20 mb-8 px-4">
          {bars.map((val, idx) => {
            const heightPercent = isPlaying ? Math.max(8, (val / 255) * 100) : 8;
            return (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-sonora-accent/40 via-sonora-accent to-teal-200 rounded-t-full transition-all duration-75 shadow-sm shadow-sonora-accent/50"
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>

        {/* Title & Artist */}
        <div className="text-center w-full mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white truncate mb-2">
            {currentSong?.title || 'No Song Playing'}
          </h2>
          <p className="text-sm md:text-base text-sonora-muted truncate">
            {currentSong?.artist || 'Unknown Artist'} • {currentSong?.album || 'Unknown Album'}
          </p>
        </div>

        {/* Scrubber */}
        <div className="w-full flex items-center gap-3 text-xs text-sonora-muted mb-6">
          <span>{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center h-4 cursor-pointer group">
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
          <span>{formatTime(duration)}</span>
        </div>

        {/* Fullscreen Controls */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => currentSong && toggleFavorite(currentSong.id, !currentSong.favorite)}
            className="text-sonora-muted hover:text-rose-500 transition-colors"
          >
            <Heart className={`w-6 h-6 ${currentSong?.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={playPrevious}
            className="text-sonora-muted hover:text-white transition-colors active:scale-90"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-sonora-accent text-sonora-base hover:bg-sonora-accentHover hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-xl shadow-sonora-accent/40"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current stroke-none" />
            ) : (
              <Play className="w-7 h-7 fill-current stroke-none ml-1" />
            )}
          </button>

          <button
            onClick={playNext}
            className="text-sonora-muted hover:text-white transition-colors active:scale-90"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-sonora-muted/40 z-10">
        Press Space to Play/Pause • Arrows for Volume & Track Skipping
      </div>
    </div>
  );
};