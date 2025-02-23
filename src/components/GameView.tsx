import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Table, Badge } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { Game, Player, Substitution } from '../types';
import { dbService } from '../services/db';

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

  useEffect(() => {
    const loadGame = async () => {
      if (!id) return;
      const gameData = await dbService.getGame(id);
      setGame(gameData);
    };
    loadGame();
  }, [id]);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubstitution = async (player: Player) => {
    if (!game) return;

    const isPlayerActive = activePlayers.has(player.id);
    const currentTimeStamp = currentTime;

    if (isPlayerActive) {
      // Remove player
      const newSub: Substitution = {
        id: crypto.randomUUID(),
        player,
        timeOn: currentTimeStamp,
        timeOff: currentTime,
        minutesPlayed: (currentTime - currentTimeStamp) / 60
      };
      
      const updatedPeriods = [...game.periods];
      updatedPeriods[currentPeriod].substitutions.push(newSub);
      
      const newActivePlayers = new Set(activePlayers);
      newActivePlayers.delete(player.id);
      setActivePlayers(newActivePlayers);
      
      // Update game in DB
      await dbService.updateGame({
        ...game,
        periods: updatedPeriods
      });
    } else {
      // Add player
      const newSub: Substitution = {
        id: crypto.randomUUID(),
        player,
        timeOn: currentTime,
        timeOff: null,
        minutesPlayed: null
      };
      
      const updatedPeriods = [...game.periods];
      updatedPeriods[currentPeriod].substitutions.push(newSub);
      
      const newActivePlayers = new Set(activePlayers);
      newActivePlayers.add(player.id);
      setActivePlayers(newActivePlayers);
      
      // Update game in DB
      await dbService.updateGame({
        ...game,
        periods: updatedPeriods
      });
    }
  };

  if (!game) return <div>Loading...</div>;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>{game.team.name}</h2>
          <h3>Period {currentPeriod + 1}</h3>
          <div className="clock-display">
            <h1>{formatTime(currentTime)}</h1>
            <Button 
              variant={isClockRunning ? "danger" : "success"}
              onClick={() => isClockRunning ? stopClock() : startClock()}
              className="me-2"
            >
              {isClockRunning ? "Stop" : "Start"}
            </Button>
            <Button 
              variant="secondary"
              onClick={() => adjustClock(currentTime + 60)}
            >
              +1:00
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <h4>Players</h4>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Number</th>
                <th>Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {game.team.players.map(player => (
                <tr key={player.id}>
                  <td>{player.number}</td>
                  <td>{player.name}</td>
                  <td>
                    <Badge bg={activePlayers.has(player.id) ? "success" : "secondary"}>
                      {activePlayers.has(player.id) ? "On Court" : "On Bench"}
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
    </Container>
  );
}; 