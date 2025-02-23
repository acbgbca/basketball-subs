import React, { createContext, useContext, useState } from 'react';
import { Game, Period, Substitution } from '../types';

interface GameContextType {
  currentGame: Game | null;
  isClockRunning: boolean;
  currentTime: number;
  startClock: () => void;
  stopClock: () => void;
  adjustClock: (time: number) => void;
  addSubstitution: (substitution: Substitution) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const startClock = () => {
    setIsClockRunning(true);
    // Implement clock logic
  };

  const stopClock = () => {
    setIsClockRunning(false);
  };

  const adjustClock = (time: number) => {
    setCurrentTime(time);
  };

  const addSubstitution = (substitution: Substitution) => {
    if (!currentGame) return;
    // Implement substitution logic
  };

  return (
    <GameContext.Provider
      value={{
        currentGame,
        isClockRunning,
        currentTime,
        startClock,
        stopClock,
        adjustClock,
        addSubstitution,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 