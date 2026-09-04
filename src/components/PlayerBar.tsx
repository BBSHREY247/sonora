import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Volume1,
  Heart, 
  ListMusic, 
  Activity, 
  Maximize2,
  Music
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

interface PlayerBarProps {
  onToggleQueue: () => void;
  isQueueOpen: boolean;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({ onToggleQueue, isQueueOpen }) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    queue,
    visualizerActive,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleVisualizer,
    toggleFullscreen
  } = usePlayer();

  const { toggleFavorite } = useLibrary();

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4" />;
    if (volume < 0.5) return <Volume1 className="w-4 h-4" />;
    return <Volume2 className="w-4 h-4" />;
  };

  return (
    <footer className="h-24 bg-sonora-surface/95 backdrop-blur-xl border-t border-sonora-border/70 px-6 flex items-center justify-between z-20 select-none">
      {/* Currently Playing Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        {currentSong ? (
          <>
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-sonora-card flex-shrink-0 shadow-md border border-white/5">
              {currentSong.artworkUri ? (
                <img
                  src={currentSong.artworkUri}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-sonora-elevated text-sonora-muted">
                  <Music className="w-6 h-6" />
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                  <span className="sound-bar h-3" />
                  <span className="sound-bar h-5" />
                  <span className="sound-bar h-4" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-sonora-light truncate hover:underline cursor-pointer">
                {currentSong.title}
              </h4>
              <p className="text-xs text-sonora-muted truncate hover:underline cursor-pointer mt-0.5">
                {currentSong.artist}
              </p>
            </div>

            <button
              onClick={() => toggleFavorite(currentSong.id, !currentSong.favorite)}
              className="text-sonora-muted hover:text-rose-500 transition-colors ml-2"
              title={currentSong.favorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  currentSong.favorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>
          </>
        ) : (
          <div className="text-xs text-sonora-muted/60 italic">
            Select a song to start listening
          </div>
        )}
      </div>

      {/* Main Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center gap-2 w-2/4 max-w-2xl px-4">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleShuffle}
            title={`Shuffle: ${shuffle ? 'On' : 'Off'}`}
            className={`transition-colors ${
              shuffle ? 'text-sonora-accent' : 'text-sonora-muted hover:text-sonora-light'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={playPrevious}
            title="Previous Track"
            className="text-sonora-muted hover:text-sonora-light transition-colors active:scale-90"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentSong}
            title={isPlaying ? "Pause" : "Play"}
            className="w-10 h-10 rounded-full bg-sonora-accent text-sonora-base hover:bg-sonora-accentHover hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-md shadow-sonora-accent/30 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current stroke-none" />
            ) : (
              <Play className="w-5 h-5 fill-current stroke-none ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            title="Next Track"
            className="text-sonora-muted hover:text-sonora-light transition-colors active:scale-90"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            title={`Repeat: ${repeatMode}`}
            className={`transition-colors ${
              repeatMode !== 'off' ? 'text-sonora-accent' : 'text-sonora-muted hover:text-sonora-light'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrubber Bar */}
        <div className="w-full flex items-center gap-3 text-[11px] text-sonora-muted font-medium range-hover">
          <span className="w-9 text-right font-mono">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center h-4 group cursor-pointer">
            <div className="w-full h-1 bg-sonora-border rounded-full overflow-hidden">
              <div
                className="h-full bg-sonora-light group-hover:bg-sonora-accent transition-all duration-75"
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
          <span className="w-9 font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Extra Utilities (Volume, Visualizer, Queue, Fullscreen) */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px]">
        {/* Visualizer Toggle */}
        <button
          onClick={toggleVisualizer}
          title="Toggle Audio Visualizer"
          className={`p-2 rounded-lg transition-colors ${
            visualizerActive ? 'text-sonora-accent bg-sonora-accent/15' : 'text-sonora-muted hover:text-sonora-light'
          }`}
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Queue Drawer Toggle */}
        <button
          onClick={onToggleQueue}
          title="Play Queue"
          className={`relative p-2 rounded-lg transition-colors ${
            isQueueOpen ? 'text-sonora-accent bg-sonora-accent/15' : 'text-sonora-muted hover:text-sonora-light'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          {queue.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sonora-accent" />
          )}
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 group range-hover">
          <button
            onClick={toggleMute}
            className="text-sonora-muted hover:text-sonora-light transition-colors"
          >
            {getVolumeIcon()}
          </button>
          <div className="relative w-24 flex items-center h-4">
            <div className="w-full h-1 bg-sonora-border rounded-full overflow-hidden">
              <div
                className="h-full bg-sonora-light group-hover:bg-sonora-accent transition-all"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Fullscreen Player Toggle */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Ambient Fullscreen Mode"
          className="text-sonora-muted hover:text-sonora-light transition-colors p-1"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};