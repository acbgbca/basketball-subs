import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { Team } from '../types';
import { dbService } from '../services/db';
import { APP_CONFIG } from '../config';

export const TeamForm: React.FC = () => {
  const [teamName, setTeamName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTeam: Team = {
      id: uuidv4(),
      name: teamName,
      players: []
    };

    try {
      await dbService.addTeam(newTeam);
      // Redirect to team list
      window.location.href = `${APP_CONFIG.basePath}/teams`;
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  return (
    <Container>
      <h2>Create New Team</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Team Name</Form.Label>
          <Form.Control
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Create Team
        </Button>
      </Form>
    </Container>
  );
}; 