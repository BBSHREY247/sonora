import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Song, Player } from '../plugins';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  queueIndex: number;
  visualizerActive: boolean;
  isFullscreen: boolean;
  frequencyData: Uint8Array | null;
  
  // Actions
  playSong: (song: Song, contextQueue?: Song[]) => void;
  playList: (songs: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  toggleVisualizer: () => void;
  toggleFullscreen: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [visualizerActive, setVisualizerActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  const nativePlayer = Player;

  // Sync with native player
  useEffect(() => {
    const handlePlaybackStateChanged = (data: { playing: boolean }) => {
      setIsPlaying(data.playing);
    };

    const handleProgressChanged = (data: { current: number; duration: number }) => {
      setCurrentTime(data.current);
      setDuration(data.duration);
    };

    nativePlayer.addListener('playbackStateChanged', handlePlaybackStateChanged);
    nativePlayer.addListener('progressChanged', handleProgressChanged);

    // Get initial state
    nativePlayer.getCurrentState().then(state => {
      setIsPlaying(false); // Default, will be updated by listener
    });

    return () => {
      nativePlayer.removeAllListeners();
    };
  }, []);

  const playSong = useCallback(async (song: Song, contextQueue?: Song[]) => {
    if (contextQueue && contextQueue.length > 0) {
      await nativePlayer.playSongs({ songs: contextQueue, startIndex: contextQueue.findIndex(s => s.id === song.id) });
    } else {
      await nativePlayer.playSong({ song });
    }
    setCurrentSong(song);
  }, []);

  const playList = useCallback(async (songs: Song[], startIndex: number = 0) => {
    if (songs.length === 0) return;
    await nativePlayer.playSongs({ songs, startIndex });
    setCurrentSong(songs[startIndex] || songs[0]);
  }, []);

  const togglePlay = useCallback(async () => {
    await nativePlayer.togglePlayPause();
  }, []);

  const playNext = useCallback(async () => {
    await nativePlayer.playNext();
  }, []);

  const playPrevious = useCallback(async () => {
    await nativePlayer.playPrevious();
  }, []);

  const seek = useCallback(async (seconds: number) => {
    await nativePlayer.seekTo({ position: Math.floor(seconds * 1000) });
  }, []);

  const setVolume = useCallback(async (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    await nativePlayer.setVolume({ volume: clamped });
  }, []);

  const toggleMute = useCallback(async () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    await nativePlayer.setVolume({ volume: nextMute ? 0 : volume });
  }, []);

  const toggleShuffle = useCallback(async () => {
    const nextShuffle = !shuffle;
    setShuffle(nextShuffle);
    await nativePlayer.setShuffle({ enabled: nextShuffle });
  }, []);

  const cycleRepeat = useCallback(async () => {
    setRepeatMode(prev => {
      if (prev === 'off') {
        setRepeatMode('all');
        nativePlayer.setRepeatMode({ mode: 1 }); // Player.REPEAT_MODE_ALL
        return 'all';
      }
      if (prev === 'all') {
        setRepeatMode('one');
        nativePlayer.setRepeatMode({ mode: 2 }); // Player.REPEAT_MODE_ONE
        return 'one';
      }
      setRepeatMode('off');
      nativePlayer.setRepeatMode({ mode: 0 }); // Player.REPEAT_MODE_OFF
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    }
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const clearQueue = useCallback(() => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
  }, [currentSong]);

  const toggleVisualizer = useCallback(() => {
    setVisualizerActive(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        playNext();
      } else if (e.code === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        playPrevious();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, playNext, playPrevious, volume, toggleMute]);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        shuffle,
        repeatMode,
        queue,
        queueIndex,
        visualizerActive,
        isFullscreen,
        frequencyData,
        playSong,
        playList,
        togglePlay,
        playNext,
        playPrevious,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        toggleVisualizer,
        toggleFullscreen
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};