import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { GameForm } from '../components/GameForm';
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
      { id: '1', periodNumber: 1, length: 20, substitutions: [] },
      { id: '2', periodNumber: 2, length: 20, substitutions: [] }
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

  test('create game with opponent and selected players', async () => {
    const mockAddGame = jest.spyOn(dbService, 'addGame');

    render(
      <HashRouter>
        <GameForm />
      </HashRouter>
    );

    // Wait for the team to be loaded
    await waitFor(() => {
      expect(dbService.getTeams).toHaveBeenCalledTimes(1);
    });

    // Fill out the form
    await userEvent.type(screen.getByLabelText('Opponent'), 'Opponent Team');
    await userEvent.selectOptions(screen.getByTestId('team-select'), '1');
    await userEvent.click(screen.getByLabelText('23 - Player 1'));
    await userEvent.click(screen.getByLabelText('24 - Player 2'));
    await userEvent.click(screen.getByText('Create Game'));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalledWith(
        expect.objectContaining({
          opponent: 'Opponent Team',
          players: [
            expect.objectContaining({ id: '1', name: 'Player 1', number: '23' }),
            expect.objectContaining({ id: '2', name: 'Player 2', number: '24' })
          ]
        })
      );
    });
  });

  test('create game with 2 20 minute periods', async () => {
    const mockAddGame = jest.spyOn(dbService, 'addGame');
    
    render(
      <HashRouter>
        <GameForm />
      </HashRouter>
    );

    // Wait for the team to be loaded
    await waitFor(() => {
      expect(dbService.getTeams).toHaveBeenCalledTimes(1);
    });

    // Create 2-period game
    await userEvent.selectOptions(screen.getByTestId('game-format-select'), '2-20');
    await userEvent.selectOptions(screen.getByTestId('team-select'), '1');
    await userEvent.type(screen.getByLabelText('Opponent'), 'Opponent Team');
    await userEvent.click(screen.getByLabelText('23 - Player 1'));
    await userEvent.click(screen.getByLabelText('24 - Player 2'));
    await userEvent.click(screen.getByText('Create Game'));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({ length: 20 })
          ]),
          opponent: 'Opponent Team',
          players: [
            expect.objectContaining({ id: '1', name: 'Player 1', number: '23' }),
            expect.objectContaining({ id: '2', name: 'Player 2', number: '24' })
          ]
        })
      );
    });
  });

  test('create game with 4 10 minute periods', async () => {
    const mockAddGame = jest.spyOn(dbService, 'addGame');

    render(
      <HashRouter>
        <GameForm />
      </HashRouter>
    );

    // Wait for the team to be loaded
    await waitFor(() => {
      expect(dbService.getTeams).toHaveBeenCalledTimes(1);
    });

    // Create 4-period game
    await userEvent.selectOptions(screen.getByTestId('game-format-select'), '4-10');
    await userEvent.selectOptions(screen.getByTestId('team-select'), '1');
    await userEvent.type(screen.getByLabelText('Opponent'), 'Opponent Team');
    await userEvent.click(screen.getByLabelText('23 - Player 1'));
    await userEvent.click(screen.getByLabelText('24 - Player 2'));
    await userEvent.click(screen.getByText('Create Game'));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({ length: 10 })
          ]),
          opponent: 'Opponent Team',
          players: [
            expect.objectContaining({ id: '1', name: 'Player 1', number: '23' }),
            expect.objectContaining({ id: '2', name: 'Player 2', number: '24' })
          ]
        })
      );
    });
  });

  test('create game with multiple fill in players', async () => {
    const mockAddGame = jest.spyOn(dbService, 'addGame');

    render(
      <HashRouter>
        <GameForm />
      </HashRouter>
    );

    // Wait for the team to be loaded
    await waitFor(() => {
      expect(dbService.getTeams).toHaveBeenCalledTimes(1);
    });

    // Fill out the form
    await userEvent.type(screen.getByLabelText('Opponent'), 'Opponent Team');
    await userEvent.selectOptions(screen.getByTestId('team-select'), '1');
    await userEvent.click(screen.getByText('Add Fill in Player'));
    await userEvent.type(screen.getByLabelText('Fill in Player Name'), 'Fill In Player 1');
    await userEvent.type(screen.getByLabelText('Fill in Player Number'), '99');
    await userEvent.click(screen.getByText('Add Player'));
    // Wait for page to reload
    await waitFor(() => {
      expect(screen.getByText('Add Fill in Player')).toBeVisible();
    });
    await userEvent.click(screen.getByText('Add Fill in Player'));
    await userEvent.type(screen.getByLabelText('Fill in Player Name'), 'Fill In Player 2');
    await userEvent.type(screen.getByLabelText('Fill in Player Number'), '98');
    await userEvent.click(screen.getByText('Add Player'));
    await userEvent.click(screen.getByText('Create Game'));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalledWith(
        expect.objectContaining({
          opponent: 'Opponent Team',
          players: expect.arrayContaining([
            expect.objectContaining({ name: 'Fill In Player 1', number: '99' }),
            expect.objectContaining({ name: 'Fill In Player 2', number: '98' })
          ])
        })
      );
    });
  });

  test('edit and remove fill in player', async () => {
    const mockAddGame = jest.spyOn(dbService, 'addGame');

    render(
      <HashRouter>
        <GameForm />
      </HashRouter>
    );

    // Wait for the team to be loaded
    await waitFor(() => {
      expect(dbService.getTeams).toHaveBeenCalledTimes(1);
    });

    // Add fill in player
    await userEvent.click(screen.getByText('Add Fill in Player'));
    await userEvent.type(screen.getByLabelText('Fill in Player Name'), 'Fill In Player 1');
    await userEvent.type(screen.getByLabelText('Fill in Player Number'), '99');
    await userEvent.click(screen.getByText('Add Player'));

    // Edit fill in player
    await userEvent.click(screen.getByText('Edit'));
    await userEvent.clear(screen.getByLabelText('Fill in Player Name'));
    await userEvent.type(screen.getByLabelText('Fill in Player Name'), 'Edited Fill In Player 1');
    await userEvent.clear(screen.getByLabelText('Fill in Player Number'));
    await userEvent.type(screen.getByLabelText('Fill in Player Number'), '100');
    await userEvent.click(screen.getByText('Save Changes'));

    // Remove fill in player
    await userEvent.click(screen.getByText('Remove'));

    // Fill out the form
    await userEvent.type(screen.getByLabelText('Opponent'), 'Opponent Team');
    await userEvent.selectOptions(screen.getByTestId('team-select'), '1');
    await userEvent.click(screen.getByText('Create Game'));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalledWith(
        expect.objectContaining({
          opponent: 'Opponent Team',
          players: expect.not.arrayContaining([
            expect.objectContaining({ name: 'Edited Fill In Player 1', number: '100' })
          ])
        })
      );
    });
  });
});