import { renderHook } from '@testing-library/react';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { useGameStore } from '../../stores/gameStore';
import { createMockGame, createMockPlayer } from '../test-utils';

// Mock the game store
jest.mock('../../stores/gameStore');
// Mock the game service
jest.mock('../../services/gameService', () => ({
  gameService: {
    calculatePlayerMinutes: jest.fn(),
    calculatePlayerFouls: jest.fn(),
    calculatePlayerSubTime: jest.fn(),
  },
}));

const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;
const { gameService } = require('../../services/gameService');

describe('usePlayerStats', () => {
  const mockPlayer = createMockPlayer({ id: 'player1', name: 'Test Player', number: '1' });
  const mockGame = createMockGame({ players: [mockPlayer] });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    gameService.calculatePlayerMinutes.mockReturnValue(300); // 5 minutes
    gameService.calculatePlayerFouls.mockReturnValue(2);
    gameService.calculatePlayerSubTime.mockReturnValue(600); // 10:00
  });

  it('should return default stats when no game is loaded', () => {
    mockUseGameStore.mockReturnValue({
      game: null,
      activePlayers: new Set(),
      timeRemaining: 0,
      currentPeriod: 0,
    } as any);

    const { result } = renderHook(() => usePlayerStats(mockPlayer.id));

    expect(result.current).toEqual({
      totalMinutes: 0,
      fouls: 0,
      isActive: false,
      currentPeriodTime: null,
      formattedTotalTime: '0:00',
      formattedCurrentTime: '0:00',
    });
  });

  it('should calculate stats for inactive player', () => {
    mockUseGameStore.mockReturnValue({
      game: mockGame,
      activePlayers: new Set(), // Player not active
      timeRemaining: 1200,
      currentPeriod: 0,
    } as any);

    const { result } = renderHook(() => usePlayerStats(mockPlayer.id));

    expect(result.current.totalMinutes).toBe(300);
    expect(result.current.fouls).toBe(2);
    expect(result.current.isActive).toBe(false);
    expect(result.current.currentPeriodTime).toBe(null);
    expect(result.current.formattedTotalTime).toBe('5:00');
    expect(result.current.formattedCurrentTime).toBe('0:00');
  });

  it('should calculate stats for active player', () => {
    mockUseGameStore.mockReturnValue({
      game: mockGame,
      activePlayers: new Set([mockPlayer.id]), // Player is active
      timeRemaining: 1200,
      currentPeriod: 0,
    } as any);

    const { result } = renderHook(() => usePlayerStats(mockPlayer.id));

    expect(result.current.totalMinutes).toBe(300);
    expect(result.current.fouls).toBe(2);
    expect(result.current.isActive).toBe(true);
    expect(result.current.currentPeriodTime).toBe(600);
    expect(result.current.formattedTotalTime).toBe('5:00');
    expect(result.current.formattedCurrentTime).toBe('10:00');
  });

  it('should format time correctly for various durations', () => {
    // Test different minute values
    const testCases = [
      { seconds: 0, expected: '0:00' },
      { seconds: 30, expected: '0:30' },
      { seconds: 60, expected: '1:00' },
      { seconds: 90, expected: '1:30' },
      { seconds: 3600, expected: '60:00' },
    ];

    testCases.forEach(({ seconds, expected }) => {
      gameService.calculatePlayerMinutes.mockReturnValue(seconds);
      
      mockUseGameStore.mockReturnValue({
        game: mockGame,
        activePlayers: new Set(),
        timeRemaining: 1200,
        currentPeriod: 0,
      } as any);

      const { result } = renderHook(() => usePlayerStats(mockPlayer.id));
      expect(result.current.formattedTotalTime).toBe(expected);
    });
  });

  it('should handle null current period time for active player', () => {
    gameService.calculatePlayerSubTime.mockReturnValue(null);
    
    mockUseGameStore.mockReturnValue({
      game: mockGame,
      activePlayers: new Set([mockPlayer.id]),
      timeRemaining: 1200,
      currentPeriod: 0,
    } as any);

    const { result } = renderHook(() => usePlayerStats(mockPlayer.id));

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentPeriodTime).toBe(null);
    expect(result.current.formattedCurrentTime).toBe('0:00');
  });

  it('should call game service methods with correct parameters', () => {
    const activePlayers = new Set([mockPlayer.id]);
    const timeRemaining = 900;
    const currentPeriod = 1;

    mockUseGameStore.mockReturnValue({
      game: mockGame,
      activePlayers,
      timeRemaining,
      currentPeriod,
    } as any);

    renderHook(() => usePlayerStats(mockPlayer.id));

    expect(gameService.calculatePlayerMinutes).toHaveBeenCalledWith(
      mockGame,
      mockPlayer.id,
      activePlayers,
      timeRemaining,
      currentPeriod
    );

    expect(gameService.calculatePlayerFouls).toHaveBeenCalledWith(
      mockGame,
      mockPlayer.id
    );

    expect(gameService.calculatePlayerSubTime).toHaveBeenCalledWith(
      mockGame,
      mockPlayer.id,
      currentPeriod,
      activePlayers
    );
  });

  it('should recalculate when dependencies change', () => {
    const { rerender } = renderHook(
      ({ playerId }) => usePlayerStats(playerId),
      { initialProps: { playerId: mockPlayer.id } }
    );

    mockUseGameStore.mockReturnValue({
      game: mockGame,
      activePlayers: new Set(),
      timeRemaining: 1200,
      currentPeriod: 0,
    } as any);

    // Initial render
    expect(gameService.calculatePlayerMinutes).toHaveBeenCalledTimes(1);

    // Change time remaining
    mockUseGameStore.mockReturnValue({
      game: mockGame,
      activePlayers: new Set(),
      timeRemaining: 1100, // Changed
      currentPeriod: 0,
    } as any);

    rerender({ playerId: mockPlayer.id });

    expect(gameService.calculatePlayerMinutes).toHaveBeenCalledTimes(2);
  });

  it('should handle player not found in game', () => {
    const nonExistentPlayerId = 'non-existent';
    
    mockUseGameStore.mockReturnValue({
      game: mockGame,
      activePlayers: new Set(),
      timeRemaining: 1200,
      currentPeriod: 0,
    } as any);

    const { result } = renderHook(() => usePlayerStats(nonExistentPlayerId));

    // Should still call game service methods but with non-existent player ID
    expect(gameService.calculatePlayerMinutes).toHaveBeenCalledWith(
      mockGame,
      nonExistentPlayerId,
      expect.any(Set),
      1200,
      0
    );
  });
});