import React from 'react';
import { Card, Button, ButtonGroup } from 'react-bootstrap';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useGameStore } from '../../stores/gameStore';

interface GameTimerProps {
  className?: string;
}

/**
 * Game timer component with controls for start/pause and time adjustments
 */
export const GameTimer: React.FC<GameTimerProps> = ({ className }) => {
  const { game, currentPeriod } = useGameStore();
  const { timeRemaining, isRunning, formattedTime, start, pause } = useGameTimer();

  const handleTimeAdjustment = (seconds: number) => {
    const { updateTimeRemaining } = useGameStore.getState();
    const newTime = Math.max(0, timeRemaining + seconds);
    updateTimeRemaining(newTime);
  };

  const handleToggleClock = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  if (!game) {
    return (
      <Card className={className}>
        <Card.Body>
          <Card.Title>Game Timer</Card.Title>
          <div className="text-center">
            <div className="h2">--:--</div>
            <div className="text-muted">No game loaded</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const currentPeriodData = game.periods[currentPeriod];
  const periodNumber = currentPeriodData?.periodNumber || currentPeriod + 1;

  return (
    <Card className={className}>
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-center">
          <span data-testid="period-display">Period {periodNumber}</span>
          <small className="text-muted">
            {currentPeriodData?.length || 10} min
          </small>
        </Card.Title>
        
        <div className="text-center mb-3">
          <div className="h1 mb-2" style={{ fontFamily: 'monospace' }} data-testid="clock-display">
            {formattedTime}
          </div>
          
          <div className="mb-3">
            <Button
              variant={isRunning ? 'warning' : 'success'}
              size="lg"
              onClick={handleToggleClock}
              disabled={timeRemaining === 0}
              className="me-2"
            >
              {isRunning ? 'Pause' : 'Start'}
            </Button>
          </div>

          <div className="d-flex justify-content-center gap-2 mb-2">
            <ButtonGroup size="sm">
              <Button
                variant="outline-secondary"
                onClick={() => handleTimeAdjustment(-60)}
                disabled={isRunning}
                title="Subtract 1 minute"
              >
                -1:00
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => handleTimeAdjustment(-10)}
                disabled={isRunning}
                title="Subtract 10 seconds"
              >
                -0:10
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => handleTimeAdjustment(10)}
                disabled={isRunning}
                title="Add 10 seconds"
              >
                +0:10
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => handleTimeAdjustment(60)}
                disabled={isRunning}
                title="Add 1 minute"
              >
                +1:00
              </Button>
            </ButtonGroup>
          </div>

          {timeRemaining === 0 && (
            <div className="text-danger fw-bold">
              TIME EXPIRED
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between text-muted small">
          <span>Period {periodNumber}</span>
          <span className={isRunning ? 'text-success' : 'text-secondary'}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </Card.Body>
    </Card>
  );
};