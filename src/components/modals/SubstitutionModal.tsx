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
}

const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  show,
  onHide,
  onSubmit,
  activePlayers,
  subInPlayers,
  subOutPlayers,
  game,
  handleSubButtonClick
}) => (
  <Modal show={show} onHide={onHide} data-testid="substitution-modal">
    <Modal.Header closeButton>
      <Modal.Title>Manage Substitutions</Modal.Title>
    </Modal.Header>
    <Modal.Body>
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

export default SubstitutionModal;
