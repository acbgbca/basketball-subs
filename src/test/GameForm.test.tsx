import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { GameForm } from '../components/GameForm';
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
    opponent: 'Opponent Team',
    date: new Date(),
    periods: [
      { id: '1', periodNumber: 1, length: 20, substitutions: [] }
    ],
    players: mockTeam.players
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(dbService, 'getTeams').mockResolvedValue([mockTeam]);
    jest.spyOn(dbService, 'getGame').mockResolvedValue(mockGame as Game);
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
    await userEvent.click(screen.getByText('Create Game'));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({ length: 20 })
          ])
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
    await userEvent.click(screen.getByText('Create Game'));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({ length: 10 })
          ])
        })
      );
    });
  });

  // test('manages game clock and substitutions', async () => {
  //   const mockUpdateGame = jest.spyOn(dbService, 'updateGame');

  //   render(
  //     <HashRouter>
  //       <GameView />
  //     </HashRouter>
  //   );

  //   // Start/Stop clock
  //   fireEvent.click(screen.getByText('Start'));
  //   expect(screen.getByText('Stop')).toBeInTheDocument();
    
  //   fireEvent.click(screen.getByText('Stop'));
  //   expect(screen.getByText('Start')).toBeInTheDocument();

  //   // Time adjustments
  //   [-1, -10, -30, 1, 10, 30].forEach(adjustment => {
  //     const buttonText = `${adjustment > 0 ? '+' : ''}${adjustment}s`;
  //     fireEvent.click(screen.getByText(buttonText));
  //   });

  //   // Substitutions
  //   fireEvent.click(screen.getByText('Sub In'));
  //   await waitFor(() => {
  //     expect(mockUpdateGame).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         periods: expect.arrayContaining([
  //           expect.objectContaining({
  //             substitutions: expect.arrayContaining([
  //               expect.objectContaining({ timeOut: null })
  //             ])
  //           })
  //         ])
  //       })
  //     );
  //   });

  //   fireEvent.click(screen.getByText('Sub Out'));
  //   await waitFor(() => {
  //     expect(mockUpdateGame).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         periods: expect.arrayContaining([
  //           expect.objectContaining({
  //             substitutions: expect.arrayContaining([
  //               expect.objectContaining({ timeOut: expect.any(Number) })
  //             ])
  //           })
  //         ])
  //       })
  //     );
  //   });

  //   // End period
  //   fireEvent.click(screen.getByText('End Period'));
  //   fireEvent.click(screen.getByText('End Period', { selector: '.modal button' }));

  //   await waitFor(() => {
  //     expect(mockUpdateGame).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         periods: expect.arrayContaining([
  //           expect.objectContaining({
  //             substitutions: expect.arrayContaining([
  //               expect.objectContaining({ timeOut: 0 })
  //             ])
  //           })
  //         ])
  //       })
  //     );
  //   });
  // });
}); 