import { create } from 'zustand';
import { Game, Player, SubstitutionEvent, Foul } from '@/types';
import { gameService } from '@/services/gameService';

interface GameState {
  // Core game data
  game: Game | null;
  activePlayers: Set<string>;
  currentPeriod: number;
  timeRemaining: number;
  isRunning: boolean;
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Timer state
  periodStartTime: number | null;
  periodTimeElapsed: number;
}

interface GameActions {
  // Game lifecycle
  loadGame: (id: string) => Promise<void>;
  updateGame: (game: Game) => Promise<void>;
  resetGameState: () => void;
  
  // Player management
  setActivePlayers: (players: Set<string>) => void;
  updateActivePlayers: (players: string[]) => void;
  
  // Timer management
  startTimer: () => void;
  pauseTimer: () => void;
  updateTimeRemaining: (time: number) => void;
  resetTimer: (periodLength: number) => void;
  
  // Game actions
  addSubstitution: (event: SubstitutionEvent) => Promise<void>;
  editSubstitution: (eventId: string, eventTime: number, subbedIn: Player[], playersOut: Player[]) => Promise<void>;
  deleteSubstitution: (eventId: string) => Promise<void>;
  addFoul: (playerId: string) => Promise<void>;
  endPeriod: () => Promise<void>;
  
  // Utility actions
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type GameStore = GameState & GameActions;

const initialState: GameState = {
  game: null,
  activePlayers: new Set(),
  currentPeriod: 0,
  timeRemaining: 0,
  isRunning: false,
  loading: false,
  error: null,
  periodStartTime: null,
  periodTimeElapsed: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // Game lifecycle
  loadGame: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const game = await gameService.getGame(id);
      const activePlayers = new Set(game.activePlayers);
      const periodLength = game.periods[game.currentPeriod]?.length || 10;
      const timeRemaining = periodLength * 60; // Convert to seconds
      
      set({
        game,
        activePlayers,
        currentPeriod: game.currentPeriod,
        timeRemaining,
        isRunning: game.isRunning,
        periodStartTime: game.periodStartTime || null,
        periodTimeElapsed: game.periodTimeElapsed || 0,
        loading: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load game',
        loading: false 
      });
    }
  },

  updateGame: async (game: Game) => {
    set({ loading: true, error: null });
    try {
      await gameService.updateGame(game);
      set({ game, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update game',
        loading: false 
      });
    }
  },

  resetGameState: () => {
    set(initialState);
  },

  // Player management
  setActivePlayers: (players: Set<string>) => {
    set({ activePlayers: players });
    const { game } = get();
    if (game) {
      const updatedGame = { ...game, activePlayers: Array.from(players) };
      get().updateGame(updatedGame);
    }
  },

  updateActivePlayers: (players: string[]) => {
    const activePlayers = new Set(players);
    set({ activePlayers });
    const { game } = get();
    if (game) {
      const updatedGame = { ...game, activePlayers: players };
      get().updateGame(updatedGame);
    }
  },

  // Timer management
  startTimer: () => {
    const now = Date.now();
    set({ 
      isRunning: true, 
      periodStartTime: now,
    });
    const { game } = get();
    if (game) {
      const updatedGame = { 
        ...game, 
        isRunning: true, 
        periodStartTime: now 
      };
      get().updateGame(updatedGame);
    }
  },

  pauseTimer: () => {
    const { periodStartTime, timeRemaining } = get();
    const now = Date.now();
    let newTimeElapsed = 0;
    
    if (periodStartTime) {
      const elapsedMs = now - periodStartTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      newTimeElapsed = elapsedSeconds;
    }
    
    set({ 
      isRunning: false, 
      periodStartTime: null,
      periodTimeElapsed: newTimeElapsed,
      timeRemaining: Math.max(0, timeRemaining - newTimeElapsed)
    });
    
    const { game } = get();
    if (game) {
      const updatedGame = { 
        ...game, 
        isRunning: false, 
        periodStartTime: undefined,
        periodTimeElapsed: newTimeElapsed
      };
      get().updateGame(updatedGame);
    }
  },

  updateTimeRemaining: (time: number) => {
    set({ timeRemaining: time });
  },

  resetTimer: (periodLength: number) => {
    const timeInSeconds = periodLength * 60;
    set({ 
      timeRemaining: timeInSeconds,
      isRunning: false,
      periodStartTime: null,
      periodTimeElapsed: 0
    });
  },

  // Game actions
  addSubstitution: async (event: SubstitutionEvent) => {
    const { game, timeRemaining } = get();
    if (!game) return;

    set({ loading: true, error: null });
    try {
      const subInPlayers = new Set(event.subbedIn.map(p => p.id));
      const subOutPlayers = new Set(event.playersOut.map(p => p.id));
      
      const { updatedGame, newActivePlayers } = await gameService.subModalSubmit(
        game, 
        subInPlayers, 
        subOutPlayers, 
        timeRemaining
      );
      
      set({ 
        game: updatedGame, 
        activePlayers: newActivePlayers,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add substitution',
        loading: false 
      });
    }
  },

  editSubstitution: async (eventId: string, eventTime: number, subbedIn: Player[], playersOut: Player[]) => {
    const { game, currentPeriod } = get();
    if (!game) return;

    set({ loading: true, error: null });
    try {
      const updatedGame = await gameService.editSubstitution(
        game, 
        currentPeriod, 
        eventId, 
        eventTime, 
        subbedIn, 
        playersOut
      );
      
      const activePlayers = new Set(updatedGame.activePlayers);
      set({ 
        game: updatedGame, 
        activePlayers,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to edit substitution',
        loading: false 
      });
    }
  },

  deleteSubstitution: async (eventId: string) => {
    const { game, currentPeriod } = get();
    if (!game) return;

    set({ loading: true, error: null });
    try {
      const updatedGame = await gameService.deleteSubstitution(game, currentPeriod, eventId);
      const activePlayers = new Set(updatedGame.activePlayers);
      set({ 
        game: updatedGame, 
        activePlayers,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete substitution',
        loading: false 
      });
    }
  },

  addFoul: async (playerId: string) => {
    const { game, currentPeriod, timeRemaining } = get();
    if (!game) return;

    set({ loading: true, error: null });
    try {
      const updatedGame = await gameService.addFoul(game, currentPeriod, playerId, timeRemaining);
      set({ 
        game: updatedGame,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add foul',
        loading: false 
      });
    }
  },

  endPeriod: async () => {
    const { game } = get();
    if (!game) return;

    set({ loading: true, error: null });
    try {
      const updatedGame = await gameService.endPeriod(game);
      set({ 
        game: updatedGame,
        activePlayers: new Set(), // All players are subbed out at end of period
        isRunning: false,
        periodStartTime: null,
        periodTimeElapsed: 0,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to end period',
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
}));