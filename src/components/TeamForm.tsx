import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { Team } from '../types';
import { dbService } from '../services/db';
import { useNavigate } from 'react-router-dom';

interface TeamFormProps {
  isModal?: boolean;
  onClose?: () => void;
  onTeamCreated?: (team: Team) => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({ isModal, onClose, onTeamCreated }) => {
  const [teamName, setTeamName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTeam: Team = {
      id: uuidv4(),
      name: teamName,
      players: []
    };

    try {
      await dbService.addTeam(newTeam);
      // Always notify parent about team creation
      if (isModal) {
        onTeamCreated?.(newTeam);
        onClose?.();
      }
      // Always navigate to new team's view page
      navigate(`/teams/${newTeam.id}`);
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const content = (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="teamName">Team Name</Form.Label>
        <Form.Control
          id="teamName"
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />
      </Form.Group>
      <div className="d-flex gap-2">
        {isModal && (
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button variant="primary" type="submit">
          Create Team
        </Button>
      </div>
    </Form>
  );

  // If used in modal mode, just return the form content
  if (isModal) {
    return content;
  }

  // If used as a standalone page, wrap in container with title
  return (
    <Container>
      <h2>Create New Team</h2>
      {content}
    </Container>
  );
};