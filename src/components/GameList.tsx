import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import { Game } from '../types';
import { dbService } from '../services/db';

export const GameList: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  useEffect(() => {
    const loadGames = async () => {
      const gamesData = await dbService.getGames();
      setGames(gamesData);
    };
    loadGames();
  }, []);

  const handleDeleteClick = (game: Game) => {
    setGameToDelete(game);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;

    try {
      await dbService.deleteGame(gameToDelete.id);
      setGames(games.filter(game => game.id !== gameToDelete.id));
      setShowDeleteModal(false);
      setGameToDelete(null);
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Games</h2>
          <Button variant="primary" href="/games/new">New Game</Button>
        </Col>
      </Row>
      <Row>
        {games.map(game => (
          <Col key={game.id} xs={12} md={6} lg={4} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>{game.team.name}</Card.Title>
                <Card.Text>
                  Date: {new Date(game.date).toLocaleDateString()}
                  <br />
                  Periods: {game.periods.length}
                </Card.Text>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    href={`/games/${game.id}`}
                  >
                    View Game
                  </Button>
                  <Button 
                    variant="outline-danger"
                    onClick={() => handleDeleteClick(game)}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the game for {gameToDelete?.team.name} on{' '}
          {gameToDelete && new Date(gameToDelete.date).toLocaleDateString()}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Game
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}; 