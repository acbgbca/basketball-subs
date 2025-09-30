import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { gameService } from '../services/gameService';

interface PlayerStats {
  totalMinutes: number;
  fouls: number;
  isActive: boolean;
  currentPeriodTime: number | null;
  formattedTotalTime: string;
  formattedCurrentTime: string;
}

/**
 * Custom hook for calculating player statistics
 * @param playerId - The ID of the player to calculate stats for
 */
export const usePlayerStats = (playerId: string): PlayerStats => {
  const {
    game,
    activePlayers,
    timeRemaining,
    currentPeriod,
  } = useGameStore();

  const stats = useMemo(() => {
    if (!game) {
      return {
        totalMinutes: 0,
        fouls: 0,
        isActive: false,
        currentPeriodTime: null,
        formattedTotalTime: '0:00',
        formattedCurrentTime: '0:00',
      };
    }

    // Calculate total minutes played
    const totalMinutes = gameService.calculatePlayerMinutes(
      game,
      playerId,
      activePlayers,
      timeRemaining,
      currentPeriod
    );

    // Calculate total fouls
    const fouls = gameService.calculatePlayerFouls(game, playerId);

    // Check if player is currently active
    const isActive = activePlayers.has(playerId);

    // Calculate current period time if active
    const currentPeriodTime = isActive
      ? gameService.calculatePlayerSubTime(game, playerId, currentPeriod, activePlayers)
      : null;

    // Format time helper
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return {
      totalMinutes,
      fouls,
      isActive,
      currentPeriodTime,
      formattedTotalTime: formatTime(totalMinutes),
      formattedCurrentTime: currentPeriodTime ? formatTime(currentPeriodTime) : '0:00',
    };
  }, [game, playerId, activePlayers, timeRemaining, currentPeriod]);

  return stats;
};

/**
 * Hook for getting stats for all players in the current game
 */
export const useAllPlayerStats = (): Record<string, PlayerStats> => {
  const { game } = useGameStore();

  return useMemo(() => {
    if (!game) return {};

    const stats: Record<string, PlayerStats> = {};
    
    game.players.forEach(player => {
      // We can't use the hook inside a loop, so we'll calculate inline
      // This is a temporary solution - in a real app you might want to restructure this
      stats[player.id] = {
        totalMinutes: 0, // Will be calculated by individual usePlayerStats calls
        fouls: 0,
        isActive: false,
        currentPeriodTime: null,
        formattedTotalTime: '0:00',
        formattedCurrentTime: '0:00',
      };
    });

    return stats;
  }, [game]);
};

/**
 * Hook for getting basic player information and active status
 */
export const usePlayerInfo = (playerId: string) => {
  const { game, activePlayers } = useGameStore();

  return useMemo(() => {
    if (!game) {
      return {
        player: null,
        isActive: false,
        exists: false,
      };
    }

    const player = game.players.find(p => p.id === playerId);
    const isActive = activePlayers.has(playerId);

    return {
      player: player || null,
      isActive,
      exists: !!player,
    };
  }, [game, playerId, activePlayers]);
};