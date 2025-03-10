import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TeamList } from '../components/TeamList';
import { TeamView } from '../components/TeamView';
import { TeamForm } from '../components/TeamForm';
import { dbService } from '../services/db';
import userEvent from '@testing-library/user-event';
import { wait } from '@testing-library/user-event/dist/utils';

jest.mock('../services/db');

describe('Team Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a new team', async () => {
    const mockAddTeam = jest.spyOn(dbService, 'addTeam');
    
    render(
      <MemoryRouter>
        <TeamForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Team Name'), {
      target: { value: 'Test Team' }
    });

    fireEvent.click(screen.getByText('Create Team'));

    await waitFor(() => {
      expect(mockAddTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Team',
          players: []
        })
      );
    });
  });

  test('deletes a team', async () => {
    const mockDeleteTeam = jest.spyOn(dbService, 'deleteTeam');
    const mockTeam = { id: '1', name: 'Test Team', players: [] };
    
    jest.spyOn(dbService, 'getTeams').mockResolvedValue([mockTeam]);

    render(
      <MemoryRouter>
        <TeamList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Delete Team'));

    await waitFor(() => {
      expect(mockDeleteTeam).toHaveBeenCalledWith('1');
    });
  });

  test('manages players on a team', async () => {
    const mockTeam = { 
      id: '1', 
      name: 'Test Team', 
      players: []
    };
    
    jest.spyOn(dbService, 'getTeam').mockResolvedValue(mockTeam);
    const mockUpdateTeam = jest.spyOn(dbService, 'updateTeam');

    render(
      <MemoryRouter initialEntries={['/teams/1']}>
        <Routes>
          <Route path="/teams/:id" element={<TeamView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeInTheDocument();
    });

    // Add player
    fireEvent.click(screen.getByText('Add Player'));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Player' }
    });
    fireEvent.change(screen.getByLabelText('Number'), {
      target: { value: '24' }
    });
    fireEvent.click(screen.getByTestId('add-player-button'));

    await waitFor(() => {
      expect(mockUpdateTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          players: expect.arrayContaining([
            expect.objectContaining({ name: 'New Player', number: '24' })
          ])
        })
      );
    });

    // Edit player
    let playerRow = screen.getByTestId('player-24')
    fireEvent.click(within(playerRow).getByText('Edit'));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Updated Player' }
    });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          players: expect.arrayContaining([
            expect.objectContaining({ name: 'Updated Player' })
          ])
        })
      );
    });

    // Delete player
    userEvent.click(within(playerRow).getByText('Remove'));

    await waitFor(() => {
      expect(mockUpdateTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          players: []
        })
      );
    });
  });
}); 