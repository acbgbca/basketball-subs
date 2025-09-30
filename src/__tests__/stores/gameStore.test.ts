import { act, renderHook } from '@testing-library/react';
import { useGameStore } from '../../stores/gameStore';
import { createMockGame, createMockPlayer, createMockSubstitutionEvent } from '../test-utils';

// Mock the game service and db service
jest.mock('../../services/gameService', () => ({
  gameService: {
    getGame: jest.fn(),
    updateGame: jest.fn(),
    subModalSubmit: jest.fn(),
    editSubstitution: jest.fn(),
    deleteSubstitution: jest.fn(),
    addFoul: jest.fn(),
    endPeriod: jest.fn(),
  },
}));

jest.mock('../../services/db', () => ({
  dbService: {
    getGame: jest.fn(),
    updateGame: jest.fn(),
    addGame: jest.fn(),
    getGames: jest.fn(),
    deleteGame: jest.fn(),
  },
}));

const { gameService } = require('../../services/gameService');
const { dbService } = require('../../services/db');

describe('gameStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state before each test
    useGameStore.getState().resetGameState();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useGameStore());

    expect(result.current.game).toBe(null);
    expect(result.current.activePlayers).toEqual(new Set());
    expect(result.current.currentPeriod).toBe(0);
    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe('loadGame', () => {
    const mockGame = createMockGame({
      activePlayers: ['player1', 'player2'],
      currentPeriod: 1,
      isRunning: true,
      periodStartTime: Date.now() - 5000, // Started 5 seconds ago
    });

    it('should load game successfully', async () => {
      gameService.getGame.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.loadGame('test-game-id');
      });

      expect(gameService.getGame).toHaveBeenCalledWith('test-game-id');
      expect(result.current.game).toEqual(mockGame);
      expect(result.current.activePlayers).toEqual(new Set(['player1', 'player2']));
      expect(result.current.currentPeriod).toBe(1);
      expect(result.current.isRunning).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle load game error', async () => {
      const errorMessage = 'Game not found';
      gameService.getGame.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.loadGame('invalid-id');
      });

      expect(result.current.game).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should set loading state during load', async () => {
      let resolvePromise: (value: any) => void;
      const loadPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      gameService.getGame.mockReturnValue(loadPromise);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.loadGame('test-id');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(mockGame);
        await loadPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateGame', () => {
    const mockGame = createMockGame();

    it('should update game successfully', async () => {
      gameService.updateGame.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.updateGame(mockGame);
      });

      expect(gameService.updateGame).toHaveBeenCalledWith(mockGame);
      expect(result.current.game).toEqual(mockGame);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle update game error', async () => {
      const errorMessage = 'Update failed';
      gameService.updateGame.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.updateGame(mockGame);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('setActivePlayers', () => {
    it('should set active players and update game', async () => {
      const mockGame = createMockGame();
      gameService.updateGame.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGameStore());

      // Set initial game
      await act(async () => {
        await result.current.updateGame(mockGame);
      });

      const newActivePlayers = new Set(['player1', 'player2']);

      await act(async () => {
        result.current.setActivePlayers(newActivePlayers);
      });

      expect(result.current.activePlayers).toEqual(newActivePlayers);
      expect(gameService.updateGame).toHaveBeenCalledWith({
        ...mockGame,
        activePlayers: ['player1', 'player2'],
      });
    });
  });

  describe('timer management', () => {
    const mockGame = createMockGame();

    beforeEach(async () => {
      // Set up initial game state
      gameService.updateGame.mockResolvedValue(undefined);
      await act(async () => {
        await useGameStore.getState().updateGame(mockGame);
      });
    });

    it('should start timer', async () => {
      gameService.updateGame.mockResolvedValue(undefined);
      const mockNow = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        result.current.startTimer();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.periodStartTime).toBe(mockNow);
      expect(gameService.updateGame).toHaveBeenCalledWith({
        ...mockGame,
        isRunning: true,
        periodStartTime: mockNow,
      });

      jest.restoreAllMocks();
    });

    it('should pause timer', async () => {
      gameService.updateGame.mockResolvedValue(undefined);
      const mockNow = Date.now();
      const startTime = mockNow - 5000; // Started 5 seconds ago

      const { result } = renderHook(() => useGameStore());

      // Set timer as running
      act(() => {
        useGameStore.setState({
          isRunning: true,
          periodStartTime: startTime,
          timeRemaining: 1200,
        });
      });

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      await act(async () => {
        result.current.pauseTimer();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.periodStartTime).toBe(null);
      expect(result.current.periodTimeElapsed).toBe(5); // 5 seconds elapsed
      expect(result.current.timeRemaining).toBe(1195); // 1200 - 5

      jest.restoreAllMocks();
    });

    it('should update time remaining', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.updateTimeRemaining(900);
      });

      expect(result.current.timeRemaining).toBe(900);
    });

    it('should reset timer', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.resetTimer(20); // 20 minute period
      });

      expect(result.current.timeRemaining).toBe(1200); // 20 * 60
      expect(result.current.isRunning).toBe(false);
      expect(result.current.periodStartTime).toBe(null);
      expect(result.current.periodTimeElapsed).toBe(0);
    });
  });

  describe('addSubstitution', () => {
    const mockGame = createMockGame();
    const mockEvent = createMockSubstitutionEvent();

    it('should add substitution successfully', async () => {
      const mockResult = {
        updatedGame: { ...mockGame, id: 'updated' },
        newActivePlayers: new Set(['player1']),
      };
      gameService.subModalSubmit.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGameStore());

      // Set initial state
      act(() => {
        useGameStore.setState({
          game: mockGame,
          timeRemaining: 600,
        });
      });

      await act(async () => {
        await result.current.addSubstitution(mockEvent);
      });

      expect(gameService.subModalSubmit).toHaveBeenCalledWith(
        mockGame,
        new Set(mockEvent.subbedIn.map(p => p.id)),
        new Set(mockEvent.playersOut.map(p => p.id)),
        600
      );
      expect(result.current.game).toEqual(mockResult.updatedGame);
      expect(result.current.activePlayers).toEqual(mockResult.newActivePlayers);
    });
  });

  describe('addFoul', () => {
    const mockGame = createMockGame();

    it('should add foul successfully', async () => {
      const updatedGame = { ...mockGame, id: 'updated' };
      gameService.addFoul.mockResolvedValue(updatedGame);

      const { result } = renderHook(() => useGameStore());

      // Set initial state
      act(() => {
        useGameStore.setState({
          game: mockGame,
          currentPeriod: 1,
          timeRemaining: 800,
        });
      });

      await act(async () => {
        await result.current.addFoul('player1');
      });

      expect(gameService.addFoul).toHaveBeenCalledWith(mockGame, 1, 'player1', 800);
      expect(result.current.game).toEqual(updatedGame);
    });
  });

  describe('endPeriod', () => {
    const mockGame = createMockGame();

    it('should end period successfully', async () => {
      const updatedGame = { ...mockGame, id: 'updated' };
      gameService.endPeriod.mockResolvedValue(updatedGame);

      const { result } = renderHook(() => useGameStore());

      // Set initial state
      act(() => {
        useGameStore.setState({
          game: mockGame,
        });
      });

      await act(async () => {
        await result.current.endPeriod();
      });

      expect(gameService.endPeriod).toHaveBeenCalledWith(mockGame);
      expect(result.current.game).toEqual(updatedGame);
      expect(result.current.activePlayers).toEqual(new Set()); // All players subbed out
      expect(result.current.isRunning).toBe(false);
      expect(result.current.periodStartTime).toBe(null);
      expect(result.current.periodTimeElapsed).toBe(0);
    });
  });

  describe('resetGameState', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useGameStore());

      // Set some state
      act(() => {
        useGameStore.setState({
          game: createMockGame(),
          activePlayers: new Set(['player1']),
          isRunning: true,
          error: 'Some error',
        });
      });

      act(() => {
        result.current.resetGameState();
      });

      expect(result.current.game).toBe(null);
      expect(result.current.activePlayers).toEqual(new Set());
      expect(result.current.isRunning).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});