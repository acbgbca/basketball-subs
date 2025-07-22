
import { Game, Substitution, Foul, Player, SubstitutionEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from './db';

interface GameService {
  getGame(id: string): Promise<Game>;
  updateGame(game: Game): Promise<void>;
  formatTime(seconds: number): string;
  calculatePlayerMinutes(game: Game, playerId: string, activePlayers: Set<string>,
    timeRemaining: number, currentPeriod: number): number;
  calculatePlayerFouls(game: Game, playerId: string): number;
  calculatePlayerSubTime(game: Game, playerId: string, currentPeriod: number,
    activePlayers: Set<string>): number | null;
  calculatePeriodFouls(game: Game, currentPeriod: number): number;
  endPeriod(game: Game): Promise<Game>;
  deleteSubstitution(game: Game, currentPeriod: number, eventId: string): Promise<Game>;
  editSubstitution(game: Game, currentPeriod: number, eventId: string,
    eventTime: number, subbedIn: Player[], playersOut: Player[]): Promise<Game>;
  subModalSubmit(game: Game, subInPlayers: Set<string>, subOutPlayers: Set<string>, timeRemaining: number): Promise<{ updatedGame: Game, newActivePlayers: Set<string> }>;
  addFoul(game: Game, currentPeriod: number, playerId: string, timeRemaining: number): Promise<Game>;
}

export const gameService:GameService = {
  async getGame(id: string):Promise<Game> {
    return dbService.getGame(id);
  },
  
  async updateGame(game: Game): Promise<void> {
    return dbService.updateGame(game);
  },
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  calculatePlayerMinutes(game: Game, playerId: string, activePlayers: Set<string>, timeRemaining: number, currentPeriod: number): number {
    // Calculate completed substitution time using SubstitutionEvent
    let completedTime = 0;
    for (const period of game.periods) {
      for (const sub of period.substitutions) {
        if (sub.player.id === playerId && sub.secondsPlayed !== null) {
          completedTime += sub.secondsPlayed || 0;
        }
      }
    }
    // If player is active, add current active time
    if (activePlayers.has(playerId)) {
      // Find the latest Substitution for this player
      const period = game.periods[currentPeriod];
      const sub = period.substitutions.find(s => s.player.id === playerId && s.timeOutEvent === null);
      if (sub && sub.timeInEvent) {
        const event = period.subEvents.find(e => e.id === sub.timeInEvent);
        if (event) {
          completedTime += (event.eventTime - timeRemaining);
        }
      }
    }
    return completedTime;
  },

  calculatePlayerFouls(game: Game, playerId: string): number {
    return game.periods.reduce((total, period) => {
      return total + (period.fouls?.filter(foul => foul.player.id === playerId).length || 0);
    }, 0);
  },

  calculatePlayerSubTime(game: Game, playerId: string, currentPeriod: number, activePlayers: Set<string>): number | null {
    const currentPeriodData = game.periods[currentPeriod];
    const lastSub = currentPeriodData.substitutions
      .filter(sub => sub.player.id === playerId)
      .sort((a, b) => {
        const aEvent = a.timeInEvent ? currentPeriodData.subEvents.find(e => e.id === a.timeInEvent) : null;
        const bEvent = b.timeInEvent ? currentPeriodData.subEvents.find(e => e.id === b.timeInEvent) : null;
        return ((aEvent?.eventTime || 0) - (bEvent?.eventTime || 0));
      })[0];
    if (!lastSub) return null;
    if (activePlayers.has(playerId)) {
      if (lastSub.timeInEvent) {
        const event = currentPeriodData.subEvents.find(e => e.id === lastSub.timeInEvent);
        return event ? event.eventTime : null;
      }
      return null;
    } else if (lastSub.timeOutEvent) {
      const event = currentPeriodData.subEvents.find(e => e.id === lastSub.timeOutEvent);
      return event ? event.eventTime : null;
    }
    return null;
  },

  calculatePeriodFouls(game: Game, currentPeriod: number): number {
    return game.periods[currentPeriod].fouls?.length || 0;
  },

  async endPeriod(game: Game): Promise<Game> {
    // Sub out all active players with a single SubstitutionEvent at timeOut = 0
    const updatedPeriods = [...game.periods];
    const currentPeriodData = updatedPeriods[game.currentPeriod];
    const playersOut: Player[] = [];
    const updatedSubs: Substitution[] = [];
    for (const playerId of game.activePlayers) {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        const activeSub = currentPeriodData.substitutions.find(
          sub => sub.player.id === player.id && sub.timeOutEvent === null
        );
        if (activeSub) {
          playersOut.push(player);
          // Calculate secondsPlayed
          const timeInEventObj = currentPeriodData.subEvents.find(e => e.id === activeSub.timeInEvent);
          let secondsPlayed: number | null = null;
          if (timeInEventObj) {
            secondsPlayed = timeInEventObj.eventTime - 0;
          }
          updatedSubs.push({
            ...activeSub,
            timeOutEvent: '', // placeholder, will set after event is created
            secondsPlayed
          });
        }
      }
    }
    if (playersOut.length > 0) {
      const eventId = uuidv4();
      const endEvent: SubstitutionEvent = {
        id: eventId,
        eventTime: 0,
        periodId: currentPeriodData.id,
        subbedIn: [],
        playersOut
      };
      currentPeriodData.subEvents = [...(currentPeriodData.subEvents || []), endEvent];
      // Update substitutions with the new eventId
      currentPeriodData.substitutions = currentPeriodData.substitutions.map(sub => {
        const updated = updatedSubs.find(us => us.id === sub.id);
        if (updated) {
          return { ...updated, timeOutEvent: eventId };
        }
        return sub;
      });
      updatedPeriods[game.currentPeriod] = currentPeriodData;
      const updatedGame = { ...game, periods: updatedPeriods };
      await dbService.updateGame(updatedGame);
      return updatedGame;
    }
    return game;
  },

  async deleteSubstitution(game: Game, currentPeriod: number, eventId: string): Promise<Game> {
    // Delete SubstitutionEvent and update Substitution records and activePlayers
    const updatedPeriods = [...game.periods];
    const period = updatedPeriods[currentPeriod];
    const event = period.subEvents.find(e => e.id === eventId);
    period.subEvents = period.subEvents.filter(e => e.id !== eventId);
    let updatedActivePlayers = new Set(game.activePlayers);
    if (event) {
      // Remove substitutions for subbedIn
      period.substitutions = period.substitutions.filter(sub => !event.subbedIn.some(p => p.id === sub.player.id && sub.timeInEvent === eventId));
      // Remove timeOutEvent for subbed out
      period.substitutions = period.substitutions.map(sub => {
        if (event.playersOut.some(p => p.id === sub.player.id && sub.timeOutEvent === eventId)) {
          return { ...sub, timeOutEvent: null, secondsPlayed: null };
        }
        return sub;
      });
      // Reverse the event: add subbedIn back to inactive, add playersOut back to active
      for (const player of event.subbedIn) {
        updatedActivePlayers.delete(player.id);
      }
      for (const player of event.playersOut) {
        updatedActivePlayers.add(player.id);
      }
    }
    const updatedGame = { ...game, periods: updatedPeriods, activePlayers: Array.from(updatedActivePlayers) };
    await dbService.updateGame(updatedGame);
    return updatedGame;
  },

  async editSubstitution(game: Game, currentPeriod: number, eventId: string, eventTime: number, subbedIn: Player[], playersOut: Player[]): Promise<Game> {
    // Update SubstitutionEvent and related Substitution records
    const updatedPeriods = [...game.periods];
    const period = updatedPeriods[currentPeriod];
    period.subEvents = period.subEvents.map(e => e.id === eventId ? { ...e, eventTime, subbedIn, playersOut } : e);
    // Update Substitution records for subbedIn and playersOut
    for (const player of subbedIn) {
      const sub = period.substitutions.find(s => s.player.id === player.id && s.timeInEvent === eventId);
      if (sub) {
        // Update nothing for now (could update other fields if needed)
      }
    }
    for (const player of playersOut) {
      const sub = period.substitutions.find(s => s.player.id === player.id && s.timeOutEvent === eventId);
      if (sub) {
        // Update nothing for now (could update other fields if needed)
      }
    }
    const updatedGame = { ...game, periods: updatedPeriods };
    await dbService.updateGame(updatedGame);
    return updatedGame;
  },

  async subModalSubmit(
    game: Game,
    subInPlayers: Set<string>,
    subOutPlayers: Set<string>,
    timeRemaining: number
  ): Promise<{ updatedGame: Game, newActivePlayers: Set<string> }> {
    const newActivePlayers = new Set(game.activePlayers);
    const currentPeriodData = game.periods[game.currentPeriod];
    let updatedPeriods = [...game.periods];
    // Create SubstitutionEvent
    const subbedInPlayers = Array.from(subInPlayers).map(id => game.players.find(p => p.id === id)).filter(Boolean) as Player[];
    const playersOut = Array.from(subOutPlayers).map(id => game.players.find(p => p.id === id)).filter(Boolean) as Player[];
    const eventId = uuidv4();
    const newEvent: SubstitutionEvent = {
      id: eventId,
      eventTime: timeRemaining,
      periodId: currentPeriodData.id,
      subbedIn: subbedInPlayers,
      playersOut: playersOut
    };
    updatedPeriods[game.currentPeriod].subEvents = [
      ...(currentPeriodData.subEvents || []),
      newEvent
    ];
    // Handle Sub Out
    for (const player of playersOut) {
      const activeSub = currentPeriodData.substitutions.find(
        sub => sub.player.id === player.id && sub.timeOutEvent === null
      );
      if (activeSub) {
        // Find the timeInEvent and this timeOutEvent
        const timeInEventObj = currentPeriodData.subEvents.find(e => e.id === activeSub.timeInEvent);
        const timeOutEventObj = newEvent;
        let secondsPlayed: number | null = null;
        if (timeInEventObj && timeOutEventObj) {
          secondsPlayed = timeInEventObj.eventTime - timeOutEventObj.eventTime;
        }
        const updatedSub: Substitution = {
          ...activeSub,
          timeOutEvent: eventId,
          secondsPlayed
        };
        updatedPeriods[game.currentPeriod].substitutions = currentPeriodData.substitutions.map(
          sub => sub.id === activeSub.id ? updatedSub : sub
        );
        newActivePlayers.delete(player.id);
      }
    }
    // Handle Sub In
    for (const player of subbedInPlayers) {
      const newSub: Substitution = {
        id: uuidv4(),
        player,
        timeInEvent: eventId,
        timeOutEvent: null,
        secondsPlayed: null,
        periodId: currentPeriodData.id
      };
      updatedPeriods[game.currentPeriod].substitutions.push(newSub);
      newActivePlayers.add(player.id);
    }
    const updatedGame = { ...game, periods: updatedPeriods };
    await dbService.updateGame(updatedGame);
    return { updatedGame, newActivePlayers };
  },

  async addFoul(
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
};
