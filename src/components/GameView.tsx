import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Button, Table, Badge, Modal, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { Game, Player, Substitution } from '../types';
import { dbService } from '../services/db';
import { validRange } from 'semver';

export const GameView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    currentTime,
    isClockRunning,
    startClock,
    stopClock,
    adjustClock
  } = useGame();
  
  const [game, setGame] = useState<Game | null>(null);
  const [activePlayers, setActivePlayers] = useState<Set<string>>(new Set());
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Substitution | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form state for editing substitutions
  const [editForm, setEditForm] = useState({
    timeIn: 0,
    timeOut: 0
  });

  // Add this with other state declarations
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  // Add new state near other state declarations
  const [showEndPeriodModal, setShowEndPeriodModal] = useState(false);

  useEffect(() => {
    const loadGame = async () => {
      if (id) {
        const gameData = await dbService.getGame(id);
        setGame(gameData);
        // Initialize timeRemaining with the period length in seconds
        const periodLengthInSeconds = gameData.periods[currentPeriod].length * 60;
        setTimeRemaining(periodLengthInSeconds);
      }
    };
    loadGame();
  }, [id, currentPeriod]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current as NodeJS.Timeout);
    }
    return () => clearInterval(timerRef.current as NodeJS.Timeout);
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

  const handleSubstitution = async (player: Player) => {
    if (!game) return;

    const isPlayerActive = activePlayers.has(player.id);
    const currentPeriodData = game.periods[currentPeriod];

    if (isPlayerActive) {
      // Sub Out
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

        const newActivePlayers = new Set(activePlayers);
        newActivePlayers.delete(player.id);
        setActivePlayers(newActivePlayers);
      }
    } else {
      // Sub In
      const newSub: Substitution = {
        id: crypto.randomUUID(),
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

      const newActivePlayers = new Set(activePlayers);
      newActivePlayers.add(player.id);
      setActivePlayers(newActivePlayers);
    }
  };

  const handleEndPeriod = async () => {
    if (!game) return;

    // Sub out all active players with timeOut = 0
    const promises = Array.from(activePlayers).map(playerId => {
      const player = game.team.players.find(p => p.id === playerId);
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

  if (!game) return <div>Loading...</div>;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>{game.team.name}</h2>
          <h3>Period {currentPeriod + 1}</h3>
          <div className="clock-display">
            <h1>{formatTime(timeRemaining)}</h1>
            <div className="d-flex gap-2 mb-3">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setTimeRemaining(prev => prev - 1)}
              >
                -1s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setTimeRemaining(prev => prev - 10)}
              >
                -10s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setTimeRemaining(prev => prev - 30)}
              >
                -30s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setTimeRemaining(prev => prev + 1)}
              >
                +1s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setTimeRemaining(prev => prev + 10)}
              >
                +10s
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setTimeRemaining(prev => prev + 30)}
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {game.team.players.map(player => (
                <tr key={player.id}>
                  <td>{player.number}</td>
                  <td>{player.name}</td>
                  <td>{formatTime(calculatePlayerMinutes(player.id))}</td>
                  <td>
                    <Badge bg={activePlayers.has(player.id) ? "success" : "secondary"}>
                      {activePlayers.has(player.id) ? "Court" : "Bench"}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant={activePlayers.has(player.id) ? "danger" : "success"}
                      size="sm"
                      onClick={() => handleSubstitution(player)}
                    >
                      {activePlayers.has(player.id) ? "Sub Out" : "Sub In"}
                    </Button>
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
    </Container>
  );
}; 