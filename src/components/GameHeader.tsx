import React from 'react';
import { Row, Col, Button, Badge } from 'react-bootstrap';

interface GameHeaderProps {
  teamName: string;
  opponent: string;
  currentPeriod: number;
  periodFouls: number;
  timeRemaining: number;
  isRunning: boolean;
  onTimeAdjustment: (seconds: number) => void;
  onToggleClock: () => void;
  onEndPeriod: () => void;
  onShowSub: () => void;
  onShowFoul: () => void;
  formatTime: (seconds: number) => string;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  teamName,
  opponent,
  currentPeriod,
  periodFouls,
  timeRemaining,
  isRunning,
  onTimeAdjustment,
  onToggleClock,
  onEndPeriod,
  onShowSub,
  onShowFoul,
  formatTime
}) => (
  <Row className="mb-4">
    <Col>
      <h2>{teamName}</h2>
      <h4 className="text-muted">vs {opponent}</h4>
      <div className="d-flex align-items-center">
        <h3 className="mb-0 me-2" data-testid="period-display">Period {currentPeriod + 1}</h3>
        <Badge bg="danger" data-testid="period-fouls">
          {periodFouls} fouls
        </Badge>
      </div>
      <div className="clock-display">
        <h1 data-testid="clock-display" data-seconds={timeRemaining}>{formatTime(timeRemaining)}</h1>
        <div className="d-flex gap-2 mb-3">
          <Button variant="outline-secondary" size="sm" onClick={() => onTimeAdjustment(-1)}>-1s</Button>
          <Button variant="outline-secondary" size="sm" onClick={() => onTimeAdjustment(-10)}>-10s</Button>
          <Button variant="outline-secondary" size="sm" onClick={() => onTimeAdjustment(-30)}>-30s</Button>
          <Button variant="outline-secondary" size="sm" onClick={() => onTimeAdjustment(1)}>+1s</Button>
          <Button variant="outline-secondary" size="sm" onClick={() => onTimeAdjustment(10)}>+10s</Button>
          <Button variant="outline-secondary" size="sm" onClick={() => onTimeAdjustment(30)}>+30s</Button>
        </div>
        <div className="d-flex gap-2">
          <Button variant={isRunning ? "danger" : "success"} onClick={onToggleClock}>
            {isRunning ? "Stop" : "Start"}
          </Button>
          <Button variant="warning" onClick={onEndPeriod}>End Period</Button>
          <Button variant="primary" onClick={onShowSub}>Sub</Button>
          <Button variant="danger" onClick={onShowFoul}>Foul</Button>
        </div>
      </div>
    </Col>
  </Row>
);

export default GameHeader;
