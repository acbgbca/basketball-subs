import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { Game } from '../../types';
import { formatTimeNullable } from '../../utils/timeUtils';
import { sortPlayersByName } from '../../utils/playerUtils';
import { useTimeInput } from '../../hooks/useTimeInput';

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
  // Use custom hook for time input management
  const timeInput = useTimeInput(
    eventId ? (eventTime ?? null) : null,
    onEventTimeChange
  );

  // Get the maximum allowed time for validation
  const maxTimeSeconds = game.periods[game.currentPeriod].length * 60;

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
              className={`form-control ${!timeInput.isValid ? 'is-invalid' : ''}`}
              value={timeInput.value}
              pattern="^\d{1,2}:\d{2}$"
              placeholder="mm:ss"
              minLength={4}
              maxLength={5}
              onChange={timeInput.handleChange}
              onBlur={timeInput.handleBlur}
              max={formatTimeNullable(maxTimeSeconds)}
            />
            {!timeInput.isValid && (
              <div className="invalid-feedback">
                Please enter time in mm:ss format
              </div>
            )}
            {timeInput.isValid && !timeInput.validateBounds(maxTimeSeconds) && (
              <div className="invalid-feedback d-block">
                Time cannot exceed {formatTimeNullable(maxTimeSeconds)}
              </div>
            )}
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
            {sortPlayersByName(
              Array.from(activePlayers)
                .map(playerId => game.players.find(p => p.id === playerId))
                .filter(player => player !== undefined)
            ).map(player => (
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
              ))}
          </Col>
          <Col>
            <h5>On Bench</h5>
            {sortPlayersByName(
              game.players.filter(p => !activePlayers.has(p.id))
            ).map(player => (
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
