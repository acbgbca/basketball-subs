import { useEffect, useCallback } from 'react';
import { useTeamStore } from '@/stores/teamStore';
import { Team, Player } from '@/types';

interface TeamsHook {
  teams: Team[];
  selectedTeam: Team | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadTeams: () => Promise<void>;
  createTeam: (team: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  selectTeam: (team: Team | null) => void;
  refetch: () => Promise<void>;
  
  // Player management
  addPlayer: (teamId: string, player: Omit<Player, 'id'>) => Promise<void>;
  updatePlayer: (teamId: string, player: Player) => Promise<void>;
  removePlayer: (teamId: string, playerId: string) => Promise<void>;
}

/**
 * Custom hook for managing teams data and operations
 * @param autoLoad - Whether to automatically load teams on mount (default: true)
 */
export const useTeams = (autoLoad: boolean = true): TeamsHook => {
  const {
    teams,
    selectedTeam,
    loading,
    error,
    loadTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    selectTeam,
    addPlayerToTeam,
    updatePlayerInTeam,
    removePlayerFromTeam,
  } = useTeamStore();

  // Load teams on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && teams.length === 0 && !loading) {
      loadTeams();
    }
  }, [autoLoad, teams.length, loading, loadTeams]);

  // Wrapper functions with error handling
  const handleCreateTeam = useCallback(async (team: Omit<Team, 'id'>) => {
    try {
      await createTeam(team);
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }, [createTeam]);

  const handleUpdateTeam = useCallback(async (team: Team) => {
    try {
      await updateTeam(team);
    } catch (error) {
      console.error('Failed to update team:', error);
      throw error;
    }
  }, [updateTeam]);

  const handleDeleteTeam = useCallback(async (id: string) => {
    try {
      await deleteTeam(id);
    } catch (error) {
      console.error('Failed to delete team:', error);
      throw error;
    }
  }, [deleteTeam]);

  const handleAddPlayer = useCallback(async (teamId: string, player: Omit<Player, 'id'>) => {
    try {
      await addPlayerToTeam(teamId, player);
    } catch (error) {
      console.error('Failed to add player:', error);
      throw error;
    }
  }, [addPlayerToTeam]);

  const handleUpdatePlayer = useCallback(async (teamId: string, player: Player) => {
    try {
      await updatePlayerInTeam(teamId, player);
    } catch (error) {
      console.error('Failed to update player:', error);
      throw error;
    }
  }, [updatePlayerInTeam]);

  const handleRemovePlayer = useCallback(async (teamId: string, playerId: string) => {
    try {
      await removePlayerFromTeam(teamId, playerId);
    } catch (error) {
      console.error('Failed to remove player:', error);
      throw error;
    }
  }, [removePlayerFromTeam]);

  // Refetch alias for loadTeams
  const refetch = useCallback(() => loadTeams(), [loadTeams]);

  return {
    teams,
    selectedTeam,
    loading,
    error,
    loadTeams,
    createTeam: handleCreateTeam,
    updateTeam: handleUpdateTeam,
    deleteTeam: handleDeleteTeam,
    selectTeam,
    refetch,
    addPlayer: handleAddPlayer,
    updatePlayer: handleUpdatePlayer,
    removePlayer: handleRemovePlayer,
  };
};

/**
 * Hook for managing a single team
 * @param teamId - The ID of the team to manage
 */
export const useTeam = (teamId: string | null) => {
  const {
    teams,
    selectedTeam,
    loading,
    error,
    loadTeam,
    selectTeam,
    updateTeam,
    deleteTeam,
  } = useTeamStore();

  // Load specific team if teamId is provided and not already selected
  useEffect(() => {
    if (teamId && (!selectedTeam || selectedTeam.id !== teamId)) {
      // Check if team is already in teams array
      const existingTeam = teams.find(t => t.id === teamId);
      if (existingTeam) {
        selectTeam(existingTeam);
      } else {
        loadTeam(teamId);
      }
    }
  }, [teamId, selectedTeam, teams, loadTeam, selectTeam]);

  const team = teamId ? (selectedTeam?.id === teamId ? selectedTeam : teams.find(t => t.id === teamId)) : null;

  return {
    team,
    loading,
    error,
    updateTeam,
    deleteTeam,
    refetch: teamId ? () => loadTeam(teamId) : undefined,
  };
};

/**
 * Hook for team search and filtering
 */
export const useTeamSearch = () => {
  const { teams } = useTeamStore();

  const searchTeams = useCallback((query: string): Team[] => {
    if (!query.trim()) return teams;

    const lowerQuery = query.toLowerCase();
    return teams.filter(team => 
      team.name.toLowerCase().includes(lowerQuery) ||
      team.players.some(player => 
        player.name.toLowerCase().includes(lowerQuery) ||
        player.number.includes(query)
      )
    );
  }, [teams]);

  const filterTeamsByPlayerCount = useCallback((minPlayers: number, maxPlayers?: number): Team[] => {
    return teams.filter(team => {
      const playerCount = team.players.length;
      return playerCount >= minPlayers && (maxPlayers === undefined || playerCount <= maxPlayers);
    });
  }, [teams]);

  return {
    searchTeams,
    filterTeamsByPlayerCount,
    totalTeams: teams.length,
    totalPlayers: teams.reduce((sum, team) => sum + team.players.length, 0),
  };
};