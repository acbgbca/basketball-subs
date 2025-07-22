import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GameView } from '../components/GameView';
import { dbService } from '../services/db';
import { Game } from '../types';
jest.mock('../services/db');

describe('Game Operations', () => {
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
  });

  test('manages game clock and substitutions', async () => {
    const mockUpdateGame = jest.spyOn(dbService, 'updateGame');

    render(
      <MemoryRouter initialEntries={['/games/1']}>
        <Routes>
          <Route path="/games/:id" element={<GameView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(dbService.getGame).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeInTheDocument();
    });

    // Time adjustments
    for (const adjustment of [-1, -10, -30, 1, 10, 30]) {
      let timeBefore: number = parseInt(screen.getByTestId('clock-display').getAttribute('data-seconds') || '0');
      const buttonText = `${adjustment > 0 ? '+' : ''}${adjustment}s`;
      await userEvent.click(screen.getByText(buttonText));
      await waitFor(() => {
        expect(screen.getByTestId('clock-display').getAttribute('data-seconds')).toBe((timeBefore + adjustment).toString());
      });
    }

    // Start/Stop clock
    await userEvent.click(screen.getByText('Start'));
    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Stop'));
    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    // Substitutions
    await userEvent.click(screen.getByText('Sub'));
    await waitFor(() => {
      expect(screen.getByText('Manage Substitutions')).toBeInTheDocument();
    });

    let player1 = within(screen.getByTestId('substitution-modal')).getByText('Player 1');
    await userEvent.click(player1);
    await userEvent.click(screen.getByText('Done'));

    await waitFor(() => {
      expect(mockUpdateGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({
              substitutions: expect.arrayContaining([
                expect.objectContaining({ timeInEvent: expect.any(String) })
              ])
            })
          ])
        })
      );
    });

    await userEvent.click(screen.getByText('Sub'));
    await waitFor(() => {
      expect(screen.getByText('Manage Substitutions')).toBeInTheDocument();
    });

    player1 = within(screen.getByTestId('substitution-modal')).getByText('Player 1');
    await userEvent.click(within(player1.closest('div')!).getByText('Out'));
    await userEvent.click(screen.getByText('Done'));

    await waitFor(() => {
      expect(mockUpdateGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({
              substitutions: expect.arrayContaining([
                expect.objectContaining({ timeOutEvent: expect.any(String) })
              ])
            })
          ])
        })
      );
    });

    // End period
    await userEvent.click(screen.getByText('End Period'));
    await waitFor(() => {
      expect(screen.getByText('End Period', { selector: '.modal button' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('End Period', { selector: '.modal button' }));

    await waitFor(() => {
      expect(mockUpdateGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({
              substitutions: expect.arrayContaining([
                expect.objectContaining({ timeOutEvent: expect.any(String) })
              ])
            })
          ])
        })
      );
    });
  });

  test('validates maximum players on court in substitution modal', async () => {
    const mockUpdateGame = jest.spyOn(dbService, 'updateGame');
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
    jest.spyOn(dbService, 'getGame').mockResolvedValue(testGame as Game);

    render(
      <MemoryRouter initialEntries={['/games/1']}>
        <Routes>
          <Route path="/games/:id" element={<GameView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });

    // Open sub modal and select 6 players
    userEvent.click(screen.getByText('Sub'));
    await waitFor(() => {
      expect(screen.getByText('Manage Substitutions')).toBeInTheDocument();
    });

    // Select first 6 players
    for (let i = 1; i <= 6; i++) {
      const modal = screen.getByTestId('substitution-modal');
      const player = within(modal).getByText(`Player ${i}`);
      userEvent.click(player);
    }

    // Check done button is disabled
    await waitFor(() => {
      expect(screen.getByTestId('sub-modal-done')).toBeDisabled();
    });

    // Deselect one player to get back to 5
    const modal = screen.getByTestId('substitution-modal');
    userEvent.click(within(modal).getByText('Player 6'));
    
    // Check warning is gone and done button is enabled
    await waitFor(() => {
      expect(screen.queryByTestId('too-many-players-warning')).not.toBeInTheDocument();
      expect(screen.getByTestId('sub-modal-done')).toBeEnabled();
    });
  });

  test('records and displays player fouls', async () => {
    const mockUpdateGame = jest.spyOn(dbService, 'updateGame');
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
      activePlayers: [],
      currentPeriod: 0,
      isRunning: false
    };
    jest.spyOn(dbService, 'getGame').mockResolvedValue(testGame as Game);

    render(
      <MemoryRouter initialEntries={['/games/1']}>
        <Routes>
          <Route path="/games/:id" element={<GameView />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });

    // First try to record a foul - should see warning
    userEvent.click(screen.getByText('Foul'));
    await waitFor(() => {
      expect(screen.getByTestId('foul-modal').getElementsByClassName('alert')[0]).toBeInTheDocument();
    });
    userEvent.click(screen.getByText('Cancel'));

    // Sub in Player 1
    userEvent.click(screen.getByText('Sub'));
    await waitFor(() => {
      expect(screen.getByText('Manage Substitutions')).toBeInTheDocument();
    });
    userEvent.click(within(screen.getByTestId('substitution-modal')).getByText('Player 1'));
    userEvent.click(screen.getByTestId('sub-modal-done'));

    // Now record foul for Player 1
    await userEvent.click(screen.getByText('Foul'));
    await waitFor(() => {
      expect(screen.getByText('Record Foul')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('foul-modal')).toBeInTheDocument();
    });
    await userEvent.click(within(screen.getByTestId('foul-modal')).getByText('1 - Player 1'));
    await userEvent.click(within(screen.getByTestId('foul-modal')).getByText('Done'));

    await waitFor(() => {
      expect(mockUpdateGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({
              fouls: expect.arrayContaining([
                expect.objectContaining({
                  player: expect.objectContaining({ name: 'Player 1' })
                })
              ])
            })
          ])
        })
      );
    });

    // Add another foul
    await userEvent.click(screen.getByText('Foul'));
    await waitFor(() => {
      expect(screen.getByTestId('foul-modal')).toBeInTheDocument();
    });
    await userEvent.click(within(screen.getByTestId('foul-modal')).getByText('1 - Player 1'));
    await userEvent.click(screen.getByText('Done'));

    // Verify fouls are displayed
    await waitFor(() => {
      const playerRow = screen.getByTestId('player-1');
      expect(within(playerRow).getByText('2')).toBeInTheDocument();
    });
  });
});