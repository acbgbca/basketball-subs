import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Button, Table, Badge, Modal, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Game, Substitution } from '../types';
import { dbService } from '../services/db';

export const GameView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const [game, setGame] = useState<Game | null>(null);
  const [activePlayers, setActivePlayers] = useState<Set<string>>(new Set());
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Substitution | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const justAdjustedRef = useRef(false); // Add this new ref
  const baseTimeRef = useRef<{startTime: number; initialRemaining: number} | null>(null);

  // Form state for editing substitutions
  const [editForm, setEditForm] = useState({
    timeIn: 0,
    timeOut: 0
  });

  // Add this with other state declarations
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  // Add new state near other state declarations
  const [showEndPeriodModal, setShowEndPeriodModal] = useState(false);

  const [showSubModal, setShowSubModal] = useState(false);
  const [subInPlayers, setSubInPlayers] = useState<Set<string>>(new Set());
  const [subOutPlayers, setSubOutPlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadGame = async () => {
      if (id) {
        const gameData = await dbService.getGame(id);
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
    await dbService.updateGame(updatedGame);
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePlayerMinutes = (playerId: string): number => {
    if (!game) return 0;
    return game.periods.reduce((total, period) => {
      const playerSubs = period.substitutions.filter(sub => 
        sub.player.id === playerId && sub.secondsPlayed !== null
      );
      return total + playerSubs.reduce((subTotal, sub) => 
        subTotal + (sub.secondsPlayed || 0), 0
      );
    }, 0);
  };

  const handleEndPeriod = async () => {
    if (!game) return;

    // Sub out all active players with timeOut = 0
    const promises = Array.from(activePlayers).map(playerId => {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        const currentPeriodData = game.periods[currentPeriod];
        const activeSub = currentPeriodData.substitutions.find(
          sub => sub.player.id === player.id && sub.timeOut === null
        );

        if (activeSub) {
          const updatedSub: Substitution = {
            ...activeSub,
            timeOut: 0,
            secondsPlayed: activeSub.timeIn
          };

          const updatedPeriods = [...game.periods];
          updatedPeriods[currentPeriod].substitutions = currentPeriodData.substitutions.map(
            sub => sub.id === activeSub.id ? updatedSub : sub
          );

          return dbService.updateGame({ ...game, periods: updatedPeriods });
        }
      }
      return Promise.resolve();
    });

    await Promise.all(promises);

    setIsRunning(false);
    if (currentPeriod < game.periods.length - 1) {
      setCurrentPeriod(prev => prev + 1);
      setTimeRemaining(game.periods[currentPeriod + 1].length * 60);
    } else {
      setTimeRemaining(0);
    }
    setActivePlayers(new Set());
    setShowEndPeriodModal(false);
  };

  const handleDeleteSubstitution = async (subToDelete: Substitution) => {
    if (!game) return;

    const updatedPeriods = [...game.periods];
    updatedPeriods[currentPeriod].substitutions = 
      updatedPeriods[currentPeriod].substitutions.filter(sub => sub.id !== subToDelete.id);

    const updatedGame = { ...game, periods: updatedPeriods };
    await dbService.updateGame(updatedGame);
    setGame(updatedGame);
  };

  const handleEditSubstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !selectedSub) return;

    const updatedSub: Substitution = {
      ...selectedSub,
      timeIn: editForm.timeIn,
      timeOut: editForm.timeOut,
      secondsPlayed: (editForm.timeIn - editForm.timeOut)
    };

    const updatedPeriods = [...game.periods];
    updatedPeriods[currentPeriod].substitutions = 
      updatedPeriods[currentPeriod].substitutions.map(sub => 
        sub.id === selectedSub.id ? updatedSub : sub
      );

    const updatedGame = { ...game, periods: updatedPeriods };
    await dbService.updateGame(updatedGame);
    setGame(updatedGame);
    setShowEditSubModal(false);
  };

  const handleSubModalSubmit = async () => {
    if (!game) return;
  
    const newActivePlayers = new Set(activePlayers);
    const currentPeriodData = game.periods[currentPeriod];
  
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
  
          const updatedPeriods = [...game.periods];
          updatedPeriods[currentPeriod].substitutions = currentPeriodData.substitutions.map(
            sub => sub.id === activeSub.id ? updatedSub : sub
          );
  
          const updatedGame = { ...game, periods: updatedPeriods };
          await dbService.updateGame(updatedGame);
          setGame(updatedGame);
  
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
  
        const updatedPeriods = [...game.periods];
        updatedPeriods[currentPeriod].substitutions.push(newSub);
  
        const updatedGame = { ...game, periods: updatedPeriods };
        await dbService.updateGame(updatedGame);
        setGame(updatedGame);
  
        newActivePlayers.add(player.id);
      }
    }
  
    setActivePlayers(newActivePlayers);
    setShowSubModal(false);
    setSubInPlayers(new Set());
    setSubOutPlayers(new Set());
  };
  
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
      dbService.updateGame(updatedGame);
      setGame(updatedGame);
    }
  };

  if (!game) return <div>Loading...</div>;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>{game.team.name}</h2>
          <h4 className="text-muted">vs {game.opponent}</h4>
          <h3>Period {currentPeriod + 1}</h3>
          <div className="clock-display">
            <h1 data-testid="clock-display" data-seconds={timeRemaining}>{formatTime(timeRemaining)}</h1>
            <div className="d-flex gap-2 mb-3">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => handleTimeAdjustment(-1)}
              >
                -1s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => handleTimeAdjustment(-10)}
              >
                -10s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => handleTimeAdjustment(-30)}
              >
                -30s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => handleTimeAdjustment(1)}
              >
                +1s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => handleTimeAdjustment(10)}
              >
                +10s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => handleTimeAdjustment(30)}
              >
                +30s
              </Button>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant={isRunning ? "danger" : "success"}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? "Stop" : "Start"}
              </Button>
              <Button 
                variant="warning"
                onClick={() => setShowEndPeriodModal(true)}
              >
                End Period
              </Button>
              <Button 
                variant="primary"
                onClick={() => setShowSubModal(true)}
              >
                Sub
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <h4>Players</h4>
          <Table striped bordered>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Played</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {game.players.map(player => (
                <tr key={player.id} data-testid={`player-${player.id}`}>
                  <td>{player.number}</td>
                  <td>{player.name}</td>
                  <td>{formatTime(calculatePlayerMinutes(player.id))}</td>
                  <td>
                    <Badge bg={activePlayers.has(player.id) ? "success" : "secondary"}>
                      {activePlayers.has(player.id) ? "Court" : "Bench"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <h4>Substitutions</h4>
          <Form.Check
            type="switch"
            id="show-all-periods"
            label="Show all periods"
            checked={showAllPeriods}
            onChange={(e) => setShowAllPeriods(e.target.checked)}
            className="mb-3"
          />
          <Table striped bordered>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Played</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {game.periods.slice(showAllPeriods ? 0 : currentPeriod, showAllPeriods ? undefined : currentPeriod + 1).sort((a, b) => b.periodNumber - a.periodNumber).map((period, periodIndex) => (
                period.substitutions
                  .sort((a, b) => a.timeIn - b.timeIn)
                  .map(sub => (
                    <tr key={sub.id}>
                      <td>{period.periodNumber}</td>
                      <td>{sub.player.name}</td>
                      <td>{formatTime(sub.timeIn)}</td>
                      <td>{sub.timeOut || sub.timeOut === 0 ? formatTime(sub.timeOut) : 'Active'}</td>
                      <td>{sub.secondsPlayed ? formatTime(sub.secondsPlayed) : '-'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => {
                            setSelectedSub(sub);
                            setEditForm({
                              timeIn: sub.timeIn,
                              timeOut: sub.timeOut || 0
                            });
                            setShowEditSubModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteSubstitution(sub)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      {/* Edit Substitution Modal */}
      <Modal show={showEditSubModal} onHide={() => setShowEditSubModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Substitution</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubstitution}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Time In (seconds remaining)</Form.Label>
              <Form.Control
                type="number"
                value={editForm.timeIn}
                onChange={(e) => setEditForm({ ...editForm, timeIn: Number(e.target.value) })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Time Out (seconds remaining)</Form.Label>
              <Form.Control
                type="number"
                value={editForm.timeOut}
                onChange={(e) => setEditForm({ ...editForm, timeOut: Number(e.target.value) })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditSubModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* End Period Confirmation Modal */}
      <Modal show={showEndPeriodModal} onHide={() => setShowEndPeriodModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>End Period Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to end Period {currentPeriod + 1}? 
          {activePlayers.size > 0 && ` ${activePlayers.size} player(s) will be subbed out.`}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEndPeriodModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleEndPeriod}>
            End Period
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Substitution Modal */}
      <Modal show={showSubModal} onHide={() => setShowSubModal(false)} data-testid="substitution-modal">
        <Modal.Header closeButton>
          <Modal.Title>Manage Substitutions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col>
              <h5>On Court ({activePlayers.size + subInPlayers.size - subOutPlayers.size})</h5>
              {Array.from(activePlayers).map(playerId => {
                const player = game.players.find(p => p.id === playerId);
                return player ? (
                  <div key={player.id} className="d-flex justify-content-between align-items-center mb-2">
                    <span>{player.name}</span>
                    <Button 
                      variant={subOutPlayers.has(player.id) ? "secondary" : "danger"} 
                      size="sm" 
                      onClick={() => handleSubButtonClick(player.id, 'out')}
                    >
                      {subOutPlayers.has(player.id) ? "Cancel Out" : "Out"}
                    </Button>
                  </div>
                ) : null;
              })}
            </Col>
            <Col>
              <h5>On Bench</h5>
              {game.players.filter(p => !activePlayers.has(p.id)).map(player => (
                <div key={player.id} className="d-flex justify-content-between align-items-center mb-2">
                  <span>{player.name}</span>
                  <Button 
                    variant={subInPlayers.has(player.id) ? "secondary" : "success"} 
                    onClick={() => handleSubButtonClick(player.id, 'in')}
                    disabled={!subInPlayers.has(player.id) && ((activePlayers.size + subInPlayers.size - subOutPlayers.size) >= 5)}
                  >
                    {subInPlayers.has(player.id) ? "Cancel In" : "In"}
                  </Button>
                </div>
              ))}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubModalSubmit}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};