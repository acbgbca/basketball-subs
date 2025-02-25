import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Team } from '../types';
import { dbService } from '../services/db';
import { Link } from 'react-router-dom';

export const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const loadTeams = async () => {
      const teamsData = await dbService.getTeams();
      setTeams(teamsData);
    };
    loadTeams();
  }, []);

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Teams</h2>
          <Link to="/teams/new">
            <Button>Add New Team</Button>
          </Link>
        </Col>
      </Row>
      <Row>
        {teams.map(team => (
          <Col key={team.id} xs={12} md={6} lg={4} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>{team.name}</Card.Title>
                <Card.Text>Players: {team.players.length}</Card.Text>
                <Link to={`/teams/${team.id}`}>
                  <Button variant="outline-primary">
                    View Team
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}; 