import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { Game, SubstitutionEvent } from '../types';
import { gameService } from '../services/gameService';
import GameHeader from './GameHeader';
import PlayerTable from './PlayerTable';
import SubstitutionTable from './SubstitutionTable';
import EditSubstitutionModal from './modals/EditSubstitutionModal';
import EndPeriodModal from './modals/EndPeriodModal';
import SubstitutionModal from './modals/SubstitutionModal';
import FoulModal from './modals/FoulModal';

export const GameView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const [game, setGame] = useState<Game | null>(null);
  const [activePlayers, setActivePlayers] = useState<Set<string>>(new Set());
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  // Remove selectedSub and editForm for substitution editing
  const [showFoulModal, setShowFoulModal] = useState(false);
  const [selectedFoulPlayerId, setSelectedFoulPlayerId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const justAdjustedRef = useRef(false); // Add this new ref
  const baseTimeRef = useRef<{startTime: number; initialRemaining: number} | null>(null);



  // Add this with other state declarations
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  // Add new state near other state declarations
  const [showEndPeriodModal, setShowEndPeriodModal] = useState(false);

  const [showSubModal, setShowSubModal] = useState(false);
  const [subInPlayers, setSubInPlayers] = useState<Set<string>>(new Set());
  const [subOutPlayers, setSubOutPlayers] = useState<Set<string>>(new Set());
  // For editing a substitution event
  const [editSubEventId, setEditSubEventId] = useState<string | null>(null);
  const [editSubEventTime, setEditSubEventTime] = useState<number | null>(null);

  useEffect(() => {
    const loadGame = async () => {
      if (id) {
        const gameData = await gameService.getGame(id);
        setGame(gameData);
        // Initialize states from persisted data
        setActivePlayers(new Set(gameData.activePlayers || []));
        setCurrentPeriod(gameData.currentPeriod || 0);
        setIsRunning(gameData.isRunning || false);
        
        // Calculate time remaining based on period start time or elapsed time
        if (gameData.isRunning && gameData.periodStartTime) {
          const elapsedSeconds = Math.floor((Date.now() - gameData.periodStartTime) / 1000);
          const periodLength = gameData.periods[currentPeriod].length * 60;
          setTimeRemaining(Math.max(0, periodLength - elapsedSeconds));
        } else if (gameData.periodTimeElapsed) {
          const periodLength = gameData.periods[currentPeriod].length * 60;
          setTimeRemaining(Math.max(0, periodLength - gameData.periodTimeElapsed));
        } else {
          setTimeRemaining(gameData.periods[currentPeriod].length * 60);
        }
      }
    };
    loadGame();
  }, [id]);

  // Update persistence when state changes
  const updateGameState = async () => {
    if (!game) return;
    const updatedGame = {
      ...game,
      activePlayers: Array.from(activePlayers),
      currentPeriod,
      isRunning,
      periodStartTime: isRunning ? Date.now() - ((game.periods[currentPeriod].length * 60) - timeRemaining) * 1000 : undefined,
      periodTimeElapsed: !isRunning ? game.periods[currentPeriod].length * 60 - timeRemaining : undefined,
    };
    await gameService.updateGame(updatedGame);
    setGame(updatedGame);
  };

  useEffect(() => {
    updateGameState();
  }, [activePlayers, currentPeriod, isRunning]);

  // Modify the timer effect to be more accurate
  useEffect(() => {
    if (isRunning) {
      // Initialize or update the base time ref
      if (!baseTimeRef.current || justAdjustedRef.current) {
        baseTimeRef.current = {
          startTime: Date.now(),
          initialRemaining: timeRemaining
        };
        justAdjustedRef.current = false;
      }
      
      timerRef.current = setInterval(() => {
        if (!baseTimeRef.current) return;
        
        const elapsed = Math.floor((Date.now() - baseTimeRef.current.startTime) / 1000);
        const newRemaining = Math.max(0, baseTimeRef.current.initialRemaining - elapsed);
        
        setTimeRemaining(newRemaining);
        
        if (newRemaining <= 0) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          setIsRunning(false);
          baseTimeRef.current = null;
        }
      }, 100);
    } else {
      clearInterval(timerRef.current as NodeJS.Timeout);
      baseTimeRef.current = null;
    }
    return () => {
      clearInterval(timerRef.current as NodeJS.Timeout);
    };
  }, [isRunning]);

  const handleEndPeriod = async () => {
    if (!game) return;
    const updatedGame = await gameService.endPeriod(game);
    setIsRunning(false);
    if (currentPeriod < game.periods.length - 1) {
      setCurrentPeriod(prev => prev + 1);
      setTimeRemaining(game.periods[currentPeriod + 1].length * 60);
    } else {
      setTimeRemaining(0);
    }
    setActivePlayers(new Set());
    setShowEndPeriodModal(false);
    setGame(updatedGame);
  };


  const handleDeleteEvent = async (event: SubstitutionEvent) => {
    if (!game) return;
    const updatedGame = await gameService.deleteSubstitution(game, currentPeriod, event.id);
    setGame(updatedGame);
    setActivePlayers(new Set(updatedGame.activePlayers || []));
  };


  // Edit a substitution event: open modal with event values for editing
  const handleEditEvent = (event: SubstitutionEvent) => {
    // To show the state as it was before the event:
    // - On Court: activePlayers + playersOut - subbedIn
    // - On Bench: all others
    // - subInPlayers: subbedIn
    // - subOutPlayers: playersOut
    if (!game) return;
    // Find the period and all events up to (but not including) this event
    const period = game.periods[currentPeriod];
    const eventIdx = period.subEvents.findIndex(e => e.id === event.id);
    // Start with initial activePlayers for the period
    let prevActive = new Set(game.activePlayers);
    // Rewind through subEvents up to this event to reconstruct state before it
    if (eventIdx > -1) {
      // Start with all subEvents up to (but not including) this one
      prevActive = new Set(game.activePlayers);
      // Apply all subEvents after this one in reverse to undo their effect
      for (let i = period.subEvents.length - 1; i > eventIdx; i--) {
        const e = period.subEvents[i];
        // Undo subbedIn: remove from active
        for (const p of e.subbedIn) prevActive.delete(p.id);
        // Undo playersOut: add back to active
        for (const p of e.playersOut) prevActive.add(p.id);
      }
      // Undo this event as well
      for (const p of event.subbedIn) prevActive.delete(p.id);
      for (const p of event.playersOut) prevActive.add(p.id);
    }
    setEditSubEventId(event.id);
    setEditSubEventTime(event.eventTime);
    setSubInPlayers(new Set(event.subbedIn.map(p => p.id)));
    setSubOutPlayers(new Set(event.playersOut.map(p => p.id)));
    setActivePlayers(prevActive);
    setShowSubModal(true);
  };

  const handleSubModalSubmit = async () => {
    if (!game) return;
    if (editSubEventId) {
      // Editing an existing event
      const subbedIn = Array.from(subInPlayers)
        .map(id => game.players.find(p => p.id === id))
        .filter((p): p is import('../types').Player => Boolean(p));
      const playersOut = Array.from(subOutPlayers)
        .map(id => game.players.find(p => p.id === id))
        .filter((p): p is import('../types').Player => Boolean(p));
      const updatedGame = await gameService.editSubstitution(
        game,
        currentPeriod,
        editSubEventId,
        editSubEventTime ?? timeRemaining,
        subbedIn,
        playersOut
      );
      setGame(updatedGame);
      // Update activePlayers based on the event (optional: recalc from game)
      setActivePlayers(new Set(updatedGame.activePlayers || []));
    } else {
      // New substitution event
      const { updatedGame, newActivePlayers } = await gameService.subModalSubmit(
        game,
        subInPlayers,
        subOutPlayers,
        timeRemaining
      );
      setGame(updatedGame);
      setActivePlayers(newActivePlayers);
    }
    setShowSubModal(false);
    setSubInPlayers(new Set());
    setSubOutPlayers(new Set());
    setEditSubEventId(null);
    setEditSubEventTime(null);
  };
  
  const handleFoulConfirm = async () => {
    if (!game || !selectedFoulPlayerId) return;
    const updatedGame = await gameService.addFoul(game, currentPeriod, selectedFoulPlayerId, timeRemaining);
    setGame(updatedGame);
    setShowFoulModal(false);
    setSelectedFoulPlayerId(null);
  };

  const handleFoulModalClose = () => {
    setShowFoulModal(false);
    setSelectedFoulPlayerId(null);
  };

  // Restore missing handler for time adjustment
  const handleTimeAdjustment = (seconds: number) => {
    const newTime = Math.max(0, timeRemaining + seconds);
    setTimeRemaining(newTime);
    if (isRunning) {
      baseTimeRef.current = {
        startTime: Date.now(),
        initialRemaining: newTime
      };
    }
    // If the clock is running, we need to adjust the game's periodStartTime
    if (isRunning && game) {
      const updatedGame = {
        ...game,
        periodStartTime: Date.now() - ((game.periods[currentPeriod].length * 60) - newTime) * 1000
      };
      gameService.updateGame(updatedGame);
      setGame(updatedGame);
    }
  };

  // Restore missing handler for sub button click
  const handleSubButtonClick = (playerId: string, action: 'in' | 'out') => {
    if (action === 'in') {
      setSubInPlayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) {
          newSet.delete(playerId);
        } else {
          newSet.add(playerId);
        }
        return newSet;
      });
      setSubOutPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    } else {
      setSubOutPlayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) {
          newSet.delete(playerId);
        } else {
          newSet.add(playerId);
        }
        return newSet;
      });
      setSubInPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
  };

  // Restore missing handler for foul player click
  const handleFoulPlayerClick = (playerId: string) => {
    const player = game?.players.find(p => p.id === playerId);
    if (player) {
      setSelectedFoulPlayerId(player.id);
    }
  };

  if (!game) return <div>Loading...</div>;

  return (
    <Container>
      <GameHeader
        teamName={game.team.name}
        opponent={game.opponent}
        currentPeriod={currentPeriod}
        periodFouls={gameService.calculatePeriodFouls(game, currentPeriod)}
        timeRemaining={timeRemaining}
        isRunning={isRunning}
        onTimeAdjustment={handleTimeAdjustment}
        onToggleClock={() => setIsRunning(!isRunning)}
        onEndPeriod={() => setShowEndPeriodModal(true)}
        onShowSub={() => setShowSubModal(true)}
        onShowFoul={() => setShowFoulModal(true)}
        formatTime={gameService.formatTime}
      />
      <Row>
        <Col>
          <PlayerTable
            game={game}
            activePlayers={activePlayers}
            currentPeriod={currentPeriod}
            timeRemaining={timeRemaining}
          />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <SubstitutionTable
            game={game}
            currentPeriod={currentPeriod}
            showAllPeriods={showAllPeriods}
            onShowAllPeriodsChange={checked => setShowAllPeriods(checked)}
            formatTime={gameService.formatTime}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </Col>
      </Row>

      {/* EditSubstitutionModal removed for event-based editing. Re-implement if needed. */}
      <EndPeriodModal
        show={showEndPeriodModal}
        onHide={() => setShowEndPeriodModal(false)}
        onEndPeriod={handleEndPeriod}
        currentPeriod={currentPeriod}
        activePlayersCount={activePlayers.size}
      />
      <SubstitutionModal
        show={showSubModal}
        onHide={() => {
          setShowSubModal(false);
          setEditSubEventId(null);
          setEditSubEventTime(null);
        }}
        onSubmit={handleSubModalSubmit}
        activePlayers={activePlayers}
        subInPlayers={subInPlayers}
        subOutPlayers={subOutPlayers}
        game={game}
        handleSubButtonClick={handleSubButtonClick}
        eventId={editSubEventId ?? undefined}
        eventTime={editSubEventTime ?? undefined}
        onEventTimeChange={setEditSubEventTime}
      />
      <FoulModal
        show={showFoulModal}
        onHide={handleFoulModalClose}
        onConfirm={handleFoulConfirm}
        activePlayers={activePlayers}
        selectedFoulPlayerId={selectedFoulPlayerId}
        setSelectedFoulPlayerId={setSelectedFoulPlayerId}
        game={game}
        calculatePlayerFouls={gameService.calculatePlayerFouls}
        handleFoulPlayerClick={handleFoulPlayerClick}
      />
    </Container>
  );
};