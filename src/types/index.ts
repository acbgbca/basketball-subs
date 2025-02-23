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
  timeOn: number;
  timeOff: number | null;
  minutesPlayed: number | null;
}

export interface Period {
  id: string;
  length: 10 | 20;
  substitutions: Substitution[];
}

export interface Game {
  id: string;
  date: Date;
  team: Team;
  periods: Period[];
} 