import { useState, useEffect, useRef } from 'react';
import { Game } from '../types';
import { gameService } from '../services/gameService';

/**
 * Custom hook for managing game timer state and logic
 * @param game - Current game data
 * @param currentPeriod - Current period index
 * @returns Timer state and control functions
 */
export function useGameTimer(game: Game | null, currentPeriod: number) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const justAdjustedRef = useRef(false);
  const baseTimeRef = useRef<{startTime: number; initialRemaining: number} | null>(null);

  // Initialize timer state when game data is loaded
  useEffect(() => {
    if (game) {
      setIsRunning(game.isRunning || false);
      
      // Calculate time remaining based on period start time or elapsed time
      const currentPeriodIndex = game.currentPeriod || 0;
      if (game.isRunning && game.periodStartTime) {
        const elapsedSeconds = Math.floor((Date.now() - game.periodStartTime) / 1000);
        const periodLength = game.periods[currentPeriodIndex].length * 60;
        setTimeRemaining(Math.max(0, periodLength - elapsedSeconds));
      } else if (game.periodTimeElapsed) {
        const periodLength = game.periods[currentPeriodIndex].length * 60;
        setTimeRemaining(Math.max(0, periodLength - game.periodTimeElapsed));
      } else {
        setTimeRemaining(game.periods[currentPeriodIndex].length * 60);
      }
    }
  }, [game]);

  // Timer effect for countdown
  useEffect(() => {
    if (isRunning) {
      // Initialize or update the base time ref
      if (!baseTimeRef.current || justAdjustedRef.current) {
        baseTimeRef.current = {
          startTime: Date.now(),
          initialRemaining: timeRemaining
        };
        justAdjustedRef.current = false;
      }
      
      timerRef.current = setInterval(() => {
        if (!baseTimeRef.current) return;
        
        const elapsed = Math.floor((Date.now() - baseTimeRef.current.startTime) / 1000);
        const newRemaining = Math.max(0, baseTimeRef.current.initialRemaining - elapsed);
        
        setTimeRemaining(newRemaining);
        
        if (newRemaining <= 0) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          setIsRunning(false);
          baseTimeRef.current = null;
        }
      }, 100);
    } else {
      clearInterval(timerRef.current as NodeJS.Timeout);
      baseTimeRef.current = null;
    }
    return () => {
      clearInterval(timerRef.current as NodeJS.Timeout);
    };
  }, [isRunning, timeRemaining]);

  // Handle time adjustments
  const handleTimeAdjustment = (seconds: number) => {
    const newTime = Math.max(0, timeRemaining + seconds);
    setTimeRemaining(newTime);
    justAdjustedRef.current = true;
    
    if (isRunning) {
      baseTimeRef.current = {
        startTime: Date.now(),
        initialRemaining: newTime
      };
    }
    
    // If the clock is running, we need to adjust the game's periodStartTime
    if (isRunning && game) {
      const updatedGame = {
        ...game,
        periodStartTime: Date.now() - ((game.periods[currentPeriod].length * 60) - newTime) * 1000
      };
      gameService.updateGame(updatedGame);
    }
  };

  // Toggle timer running state
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };

  // Stop timer (for period end)
  const stopTimer = () => {
    setIsRunning(false);
  };

  // Set time for new period
  const setTimeForPeriod = (periodIndex: number, periodLength: number) => {
    setTimeRemaining(periodLength * 60);
    setIsRunning(false);
  };

  return {
    timeRemaining,
    isRunning,
    handleTimeAdjustment,
    toggleTimer,
    stopTimer,
    setTimeForPeriod,
    setTimeRemaining
  };
}