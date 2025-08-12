import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GameView } from '../components/GameView';
import { dbService } from '../services/db';
import { gameService } from '../services/gameService';
import { useGameTimer } from '../hooks/useGameTimer';
import { Game } from '../types';
jest.mock('../services/db');
jest.mock('../services/gameService');
jest.mock('../hooks/useGameTimer');

describe('Game Operations', () => {
  // Increase timeout for async operations
  jest.setTimeout(15000);
  const mockUseGameTimer = useGameTimer as jest.MockedFunction<typeof useGameTimer>;
  
  const mockTeam = {
    id: '1',
    name: 'Test Team',
    players: [
      { id: '1', name: 'Player 1', number: '23' },
      { id: '2', name: 'Player 2', number: '24' }
    ]
  };

  const mockGame = {
    id: '1',
    team: mockTeam,
    date: new Date(),
    periods: [
      { id: '1', periodNumber: 1, length: 20, substitutions: [], fouls: [], subEvents: [] },
      { id: '2', periodNumber: 2, length: 20, substitutions: [], fouls: [], subEvents: [] }
    ],
    opponent: 'Opponent Team',
    players: mockTeam.players,
    activePlayers: [],
    currentPeriod: 0,
    isRunning: false,
    periodStartTime: undefined,
    periodTimeElapsed: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(dbService, 'getTeams').mockResolvedValue([mockTeam]);
    jest.spyOn(dbService, 'getGame').mockResolvedValue(mockGame as Game);
    jest.spyOn(gameService, 'getGame').mockResolvedValue(mockGame as Game);
    jest.spyOn(gameService, 'updateGame').mockResolvedValue(mockGame as Game);
    jest.spyOn(gameService, 'subModalSubmit').mockResolvedValue({
      updatedGame: mockGame as Game,
      newActivePlayers: new Set(['1'])
    });
    jest.spyOn(gameService, 'addFoul').mockResolvedValue(mockGame as Game);
    jest.spyOn(gameService, 'endPeriod').mockResolvedValue(mockGame as Game);
    
    // Mock the useGameTimer hook
    let currentTime = 1200; // 20 minutes in seconds
    mockUseGameTimer.mockReturnValue({
      timeRemaining: currentTime,
      isRunning: false,
      handleTimeAdjustment: jest.fn((seconds: number) => {
        currentTime = Math.max(0, currentTime + seconds);
      }),
      toggleTimer: jest.fn(),
      stopTimer: jest.fn(),
      setTimeForPeriod: jest.fn(),
      setTimeRemaining: jest.fn()
    });
  });

  test('manages game clock and timer functions', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/games/1']}>
          <Routes>
            <Route path="/games/:id" element={<GameView />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Wait for the game to load via the useGame hook
    await waitFor(() => {
      expect(gameService.getGame).toHaveBeenCalledWith('1');
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Test timer functionality - verify the adjustment function is called
    const mockTimerReturn = mockUseGameTimer.mock.results[0].value;
    
    // Test a few time adjustments
    for (const adjustment of [-1, 1, 10]) {
      const buttonText = `${adjustment > 0 ? '+' : ''}${adjustment}s`;
      
      await act(async () => {
        await userEvent.click(screen.getByText(buttonText));
      });
      
      // Verify the handleTimeAdjustment function was called with correct value
      expect(mockTimerReturn.handleTimeAdjustment).toHaveBeenCalledWith(adjustment);
    }

    // Test Start/Stop clock
    await act(async () => {
      await userEvent.click(screen.getByText('Start'));
    });
    expect(mockTimerReturn.toggleTimer).toHaveBeenCalled();
    
    await act(async () => {
      await userEvent.click(screen.getByText('Stop'));
    });
    expect(mockTimerReturn.toggleTimer).toHaveBeenCalled();
  });

  test('validates maximum players on court in substitution modal', async () => {
    const mockUpdateGame = jest.spyOn(gameService, 'updateGame');
    const testPlayers = [
      { id: '1', name: 'Player 1', number: '1' },
      { id: '2', name: 'Player 2', number: '2' },
      { id: '3', name: 'Player 3', number: '3' },
      { id: '4', name: 'Player 4', number: '4' },
      { id: '5', name: 'Player 5', number: '5' },
      { id: '6', name: 'Player 6', number: '6' },
      { id: '7', name: 'Player 7', number: '7' }
    ];
    const testGame = {
      id: '1',
      team: { ...mockTeam, players: testPlayers },
      date: new Date(),
      periods: [
        { id: '1', periodNumber: 1, length: 20, substitutions: [], fouls: [], subEvents: [] },
        { id: '2', periodNumber: 2, length: 20, substitutions: [], fouls: [], subEvents: [] }
      ],
      opponent: 'Opponent Team',
      players: testPlayers,
      activePlayers: [],
      currentPeriod: 0,
      isRunning: false,
      periodStartTime: undefined,
      periodTimeElapsed: undefined
    };
    jest.spyOn(gameService, 'getGame').mockResolvedValue(testGame as Game);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/games/1']}>
          <Routes>
            <Route path="/games/:id" element={<GameView />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });

    // Open sub modal and select 6 players
    await act(async () => {
      await userEvent.click(screen.getByText('Sub'));
    });
    await waitFor(() => {
      expect(screen.getByText('Manage Substitutions')).toBeInTheDocument();
    });

    // Select first 6 players
    for (let i = 1; i <= 6; i++) {
      const modal = screen.getByTestId('substitution-modal');
      const player = within(modal).getByText(`Player ${i}`);
      await act(async () => {
        await userEvent.click(player);
      });
    }

    // Check done button is disabled
    await waitFor(() => {
      expect(screen.getByTestId('sub-modal-done')).toBeDisabled();
    });

    // Deselect one player to get back to 5
    const modal = screen.getByTestId('substitution-modal');
    await act(async () => {
      await userEvent.click(within(modal).getByText('Player 6'));
    });
    
    // Check warning is gone and done button is enabled
    await waitFor(() => {
      expect(screen.queryByTestId('too-many-players-warning')).not.toBeInTheDocument();
      expect(screen.getByTestId('sub-modal-done')).toBeEnabled();
    });
  });

  test('records and displays player fouls', async () => {
    const mockUpdateGame = jest.spyOn(gameService, 'updateGame');
    const testPlayers = [
      { id: '1', name: 'Player 1', number: '1' },
      { id: '2', name: 'Player 2', number: '2' }
    ];
    const testGame = {
      id: '1',
      team: { ...mockTeam, players: testPlayers },
      date: new Date(),
      periods: [
        { id: '1', periodNumber: 1, length: 20, substitutions: [], fouls: [], subEvents: [] }
      ],
      opponent: 'Test Opponent',
      players: testPlayers,
      activePlayers: ['1'], // Player 1 is already on court
      currentPeriod: 0,
      isRunning: false
    };
    jest.spyOn(gameService, 'getGame').mockResolvedValue(testGame as Game);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/games/1']}>
          <Routes>
            <Route path="/games/:id" element={<GameView />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Wait for game to load
    await waitFor(() => {
      expect(gameService.getGame).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });

    // Record foul for Player 1 (who is already on court)
    await act(async () => {
      await userEvent.click(screen.getByText('Foul'));
    });
    await waitFor(() => {
      expect(screen.getByText('Record Foul')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('foul-modal')).toBeInTheDocument();
    });
    await act(async () => {
      await userEvent.click(within(screen.getByTestId('foul-modal')).getByText('1 - Player 1'));
    });
    await act(async () => {
      await userEvent.click(within(screen.getByTestId('foul-modal')).getByText('Done'));
    });

    await waitFor(() => {
      expect(gameService.addFoul).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' }),
        0, // current period
        '1', // player id
        expect.any(Number) // time remaining
      );
    });

    // Add another foul
    await act(async () => {
      await userEvent.click(screen.getByText('Foul'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('foul-modal')).toBeInTheDocument();
    });
    await act(async () => {
      await userEvent.click(within(screen.getByTestId('foul-modal')).getByText('1 - Player 1'));
    });
    await act(async () => {
      await userEvent.click(screen.getByText('Done'));
    });

    // Verify fouls are displayed
    await waitFor(() => {
      const playerRow = screen.getByTestId('player-1');
      expect(within(playerRow).getByText('2')).toBeInTheDocument();
    });
  });
});