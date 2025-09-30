// State management stores
export { useGameStore } from './gameStore';
export { useTeamStore } from './teamStore';
export { useUIStore, useNotifications } from './uiStore';

// Re-export store types for convenience
export type { Game, Team, Player, Foul, Substitution, SubstitutionEvent, Period } from '@/types';