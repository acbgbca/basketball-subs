import React from 'react';
import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { gameService } from '../../services/gameService';

interface GameControlsProps {
  className?: string;
}

/**
 * Game control buttons for substitutions, fouls, and period management
 */
export const GameControls: React.FC<GameControlsProps> = ({ className }) => {
  const { 
    game, 
    activePlayers, 
    currentPeriod, 
    timeRemaining,
    isRunning 
  } = useGameStore();
  
  const {
    showSubstitutionModal,
    showFoulModal,
    showEndPeriodModal,
  } = useUIStore();

  if (!game) {
    return (
      <Card className={className}>
        <Card.Body>
          <Card.Title>Game Controls</Card.Title>
          <div className="text-muted">No game loaded</div>
        </Card.Body>
      </Card>
    );
  }

  const activePlayerCount = activePlayers.size;
  const maxPlayers = 5;
  const currentPeriodData = game.periods[currentPeriod];
  const periodFouls = gameService.calculatePeriodFouls(game, currentPeriod);
  const isLastPeriod = currentPeriod >= game.periods.length - 1;
  const canEndPeriod = timeRemaining === 0 || !isRunning;

  return (
    <Card className={className}>
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-center">
          <span>Game Controls</span>
          <Badge bg={activePlayerCount > maxPlayers ? 'danger' : 'primary'}>
            {activePlayerCount}/{maxPlayers} Active
          </Badge>
        </Card.Title>

        <Row className="g-2">
          <Col xs={6}>
            <Button
              variant="primary"
              className="w-100"
              onClick={() => showSubstitutionModal()}
              disabled={!game || activePlayerCount === 0}
            >
              <i className="fas fa-exchange-alt me-2" />
              Sub
            </Button>
          </Col>
          
          <Col xs={6}>
            <Button
              variant="warning"
              className="w-100"
              onClick={() => showFoulModal()}
              disabled={!game || activePlayerCount === 0}
            >
              <i className="fas fa-exclamation-triangle me-2" />
              Foul
            </Button>
          </Col>

          <Col xs={12}>
            <Button
              variant={canEndPeriod ? 'danger' : 'outline-danger'}
              className="w-100"
              onClick={() => showEndPeriodModal()}
              disabled={!canEndPeriod}
            >
              <i className="fas fa-stop-circle me-2" />
              {isLastPeriod ? 'End Game' : 'End Period'}
            </Button>
          </Col>
        </Row>

        <hr />

        <div className="small text-muted">
          <Row>
            <Col xs={6}>
              <strong>Period Fouls:</strong>
              <Badge bg="secondary" className="ms-1">
                {periodFouls}
              </Badge>
            </Col>
            <Col xs={6} className="text-end">
              <strong>Time:</strong> {gameService.formatTime(timeRemaining)}
            </Col>
          </Row>
          
          <Row className="mt-2">
            <Col xs={12}>
              <div className="d-flex justify-content-between">
                <span>
                  <strong>Status:</strong> 
                  <Badge bg={isRunning ? 'success' : 'secondary'} className="ms-1">
                    {isRunning ? 'Running' : 'Stopped'}
                  </Badge>
                </span>
                
                {activePlayerCount > maxPlayers && (
                  <Badge bg="danger" className="pulse">
                    Too many players!
                  </Badge>
                )}
              </div>
            </Col>
          </Row>
        </div>

        {timeRemaining === 0 && (
          <div className="mt-2 p-2 bg-warning rounded text-center">
            <strong>⏰ Period Time Expired</strong>
            <br />
            <small>End the period to continue</small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};