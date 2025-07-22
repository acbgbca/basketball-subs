// Helper to format seconds as mm:ss
const formatTime = (seconds: number | null) => {
  if (seconds == null || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { Game } from '../../types';

interface SubstitutionModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: () => void;
  activePlayers: Set<string>;
  subInPlayers: Set<string>;
  subOutPlayers: Set<string>;
  game: Game;
  handleSubButtonClick: (playerId: string, action: 'in' | 'out') => void;
  eventId?: string; // Optional, present if editing
  eventTime?: number; // Optional, present if editing
  onEventTimeChange?: (newTime: number) => void; // Optional, for editing time
}


const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  show,
  onHide,
  onSubmit,
  activePlayers,
  subInPlayers,
  subOutPlayers,
  game,
  handleSubButtonClick,
  eventId,
  eventTime,
  onEventTimeChange
}) => {
  // Local state for editing time if editing an event



  // Store editTime in seconds, but allow editing raw mm:ss string
  const [editTime, setEditTime] = React.useState(eventTime ?? null);
  const [rawTimeInput, setRawTimeInput] = React.useState(eventId && eventTime != null ? formatTime(eventTime) : '');

  React.useEffect(() => {
    setEditTime(eventTime ?? null);
    setRawTimeInput(eventId && eventTime != null ? formatTime(eventTime) : '');
  }, [eventTime, eventId]);


  // Helper to parse mm:ss string to seconds
  const parseTime = (value: string) => {
    const parts = value.split(':');
    if (parts.length !== 2) return NaN;
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (isNaN(m) || isNaN(s) || s < 0 || s > 59 || m < 0) return NaN;
    return m * 60 + s;
  };

  // Handle input change: update raw value, only update seconds if valid
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRawTimeInput(value);
    if (value === '') {
      setEditTime(null);
      if (onEventTimeChange) onEventTimeChange(0);
      return;
    }
    // Only update seconds if valid mm:ss
    if (/^\d{1,2}:\d{2}$/.test(value)) {
      const seconds = parseTime(value);
      setEditTime(isNaN(seconds) ? null : seconds);
      if (onEventTimeChange) onEventTimeChange(isNaN(seconds) ? 0 : seconds);
    }
  };

  // On blur, reformat if valid
  const handleTimeBlur = () => {
    if (/^\d{1,2}:\d{2}$/.test(rawTimeInput)) {
      const seconds = parseTime(rawTimeInput);
      setRawTimeInput(isNaN(seconds) ? '' : formatTime(seconds));
    } else if (rawTimeInput === '') {
      setRawTimeInput('');
    } else if (editTime != null) {
      setRawTimeInput(formatTime(editTime));
    }
  };

  // For controlled input value
  const timeInputValue = eventId ? rawTimeInput : '';

  return (
    <Modal show={show} onHide={onHide} data-testid="substitution-modal">
      <Modal.Header closeButton>
        <Modal.Title>{eventId ? 'Edit Substitution Event' : 'Manage Substitutions'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {eventId && (
          <div className="mb-3">
            <label htmlFor="eventTimeInput" className="form-label">Time Remaining (mm:ss)</label>
            <input
              id="eventTimeInput"
              type="text"
              className="form-control"
              value={timeInputValue}
              pattern="^\d{1,2}:\d{2}$"
              placeholder="mm:ss"
              minLength={4}
              maxLength={5}
              onChange={handleTimeChange}
              onBlur={handleTimeBlur}
              max={formatTime(game.periods[game.currentPeriod].length * 60)}
            />
          </div>
        )}
        <Row>
          <Col>
            <h5>
              On Court&nbsp;
              <Badge bg={
                activePlayers.size + subInPlayers.size - subOutPlayers.size === 5 ? "success" :
                activePlayers.size + subInPlayers.size - subOutPlayers.size > 5 ? "danger" :
                "primary"
              }>
                {activePlayers.size + subInPlayers.size - subOutPlayers.size}
              </Badge>
            </h5>
            {Array.from(activePlayers).map(playerId => {
              const player = game.players.find(p => p.id === playerId);
              return player ? (
                <Button
                  key={player.id}
                  variant="outline-light"
                  className="d-flex justify-content-between align-items-center mb-2 w-100 text-dark"
                  onClick={() => handleSubButtonClick(player.id, 'out')}
                >
                  <span>{player.name}</span>
                  <span className={`badge ${subOutPlayers.has(player.id) ? "bg-secondary" : "bg-danger"}`}>
                    {subOutPlayers.has(player.id) ? "Sub" : "Out"}
                  </span>
                </Button>
              ) : null;
            })}
          </Col>
          <Col>
            <h5>On Bench</h5>
            {game.players.filter(p => !activePlayers.has(p.id)).map(player => (
              <Button
                key={player.id}
                variant="outline-light"
                className="d-flex justify-content-between align-items-center mb-2 w-100 text-dark"
                onClick={() => handleSubButtonClick(player.id, 'in')}
              >
                <span>{player.name}</span>
                <span className={`badge ${subInPlayers.has(player.id) ? "bg-secondary" : "bg-success"}`}>
                  {subInPlayers.has(player.id) ? "Sub" : "In"}
                </span>
              </Button>
            ))}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={(activePlayers.size + subInPlayers.size - subOutPlayers.size) > 5}
          data-testid="sub-modal-done"
        >
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SubstitutionModal;
