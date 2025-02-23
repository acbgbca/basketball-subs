import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Game } from '../types';
import { dbService } from '../services/db';

export const GameList: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const loadGames = async () => {
      const gamesData = await dbService.getGames();
      setGames(gamesData);
    };
    loadGames();
  }, []);

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
                <Button variant="outline-primary" href={`/games/${game.id}`}>
                  View Game
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}; 