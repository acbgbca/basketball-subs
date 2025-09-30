import { create } from 'zustand';
import { Team, Player } from '@/types';
import { dbService } from '@/services/db';

interface TeamState {
  teams: Team[];
  selectedTeam: Team | null;
  loading: boolean;
  error: string | null;
}

interface TeamActions {
  // Team lifecycle
  loadTeams: () => Promise<void>;
  loadTeam: (id: string) => Promise<void>;
  createTeam: (team: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  
  // Team selection
  selectTeam: (team: Team | null) => void;
  clearSelectedTeam: () => void;
  
  // Player management
  addPlayerToTeam: (teamId: string, player: Omit<Player, 'id'>) => Promise<void>;
  updatePlayerInTeam: (teamId: string, player: Player) => Promise<void>;
  removePlayerFromTeam: (teamId: string, playerId: string) => Promise<void>;
  
  // Utility actions
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  resetTeamState: () => void;
}

type TeamStore = TeamState & TeamActions;

const initialState: TeamState = {
  teams: [],
  selectedTeam: null,
  loading: false,
  error: null,
};

export const useTeamStore = create<TeamStore>((set, get) => ({
  ...initialState,

  // Team lifecycle
  loadTeams: async () => {
    set({ loading: true, error: null });
    try {
      const teams = await dbService.getTeams();
      set({ teams, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load teams',
        loading: false 
      });
    }
  },

  loadTeam: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const team = await dbService.getTeam(id);
      set({ selectedTeam: team, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load team',
        loading: false 
      });
    }
  },

  createTeam: async (teamData: Omit<Team, 'id'>) => {
    set({ loading: true, error: null });
    try {
      const newTeam = await dbService.addTeam(teamData);
      const { teams } = get();
      set({ 
        teams: [...teams, newTeam],
        selectedTeam: newTeam,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create team',
        loading: false 
      });
    }
  },

  updateTeam: async (team: Team) => {
    set({ loading: true, error: null });
    try {
      await dbService.updateTeam(team);
      const { teams, selectedTeam } = get();
      
      const updatedTeams = teams.map(t => t.id === team.id ? team : t);
      const updatedSelectedTeam = selectedTeam?.id === team.id ? team : selectedTeam;
      
      set({ 
        teams: updatedTeams,
        selectedTeam: updatedSelectedTeam,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update team',
        loading: false 
      });
    }
  },

  deleteTeam: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await dbService.deleteTeam(id);
      const { teams, selectedTeam } = get();
      
      const updatedTeams = teams.filter(t => t.id !== id);
      const updatedSelectedTeam = selectedTeam?.id === id ? null : selectedTeam;
      
      set({ 
        teams: updatedTeams,
        selectedTeam: updatedSelectedTeam,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete team',
        loading: false 
      });
    }
  },

  // Team selection
  selectTeam: (team: Team | null) => {
    set({ selectedTeam: team });
  },

  clearSelectedTeam: () => {
    set({ selectedTeam: null });
  },

  // Player management
  addPlayerToTeam: async (teamId: string, playerData: Omit<Player, 'id'>) => {
    const { teams, selectedTeam } = get();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      set({ error: 'Team not found' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const newPlayer = await dbService.addPlayerToTeam(teamId, playerData);
      const updatedTeam = { ...team, players: [...team.players, newPlayer] };
      
      const updatedTeams = teams.map(t => t.id === teamId ? updatedTeam : t);
      const updatedSelectedTeam = selectedTeam?.id === teamId ? updatedTeam : selectedTeam;
      
      set({ 
        teams: updatedTeams,
        selectedTeam: updatedSelectedTeam,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add player',
        loading: false 
      });
    }
  },

  updatePlayerInTeam: async (teamId: string, player: Player) => {
    const { teams, selectedTeam } = get();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      set({ error: 'Team not found' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await dbService.updatePlayerInTeam(teamId, player);
      const updatedPlayers = team.players.map(p => p.id === player.id ? player : p);
      const updatedTeam = { ...team, players: updatedPlayers };
      
      const updatedTeams = teams.map(t => t.id === teamId ? updatedTeam : t);
      const updatedSelectedTeam = selectedTeam?.id === teamId ? updatedTeam : selectedTeam;
      
      set({ 
        teams: updatedTeams,
        selectedTeam: updatedSelectedTeam,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update player',
        loading: false 
      });
    }
  },

  removePlayerFromTeam: async (teamId: string, playerId: string) => {
    const { teams, selectedTeam } = get();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      set({ error: 'Team not found' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await dbService.removePlayerFromTeam(teamId, playerId);
      const updatedPlayers = team.players.filter(p => p.id !== playerId);
      const updatedTeam = { ...team, players: updatedPlayers };
      
      const updatedTeams = teams.map(t => t.id === teamId ? updatedTeam : t);
      const updatedSelectedTeam = selectedTeam?.id === teamId ? updatedTeam : selectedTeam;
      
      set({ 
        teams: updatedTeams,
        selectedTeam: updatedSelectedTeam,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove player',
        loading: false 
      });
    }
  },

  // Utility actions
  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  resetTeamState: () => {
    set(initialState);
  },
}));