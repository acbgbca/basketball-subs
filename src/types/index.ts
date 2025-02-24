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
}

export interface Game {
  id: string;
  date: Date;
  team: Team;
  periods: Period[];
} 