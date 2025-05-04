export interface Player {
  id: string;
  name: string;
  number: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

// Add new Foul interface
export interface Foul {
  id: string;
  player: Player;
  periodId: string;  // to track which period the foul occurred in
  timeRemaining: number;  // seconds remaining when foul occurred
}

export interface Substitution {
  id: string;
  player: Player;
  timeIn: number;  // seconds remaining when subbed in
  timeOut: number | null;  // seconds remaining when subbed out
  secondsPlayed: number | null;
  periodId: string;  // to track which period the substitution belongs to
}

export interface Period {
  id: string;
  periodNumber: number;
  length: 10 | 20;
  substitutions: Substitution[];
  fouls: Foul[];  // Add fouls array to Period
}

export interface Game {
  id: string;
  date: Date;
  team: Team;
  opponent: string;
  players: Player[];
  periods: Period[];
  // Add new fields for state persistence
  activePlayers: string[];
  currentPeriod: number;
  isRunning: boolean;
  periodStartTime?: number; // timestamp when period was started
  periodTimeElapsed?: number; // seconds elapsed when period was paused
}