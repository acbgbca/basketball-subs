import { Player } from '../types';

/**
 * Sort players by their jersey number (numeric comparison)
 * @param players - Array of players to sort
 * @returns Sorted array of players by number
 */
export function sortPlayersByNumber<T extends Pick<Player, 'number'>>(players: T[]): T[] {
  return [...players].sort((a, b) => parseInt(a.number) - parseInt(b.number));
}

/**
 * Sort players by court status first, then by name
 * Players on court appear first, then bench players, both sorted alphabetically by name
 * @param players - Array of players to sort
 * @param activePlayers - Set of active player IDs
 * @returns Sorted array of players by status and name
 */
export function sortPlayersByStatusAndName<T extends Pick<Player, 'id' | 'name'>>(
  players: T[], 
  activePlayers: Set<string>
): T[] {
  return [...players].sort((a, b) => {
    // First sort by court status
    const aOnCourt = activePlayers.has(a.id);
    const bOnCourt = activePlayers.has(b.id);
    if (aOnCourt !== bOnCourt) {
      return bOnCourt ? 1 : -1;
    }
    // Then sort by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort players alphabetically by name
 * @param players - Array of players to sort
 * @returns Sorted array of players by name
 */
export function sortPlayersByName<T extends Pick<Player, 'name'>>(players: T[]): T[] {
  return [...players].sort((a, b) => a.name.localeCompare(b.name));
}