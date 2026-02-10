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
  const [validationErrors, setValidationErrors] = useState<{[playerId: string]: string}>({});
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
        const importedPlayers = sharedTeam.players.map(p => ({
          id: uuidv4(),
          ...p
        }));
        setPlayers(importedPlayers);
        // Validate imported players for duplicates
        validatePlayerNumbers(importedPlayers);
      }
    }
  }, [location]);

  const validatePlayerNumbers = (playerList: Array<{id: string; name: string; number: string}>) => {
    const errors: {[playerId: string]: string} = {};
    const numberCounts: {[number: string]: Array<{id: string; name: string; number: string}>} = {};
    
    // Group players by number
    playerList.forEach(player => {
      if (player.number.trim()) {
        if (!numberCounts[player.number]) {
          numberCounts[player.number] = [];
        }
        numberCounts[player.number].push(player);
      }
    });
    
    // Find duplicates and mark all but the first as errors
    Object.entries(numberCounts).forEach(([number, playersWithNumber]) => {
      if (playersWithNumber.length > 1) {
        // Mark all but the first player as having an error
        playersWithNumber.slice(1).forEach(player => {
          errors[player.id] = `Player number ${number} is already used`;
        });
      }
    });
    
    setValidationErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if there are validation errors
    if (Object.keys(validationErrors).length > 0) return;
    
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
                        const updatedPlayers = players.map(p => 
                          p.id === player.id ? { ...p, number: e.target.value } : p
                        );
                        setPlayers(updatedPlayers);
                        validatePlayerNumbers(updatedPlayers);
                      }}
                      required
                      isInvalid={!!validationErrors[player.id]}
                    />
                    {validationErrors[player.id] && (
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[player.id]}
                      </Form.Control.Feedback>
                    )}
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
        <Button 
          variant="primary" 
          type="submit"
          disabled={Object.keys(validationErrors).length > 0}
        >
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