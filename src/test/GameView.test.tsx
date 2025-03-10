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
      { id: '1', periodNumber: 1, length: 20, substitutions: [] }
    ],
    opponent: 'Opponent Team',
    players: mockTeam.players
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
    [-1, -10, -30, 1, 10, 30].forEach(adjustment => {
      let timeBefore: number = parseInt(screen.getByTestId('clock-display').getAttribute('data-seconds') || '0');
      const buttonText = `${adjustment > 0 ? '+' : ''}${adjustment}s`;
      userEvent.click(screen.getByText(buttonText));
      expect(screen.getByTestId('clock-display').getAttribute('data-seconds')).toBe((timeBefore + adjustment).toString());
    });

    // Start/Stop clock
    userEvent.click(screen.getByText('Start'));
    expect(screen.getByText('Stop')).toBeInTheDocument();
    
    userEvent.click(screen.getByText('Stop'));
    expect(screen.getByText('Start')).toBeInTheDocument();

    // Substitutions
    let player1 = screen.getByTestId('player-1');
    
    userEvent.click(within(player1).getByText('Sub In'));
    await waitFor(() => {
      expect(within(player1).getByText('Sub Out')).toBeInTheDocument();

    });
    await waitFor(() => {
      expect(mockUpdateGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({
              substitutions: expect.arrayContaining([
                expect.objectContaining({ timeIn: expect.any(Number), timeOut: null })
              ])
            })
          ])
        })
      );
    });

    userEvent.click(screen.getByText('Sub Out'));
    await waitFor(() => {
      expect(mockUpdateGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({
              substitutions: expect.arrayContaining([
                expect.objectContaining({ timeOut: expect.any(Number) })
              ])
            })
          ])
        })
      );
    });

    // End period
    userEvent.click(screen.getByText('End Period'));
    userEvent.click(screen.getByText('End Period', { selector: '.modal button' }));

    await waitFor(() => {
      expect(mockUpdateGame).toHaveBeenCalledWith(
        expect.objectContaining({
          periods: expect.arrayContaining([
            expect.objectContaining({
              substitutions: expect.arrayContaining([
                expect.objectContaining({ timeOut: expect.any(Number) })
              ])
            })
          ])
        })
      );
    });
  });
}); 