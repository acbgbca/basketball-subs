import { useState, useEffect } from 'react';
import { Team, Game } from '../types';
import { dbService } from '../services/db';
import { gameService } from '../services/gameService';

/**
 * Custom hook for loading all teams
 * @param sortByName - Whether to sort teams alphabetically by name (default: true)
 * @returns Object with teams array, loading state, error state, and refresh function
 */
export function useTeams(sortByName = true) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const teamsData = await dbService.getTeams();
      const sortedTeams = sortByName 
        ? teamsData.sort((a, b) => a.name.localeCompare(b.name))
        : teamsData;
      setTeams(sortedTeams);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [sortByName]);

  return {
    teams,
    loading,
    error,
    refresh: loadTeams,
    setTeams
  };
}

/**
 * Custom hook for loading a specific team by ID
 * @param id - Team ID to load
 * @returns Object with team data, loading state, error state, and refresh function
 */
export function useTeam(id: string | undefined) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const teamData = await dbService.getTeam(id);
      setTeam(teamData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [id]);

  return {
    team,
    loading,
    error,
    refresh: loadTeam,
    setTeam
  };
}

/**
 * Custom hook for loading all games
 * @param sortByDate - Whether to sort games by date (newest first, default: true)
 * @returns Object with games array, loading state, error state, and refresh function
 */
export function useGames(sortByDate = true) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const gamesData = await dbService.getGames();
      const sortedGames = sortByDate 
        ? [...gamesData].sort((a, b) => {
            // First sort by date (newest first)
            const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
            // If dates are equal, sort by team name
            if (dateComparison === 0) {
              return a.team.name.localeCompare(b.team.name);
            }
            return dateComparison;
          })
        : gamesData;
      setGames(sortedGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, [sortByDate]);

  return {
    games,
    loading,
    error,
    refresh: loadGames,
    setGames
  };
}

/**
 * Custom hook for loading a specific game by ID
 * @param id - Game ID to load
 * @returns Object with game data, loading state, error state, and refresh function
 */
export function useGame(id: string | undefined) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGame = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const gameData = await gameService.getGame(id);
      setGame(gameData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGame();
  }, [id]);

  return {
    game,
    loading,
    error,
    refresh: loadGame,
    setGame
  };
}