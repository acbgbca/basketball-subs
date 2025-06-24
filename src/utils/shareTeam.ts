interface SharedTeam {
  name: string;
  players: Array<{
    number: string;
    name: string;
  }>;
}

/**
 * Convert team data to a URL-safe string
 */
export function teamToShareString(team: SharedTeam): string {
  const json = JSON.stringify(team);
  return btoa(encodeURIComponent(json));
}

/**
 * Parse team data from a URL-safe string
 */
export function parseSharedTeam(shareString: string): SharedTeam | null {
  try {
    const json = decodeURIComponent(atob(shareString));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Create a shareable URL for a team
 */
export function createShareUrl(team: SharedTeam): string {
  const shareString = teamToShareString(team);
  return `${window.location.origin}${window.location.pathname}#/teams/new?share=${shareString}`;
}
