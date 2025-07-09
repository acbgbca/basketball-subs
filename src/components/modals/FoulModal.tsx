import React from 'react';
import { Modal, Button, Badge, Alert } from 'react-bootstrap';
import { Game } from '../../types';

interface FoulModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  activePlayers: Set<string>;
  selectedFoulPlayerId: string | null;
  setSelectedFoulPlayerId: (id: string | null) => void;
  game: Game;
  calculatePlayerFouls: (game: Game, playerId: string) => number;
  handleFoulPlayerClick: (playerId: string) => void;
}

const FoulModal: React.FC<FoulModalProps> = ({
  show,
  onHide,
  onConfirm,
  activePlayers,
  selectedFoulPlayerId,
  setSelectedFoulPlayerId,
  game,
  calculatePlayerFouls,
  handleFoulPlayerClick
}) => (
  <Modal show={show} onHide={onHide} data-testid="foul-modal">
    <Modal.Header closeButton>
      <Modal.Title>Record Foul</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h5>Select Player</h5>
      {game.players
        .filter(player => activePlayers.has(player.id))
        .sort((a, b) => parseInt(a.number) - parseInt(b.number))
        .map(player => (
          <Button
            key={player.id}
            variant={selectedFoulPlayerId === player.id ? "primary" : "outline-light"}
            className="d-flex justify-content-between align-items-center mb-2 w-100 text-dark"
            onClick={() => handleFoulPlayerClick(player.id)}
          >
            <span>{player.number} - {player.name}</span>
            <Badge bg="danger">{calculatePlayerFouls(game, player.id)} fouls</Badge>
          </Button>
        ))}
      {Array.from(activePlayers).length === 0 && (
        <Alert variant="warning">
          No players are currently on the court. Sub in players to record fouls.
        </Alert>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={onConfirm}
        disabled={!selectedFoulPlayerId}
      >
        Done
      </Button>
    </Modal.Footer>
  </Modal>
);

export default FoulModal;
