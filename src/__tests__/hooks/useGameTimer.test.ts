import { renderHook, act } from '@testing-library/react';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useGameStore } from '../../stores/gameStore';
import { createMockGame } from '../test-utils';

// Mock the game store
jest.mock('../../stores/gameStore');

const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;

describe('useGameTimer', () => {
  const mockUpdateTimeRemaining = jest.fn();
  const mockStartTimer = jest.fn();
  const mockPauseTimer = jest.fn();
  const mockResetTimer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUseGameStore.mockReturnValue({
      timeRemaining: 1200, // 20:00
      isRunning: false,
      game: createMockGame(),
      updateTimeRemaining: mockUpdateTimeRemaining,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resetTimer: mockResetTimer,
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial timer state', () => {
    const { result } = renderHook(() => useGameTimer());

    expect(result.current.timeRemaining).toBe(1200);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.formattedTime).toBe('20:00');
  });

  it('should format time correctly', () => {
    mockUseGameStore.mockReturnValue({
      timeRemaining: 65, // 1:05
      isRunning: false,
      game: createMockGame(),
      updateTimeRemaining: mockUpdateTimeRemaining,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resetTimer: mockResetTimer,
    } as any);

    const { result } = renderHook(() => useGameTimer());
    expect(result.current.formattedTime).toBe('1:05');
  });

  it('should format time correctly for zero', () => {
    mockUseGameStore.mockReturnValue({
      timeRemaining: 0,
      isRunning: false,
      game: createMockGame(),
      updateTimeRemaining: mockUpdateTimeRemaining,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resetTimer: mockResetTimer,
    } as any);

    const { result } = renderHook(() => useGameTimer());
    expect(result.current.formattedTime).toBe('0:00');
  });

  it('should start timer when not running and time remaining', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.start();
    });

    expect(mockStartTimer).toHaveBeenCalledTimes(1);
  });

  it('should not start timer when time is zero', () => {
    mockUseGameStore.mockReturnValue({
      timeRemaining: 0,
      isRunning: false,
      game: createMockGame(),
      updateTimeRemaining: mockUpdateTimeRemaining,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resetTimer: mockResetTimer,
    } as any);

    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.start();
    });

    expect(mockStartTimer).not.toHaveBeenCalled();
  });

  it('should pause timer when running', () => {
    mockUseGameStore.mockReturnValue({
      timeRemaining: 1200,
      isRunning: true,
      game: createMockGame(),
      updateTimeRemaining: mockUpdateTimeRemaining,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resetTimer: mockResetTimer,
    } as any);

    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.pause();
    });

    expect(mockPauseTimer).toHaveBeenCalledTimes(1);
  });

  it('should reset timer with period length', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.reset(10); // 10 minute period
    });

    expect(mockResetTimer).toHaveBeenCalledWith(10);
  });

  it('should reset timer with game period length when no parameter provided', () => {
    const game = createMockGame();
    game.periods[0].length = 20;
    game.currentPeriod = 0;

    mockUseGameStore.mockReturnValue({
      timeRemaining: 1200,
      isRunning: false,
      game,
      updateTimeRemaining: mockUpdateTimeRemaining,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resetTimer: mockResetTimer,
    } as any);

    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.reset();
    });

    expect(mockResetTimer).toHaveBeenCalledWith(20);
  });

  it('should use default period length when game not available', () => {
    mockUseGameStore.mockReturnValue({
      timeRemaining: 1200,
      isRunning: false,
      game: null,
      updateTimeRemaining: mockUpdateTimeRemaining,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resetTimer: mockResetTimer,
    } as any);

    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.reset();
    });

    expect(mockResetTimer).toHaveBeenCalledWith(10);
  });
});