import { useEffect, useCallback, useMemo, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Game } from '../types';
import { dbService } from '../services/db';

interface GamesHook {
  games: Game[];
  currentGame: Game | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadGames: () => Promise<void>;
  loadGame: (id: string) => Promise<void>;
  createGame: (game: Omit<Game, 'id'>) => Promise<Game>;
  updateGame: (game: Game) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing games data and operations
 * @param autoLoad - Whether to automatically load games on mount (default: true)
 */
export const useGames = (autoLoad: boolean = true): GamesHook => {
  const {
    game: currentGame,
    loadGame,
    updateGame,
    loading,
    error,
  } = useGameStore();

  // Local state for games list (since game store only handles current game)
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);

  // Load all games
  const loadGames = useCallback(async () => {
    setGamesLoading(true);
    setGamesError(null);
    try {
      const allGames = await dbService.getGames();
      setGames(allGames);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load games';
      setGamesError(errorMessage);
    } finally {
      setGamesLoading(false);
    }
  }, []);

  // Create new game
  const createGame = useCallback(async (gameData: Omit<Game, 'id'>): Promise<Game> => {
    setGamesLoading(true);
    setGamesError(null);
    try {
      const newGame = await dbService.addGame(gameData);
      setGames(prev => [...prev, newGame]);
      return newGame;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
      setGamesError(errorMessage);
      throw error;
    } finally {
      setGamesLoading(false);
    }
  }, []);

  // Delete game
  const deleteGame = useCallback(async (id: string) => {
    setGamesLoading(true);
    setGamesError(null);
    try {
      await dbService.deleteGame(id);
      setGames(prev => prev.filter(game => game.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete game';
      setGamesError(errorMessage);
      throw error;
    } finally {
      setGamesLoading(false);
    }
  }, []);

  // Update game (both local list and store)
  const handleUpdateGame = useCallback(async (game: Game) => {
    try {
      await updateGame(game);
      setGames(prev => prev.map(g => g.id === game.id ? game : g));
    } catch (error) {
      throw error;
    }
  }, [updateGame]);

  // Load games on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && games.length === 0 && !gamesLoading) {
      loadGames();
    }
  }, [autoLoad, games.length, gamesLoading, loadGames]);

  // Refetch alias for loadGames
  const refetch = useCallback(() => loadGames(), [loadGames]);

  return {
    games,
    currentGame,
    loading: loading || gamesLoading,
    error: error || gamesError,
    loadGames,
    loadGame,
    createGame,
    updateGame: handleUpdateGame,
    deleteGame,
    refetch,
  };
};

/**
 * Hook for managing a single game
 * @param gameId - The ID of the game to manage
 */
export const useGame = (gameId: string | null) => {
  const {
    game,
    loading,
    error,
    loadGame,
    updateGame,
    resetGameState,
  } = useGameStore();

  // Load game if gameId is provided and different from current
  useEffect(() => {
    if (gameId && (!game || game.id !== gameId)) {
      loadGame(gameId);
    } else if (!gameId) {
      resetGameState();
    }
  }, [gameId, game, loadGame, resetGameState]);

  return {
    game: gameId && game?.id === gameId ? game : null,
    loading,
    error,
    updateGame,
    refetch: gameId ? () => loadGame(gameId) : undefined,
  };
};

/**
 * Hook for game search and filtering
 */
export const useGameSearch = () => {
  const { games } = useGames();

  const searchGames = useCallback((query: string): Game[] => {
    if (!query.trim()) return games;

    const lowerQuery = query.toLowerCase();
    return games.filter(game => 
      game.team.name.toLowerCase().includes(lowerQuery) ||
      game.opponent.toLowerCase().includes(lowerQuery) ||
      game.players.some(player => 
        player.name.toLowerCase().includes(lowerQuery)
      )
    );
  }, [games]);

  const filterGamesByTeam = useCallback((teamId: string): Game[] => {
    return games.filter(game => game.team.id === teamId);
  }, [games]);

  const filterGamesByDate = useCallback((startDate: Date, endDate?: Date): Game[] => {
    return games.filter(game => {
      const gameDate = new Date(game.date);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      if (!endDate) {
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        return gameDate >= start && gameDate <= end;
      }
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return gameDate >= start && gameDate <= end;
    });
  }, [games]);

  const getGameStats = useMemo(() => {
    return {
      totalGames: games.length,
      recentGames: games
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
      teamCounts: games.reduce((acc, game) => {
        const teamName = game.team.name;
        acc[teamName] = (acc[teamName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [games]);

  return {
    searchGames,
    filterGamesByTeam,
    filterGamesByDate,
    gameStats: getGameStats,
  };
};

/**
 * Hook for game validation
 */
export const useGameValidation = () => {
  const validateGame = useCallback((game: Partial<Game>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!game.team) {
      errors.push('Team is required');
    }

    if (!game.opponent || game.opponent.trim().length === 0) {
      errors.push('Opponent is required');
    }

    if (!game.date) {
      errors.push('Date is required');
    }

    if (!game.players || game.players.length === 0) {
      errors.push('At least one player is required');
    }

    if (!game.periods || game.periods.length === 0) {
      errors.push('At least one period is required');
    }

    // Validate player numbers are unique
    if (game.players) {
      const numbers = game.players.map(p => p.number);
      const uniqueNumbers = new Set(numbers);
      if (numbers.length !== uniqueNumbers.size) {
        errors.push('Player numbers must be unique');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  return {
    validateGame,
  };
};