import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Table } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { Team } from '../types';
import { dbService } from '../services/db';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseSharedTeam } from '../utils/shareTeam';

interface TeamFormProps {
  isModal?: boolean;
  onClose?: () => void;
  onTeamCreated?: (team: Team) => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({ isModal, onClose, onTeamCreated }) => {
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<Array<{id: string; name: string; number: string}>>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for shared team data in URL
    const query = new URLSearchParams(location.search);
    const shareData = query.get('share');
    
    if (shareData) {
      const sharedTeam = parseSharedTeam(shareData);
      if (sharedTeam) {
        setTeamName(sharedTeam.name);
        setPlayers(sharedTeam.players.map(p => ({
          id: uuidv4(),
          ...p
        })));
      }
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTeam: Team = {
      id: uuidv4(),
      name: teamName,
      players: players
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
      
      {players.length > 0 && (
        <Form.Group className="mb-3">
          <Form.Label>Players</Form.Label>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Number</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.id}>
                  <td>
                    <Form.Control
                      type="text"
                      value={player.number}
                      onChange={(e) => {
                        setPlayers(prev => prev.map(p => 
                          p.id === player.id ? { ...p, number: e.target.value } : p
                        ));
                      }}
                      required
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      value={player.name}
                      onChange={(e) => {
                        setPlayers(prev => prev.map(p => 
                          p.id === player.id ? { ...p, name: e.target.value } : p
                        ));
                      }}
                      required
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Form.Group>
      )}

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