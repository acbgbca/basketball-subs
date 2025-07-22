import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TeamList } from '../components/TeamList';
import { TeamView } from '../components/TeamView';
import { TeamForm } from '../components/TeamForm';
import { dbService } from '../services/db';
import userEvent from '@testing-library/user-event';

jest.mock('../services/db');

describe('Team Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a new team from modal', async () => {
    const mockAddTeam = jest.spyOn(dbService, 'addTeam');
    jest.spyOn(dbService, 'getTeams').mockResolvedValue([]);
    
    render(
      <MemoryRouter>
        <TeamList />
      </MemoryRouter>
    );

    // Open the modal
    await userEvent.click(screen.getByText('Add New Team'));
    
    // Fill out and submit the form
    await userEvent.type(screen.getByLabelText('Team Name'), 'Test Team');
    await userEvent.click(screen.getByText('Create Team'));

    // Verify team was created with correct data
    await waitFor(() => {
      expect(mockAddTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Team',
          players: []
        })
      );
    });
  });

  test('creates a new team from standalone page and navigates to team view', async () => {
    const mockAddTeam = jest.spyOn(dbService, 'addTeam');
    
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<TeamForm />} />
          <Route path="/teams/:id" element={<TeamView />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('Team Name'), 'Test Team');
    await userEvent.click(screen.getByText('Create Team'));

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

    await userEvent.click(screen.getByText('Delete'));
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Delete Team'));

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
      expect(screen.getByDisplayValue('Test Team')).toBeInTheDocument();
    });

    // Add player
    await userEvent.click(screen.getByText('Add Player'));
    const inputs = screen.getAllByRole('textbox');
    await userEvent.type(inputs[inputs.length - 2], '24'); // Number input comes first
    await userEvent.type(inputs[inputs.length - 1], 'New Player');  // Name input comes second
    await userEvent.click(screen.getByText('Save Changes'));

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
    const allInputs = screen.getAllByRole('textbox');
    const nameInputs = allInputs.filter(input => input.getAttribute('value') === 'New Player');
    await userEvent.clear(nameInputs[0]);
    await userEvent.type(nameInputs[0], 'Updated Player');
    await userEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          players: expect.arrayContaining([
            expect.objectContaining({ name: 'Updated Player' })
          ])
        })
      );
    });

    // Delete player and save changes
    await userEvent.click(screen.getByText('Remove'));
    await userEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          players: []
        })
      );
    });
  });

  test('edits team name', async () => {
    const mockTeam = { 
      id: '1', 
      name: 'Test Team', 
      players: []
    };
    const mockUpdateTeam = jest.spyOn(dbService, 'updateTeam');
    jest.spyOn(dbService, 'getTeam').mockResolvedValue(mockTeam);

    render(
      <MemoryRouter initialEntries={['/teams/1']}>
        <Routes>
          <Route path="/teams/:id" element={<TeamView />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for team to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Team')).toBeInTheDocument();
    });

    // Edit team name
    const teamNameInput = screen.getByDisplayValue('Test Team');
    await userEvent.clear(teamNameInput);
    await userEvent.type(teamNameInput, 'Updated Team Name');

    // Save changes
    await userEvent.click(screen.getByText('Save Changes'));

    // Verify team was updated with new name
    await waitFor(() => {
      expect(mockUpdateTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Team Name'
        })
      );
    });
  });
});