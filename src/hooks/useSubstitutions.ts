import { useCallback, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useUIStore, useNotifications } from '../stores/uiStore';
import { Player, SubstitutionEvent } from '../types';

interface SubstitutionHook {
  // Substitution data
  substitutions: SubstitutionEvent[];
  canMakeSubstitution: boolean;
  activePlayerCount: number;
  maxPlayers: number;
  
  // Substitution actions
  addSubstitution: (subbedIn: Player[], playersOut: Player[]) => Promise<void>;
  editSubstitution: (eventId: string, eventTime: number, subbedIn: Player[], playersOut: Player[]) => Promise<void>;
  deleteSubstitution: (eventId: string) => Promise<void>;
  
  // Validation
  validateSubstitution: (subbedIn: Player[], playersOut: Player[]) => {
    isValid: boolean;
    errors: string[];
  };
}

/**
 * Custom hook for managing substitutions in the current game
 */
export const useSubstitutions = (): SubstitutionHook => {
  const {
    game,
    activePlayers,
    currentPeriod,
    timeRemaining,
    addSubstitution: addSubToStore,
    editSubstitution: editSubInStore,
    deleteSubstitution: deleteSubFromStore,
    loading,
  } = useGameStore();

  const { addNotification } = useNotifications();

  const maxPlayers = 5; // Basketball rule: max 5 players on court

  // Get current period substitutions
  const substitutions = useMemo(() => {
    if (!game || !game.periods[currentPeriod]) return [];
    return game.periods[currentPeriod].subEvents || [];
  }, [game, currentPeriod]);

  const activePlayerCount = activePlayers.size;
  const canMakeSubstitution = !loading && !!game && timeRemaining > 0;

  // Validation function
  const validateSubstitution = useCallback((subbedIn: Player[], playersOut: Player[]): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Basic validation
    if (subbedIn.length === 0 && playersOut.length === 0) {
      errors.push('Must select at least one player to substitute');
    }

    // Check for duplicate players
    const subbedInIds = new Set(subbedIn.map(p => p.id));
    const playersOutIds = new Set(playersOut.map(p => p.id));
    
    for (const playerId of subbedInIds) {
      if (playersOutIds.has(playerId)) {
        errors.push('A player cannot be substituted in and out in the same event');
      }
    }

    // Check if players being subbed out are actually active
    for (const player of playersOut) {
      if (!activePlayers.has(player.id)) {
        errors.push(`${player.name} is not currently active and cannot be substituted out`);
      }
    }

    // Check if players being subbed in are not already active
    for (const player of subbedIn) {
      if (activePlayers.has(player.id)) {
        errors.push(`${player.name} is already active and cannot be substituted in`);
      }
    }

    // Check player count limits
    const newActiveCount = activePlayerCount - playersOut.length + subbedIn.length;
    if (newActiveCount > maxPlayers) {
      errors.push(`Cannot have more than ${maxPlayers} players on court. This substitution would result in ${newActiveCount} active players.`);
    }

    if (newActiveCount < 0) {
      errors.push('Cannot substitute out more players than are currently active');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [activePlayers, activePlayerCount, maxPlayers]);

  // Add substitution
  const addSubstitution = useCallback(async (subbedIn: Player[], playersOut: Player[]) => {
    if (!canMakeSubstitution) return;

    const validation = validateSubstitution(subbedIn, playersOut);
    if (!validation.isValid) {
      validation.errors.forEach(error => addNotification({ type: 'error', message: error }));
      return;
    }

    try {
      const substitutionEvent: SubstitutionEvent = {
        id: `temp-${Date.now()}`, // Will be replaced by service
        eventTime: timeRemaining,
        periodId: game!.periods[currentPeriod].id,
        subbedIn,
        playersOut,
      };

      await addSubToStore(substitutionEvent);
      addNotification({ 
        type: 'success', 
        message: 'Substitution recorded successfully' 
      });
    } catch (error) {
      addNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to record substitution' 
      });
    }
  }, [canMakeSubstitution, validateSubstitution, timeRemaining, game, currentPeriod, addSubToStore, addNotification]);

  // Edit substitution
  const editSubstitution = useCallback(async (
    eventId: string, 
    eventTime: number, 
    subbedIn: Player[], 
    playersOut: Player[]
  ) => {
    if (!game) return;

    const validation = validateSubstitution(subbedIn, playersOut);
    if (!validation.isValid) {
      validation.errors.forEach(error => addNotification({ type: 'error', message: error }));
      return;
    }

    try {
      await editSubInStore(eventId, eventTime, subbedIn, playersOut);
      addNotification({ 
        type: 'success', 
        message: 'Substitution updated successfully' 
      });
    } catch (error) {
      addNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update substitution' 
      });
    }
  }, [game, validateSubstitution, editSubInStore, addNotification]);

  // Delete substitution
  const deleteSubstitution = useCallback(async (eventId: string) => {
    if (!game) return;

    try {
      await deleteSubFromStore(eventId);
      addNotification({ 
        type: 'success', 
        message: 'Substitution deleted successfully' 
      });
    } catch (error) {
      addNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to delete substitution' 
      });
    }
  }, [game, deleteSubFromStore, addNotification]);

  return {
    substitutions,
    canMakeSubstitution,
    activePlayerCount,
    maxPlayers,
    addSubstitution,
    editSubstitution,
    deleteSubstitution,
    validateSubstitution,
  };
};

/**
 * Hook for getting substitution history across all periods
 */
export const useSubstitutionHistory = () => {
  const { game } = useGameStore();

  return useMemo(() => {
    if (!game) return [];

    const allSubstitutions: (SubstitutionEvent & { periodNumber: number })[] = [];
    
    game.periods.forEach((period, index) => {
      period.subEvents.forEach(event => {
        allSubstitutions.push({
          ...event,
          periodNumber: period.periodNumber,
        });
      });
    });

    // Sort by period and then by event time (descending)
    return allSubstitutions.sort((a, b) => {
      if (a.periodNumber !== b.periodNumber) {
        return a.periodNumber - b.periodNumber;
      }
      return b.eventTime - a.eventTime; // Most recent events first within period
    });
  }, [game]);
};