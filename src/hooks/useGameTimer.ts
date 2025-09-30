import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';

interface GameTimerHook {
  timeRemaining: number;
  isRunning: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  reset: (periodLength?: number) => void;
}

/**
 * Custom hook for managing game timer functionality
 * Integrates with the game store and provides timer controls
 */
export const useGameTimer = (): GameTimerHook => {
  const {
    timeRemaining,
    isRunning,
    game,
    startTimer,
    pauseTimer,
    resetTimer,
    updateTimeRemaining,
  } = useGameStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formattedTime = formatTime(timeRemaining);

  // Timer tick function
  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastUpdateRef.current) / 1000);
    
    if (elapsed >= 1) {
      lastUpdateRef.current = now;
      updateTimeRemaining(Math.max(0, timeRemaining - elapsed));
    }
  }, [timeRemaining, updateTimeRemaining]);

  // Start timer
  const start = useCallback(() => {
    if (!isRunning && timeRemaining > 0) {
      startTimer();
      lastUpdateRef.current = Date.now();
    }
  }, [isRunning, timeRemaining, startTimer]);

  // Pause timer
  const pause = useCallback(() => {
    if (isRunning) {
      pauseTimer();
    }
  }, [isRunning, pauseTimer]);

  // Reset timer
  const reset = useCallback((periodLength?: number) => {
    const length = periodLength || (game?.periods[game.currentPeriod]?.length) || 10;
    resetTimer(length);
  }, [game, resetTimer]);

  // Effect to handle timer interval
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(tick, 100); // Update every 100ms for smooth display
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRunning, timeRemaining, tick]);

  // Auto-pause when timer reaches 0
  useEffect(() => {
    if (isRunning && timeRemaining <= 0) {
      pause();
    }
  }, [isRunning, timeRemaining, pause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isRunning,
    formattedTime,
    start,
    pause,
    reset,
  };
};