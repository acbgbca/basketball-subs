import { Game, Substitution, Foul, Player } from '../types';
import { dbService } from './db';
import { v4 as uuidv4 } from 'uuid';

// --- Calculation helpers ---
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculatePlayerMinutes(game: Game, playerId: string, activePlayers: Set<string>, timeRemaining: number, currentPeriod: number): number {
  // Calculate completed substitution time
  const completedTime = game.periods.reduce((total, period) => {
    const playerSubs = period.substitutions.filter(sub => 
      sub.player.id === playerId && sub.secondsPlayed !== null
    );
    return total + playerSubs.reduce((subTotal, sub) => 
      subTotal + (sub.secondsPlayed || 0), 0
    );
  }, 0);

  // If player is active, add current active time
  if (activePlayers.has(playerId)) {
    const subInTime = calculatePlayerSubTime(game, playerId, currentPeriod, activePlayers);
    if (subInTime !== null) {
      // Add time from sub-in until now
      return completedTime + (subInTime - timeRemaining);
    }
  }
  return completedTime;
}

export function calculatePlayerFouls(game: Game, playerId: string): number {
  return game.periods.reduce((total, period) => {
    return total + (period.fouls?.filter(foul => foul.player.id === playerId).length || 0);
  }, 0);
}

export function calculatePlayerSubTime(game: Game, playerId: string, currentPeriod: number, activePlayers: Set<string>): number | null {
  const currentPeriodData = game.periods[currentPeriod];
  const lastSub = currentPeriodData.substitutions
    .filter(sub => sub.player.id === playerId)
    .sort((a, b) => (a.timeIn || 0) - (b.timeIn || 0))[0];
  if (!lastSub) return null;
  if (activePlayers.has(playerId)) {
    return lastSub.timeIn;
  } else if (lastSub.timeOut !== null) {
    return lastSub.timeOut;
  }
  return null;
}

export function calculatePeriodFouls(game: Game, currentPeriod: number): number {
  return game.periods[currentPeriod].fouls?.length || 0;
}

// --- Game mutation helpers ---
export async function endPeriod(game: Game, activePlayers: Set<string>, currentPeriod: number): Promise<Game> {
  // Sub out all active players with timeOut = 0
  const updatedPeriods = [...game.periods];
  const currentPeriodData = updatedPeriods[currentPeriod];
  let changed = false;
  for (const playerId of activePlayers) {
    const player = game.players.find(p => p.id === playerId);
    if (player) {
      const activeSub = currentPeriodData.substitutions.find(
        sub => sub.player.id === player.id && sub.timeOut === null
      );
      if (activeSub) {
        const updatedSub: Substitution = {
          ...activeSub,
          timeOut: 0,
          secondsPlayed: activeSub.timeIn
        };
        currentPeriodData.substitutions = currentPeriodData.substitutions.map(
          sub => sub.id === activeSub.id ? updatedSub : sub
        );
        changed = true;
      }
    }
  }
  if (changed) {
    updatedPeriods[currentPeriod] = currentPeriodData;
    const updatedGame = { ...game, periods: updatedPeriods };
    await dbService.updateGame(updatedGame);
    return updatedGame;
  }
  return game;
}

export async function deleteSubstitution(game: Game, currentPeriod: number, subToDelete: Substitution): Promise<Game> {
  const updatedPeriods = [...game.periods];
  updatedPeriods[currentPeriod].substitutions = 
    updatedPeriods[currentPeriod].substitutions.filter(sub => sub.id !== subToDelete.id);
  const updatedGame = { ...game, periods: updatedPeriods };
  await dbService.updateGame(updatedGame);
  return updatedGame;
}

export async function editSubstitution(game: Game, currentPeriod: number, selectedSub: Substitution, timeIn: number, timeOut: number): Promise<Game> {
  const updatedSub: Substitution = {
    ...selectedSub,
    timeIn,
    timeOut,
    secondsPlayed: (timeIn - timeOut)
  };
  const updatedPeriods = [...game.periods];
  updatedPeriods[currentPeriod].substitutions = 
    updatedPeriods[currentPeriod].substitutions.map(sub => 
      sub.id === selectedSub.id ? updatedSub : sub
    );
  const updatedGame = { ...game, periods: updatedPeriods };
  await dbService.updateGame(updatedGame);
  return updatedGame;
}

export async function subModalSubmit(
  game: Game,
  currentPeriod: number,
  activePlayers: Set<string>,
  subInPlayers: Set<string>,
  subOutPlayers: Set<string>,
  timeRemaining: number
): Promise<{ updatedGame: Game, newActivePlayers: Set<string> }> {
  const newActivePlayers = new Set(activePlayers);
  const currentPeriodData = game.periods[currentPeriod];
  let updatedPeriods = [...game.periods];
  // Handle Sub Out
  for (const playerId of subOutPlayers) {
    const player = game.players.find(p => p.id === playerId);
    if (player) {
      const activeSub = currentPeriodData.substitutions.find(
        sub => sub.player.id === player.id && sub.timeOut === null
      );
      if (activeSub) {
        const updatedSub: Substitution = {
          ...activeSub,
          timeOut: timeRemaining,
          secondsPlayed: (activeSub.timeIn - timeRemaining)
        };
        updatedPeriods[currentPeriod].substitutions = currentPeriodData.substitutions.map(
          sub => sub.id === activeSub.id ? updatedSub : sub
        );
        newActivePlayers.delete(player.id);
      }
    }
  }
  // Handle Sub In
  for (const playerId of subInPlayers) {
    const player = game.players.find(p => p.id === playerId);
    if (player) {
      const newSub: Substitution = {
        id: uuidv4(),
        player,
        timeIn: timeRemaining,
        timeOut: null,
        secondsPlayed: null,
        periodId: currentPeriodData.id
      };
      updatedPeriods[currentPeriod].substitutions.push(newSub);
      newActivePlayers.add(player.id);
    }
  }
  const updatedGame = { ...game, periods: updatedPeriods };
  await dbService.updateGame(updatedGame);
  return { updatedGame, newActivePlayers };
}

export async function addFoul(
  game: Game,
  currentPeriod: number,
  playerId: string,
  timeRemaining: number
): Promise<Game> {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return game;
  const newFoul: Foul = {
    id: uuidv4(),
    player,
    periodId: game.periods[currentPeriod].id,
    timeRemaining
  };
  const updatedPeriods = [...game.periods];
  if (!updatedPeriods[currentPeriod].fouls) {
    updatedPeriods[currentPeriod].fouls = [];
  }
  updatedPeriods[currentPeriod].fouls.push(newFoul);
  const updatedGame = { ...game, periods: updatedPeriods };
  await dbService.updateGame(updatedGame);
  return updatedGame;
}
