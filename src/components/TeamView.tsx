import React, { useEffect, useState, ReactElement } from 'react';
import { Container, Row, Col, Button, Table, Form, InputGroup, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Team, Player } from '../types';
import { dbService } from '../services/db';
import { createShareUrl } from '../utils/shareTeam';

export const TeamView: React.FC = (): ReactElement => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [editedPlayers, setEditedPlayers] = useState<Player[]>([]);
  const [editedTeamName, setEditedTeamName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[playerId: string]: string}>({});

  useEffect(() => {
    const loadTeam = async () => {
      if (id) {
        const teamData = await dbService.getTeam(id);
        setTeam(teamData);
        const players = teamData?.players || [];
        setEditedPlayers(players);
        setEditedTeamName(teamData?.name || '');
        // Validate existing players for duplicates
        validatePlayerNumbers(players);
      }
    };
    loadTeam();
  }, [id]);

  const handlePlayerChange = (playerId: string, field: 'name' | 'number', value: string) => {
    const updatedPlayers = editedPlayers.map(player => 
      player.id === playerId ? { ...player, [field]: value } : player
    );
    setEditedPlayers(updatedPlayers);
    setHasChanges(true);
    
    // Validate for duplicate numbers if the number field changed
    if (field === 'number') {
      validatePlayerNumbers(updatedPlayers);
    }
  };

  const validatePlayerNumbers = (players: Player[]) => {
    const errors: {[playerId: string]: string} = {};
    const numberCounts: {[number: string]: Player[]} = {};
    
    // Group players by number
    players.forEach(player => {
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

  const handleAddPlayer = () => {
    const newPlayer: Player = {
      id: uuidv4(),
      name: '',
      number: ''
    };
    const updatedPlayers = [...editedPlayers, newPlayer];
    setEditedPlayers(updatedPlayers);
    setHasChanges(true);
    // Validate after adding (in case there are existing duplicates)
    validatePlayerNumbers(updatedPlayers);
  };

  const handleRemovePlayer = (playerId: string) => {
    const updatedPlayers = editedPlayers.filter(player => player.id !== playerId);
    setEditedPlayers(updatedPlayers);
    setHasChanges(true);
    // Validate after removing (might resolve duplicate errors)
    validatePlayerNumbers(updatedPlayers);
    // Clear any validation error for the removed player
    setValidationErrors(errors => {
      const newErrors = { ...errors };
      delete newErrors[playerId];
      return newErrors;
    });
  };

  const handleTeamNameChange = (value: string) => {
    setEditedTeamName(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!team) return;
    
    // Don't save if there are validation errors
    if (Object.keys(validationErrors).length > 0) return;

    const updatedTeam: Team = {
      ...team,
      name: editedTeamName,
      players: editedPlayers
    };

    await dbService.updateTeam(updatedTeam);
    setTeam(updatedTeam);
    setHasChanges(false);
  };

  const handleCancel = () => {
    navigate('/teams');
  };

  const handleDone = () => {
    navigate('/teams');
  };

  const handleShare = async () => {
    if (!team) return;
    
    const url = createShareUrl({
      name: team.name,
      players: team.players.map(p => ({
        number: p.number,
        name: p.name
      }))
    });
    
    try {
      await navigator.clipboard.writeText(url);
      setShareUrl(url);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy share URL:', error);
    }
  };

  if (!team) return <div>Loading...</div>;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <Form.Control
            type="text"
            value={editedTeamName}
            onChange={(e) => handleTeamNameChange(e.target.value)}
            className="h2 border-0 bg-transparent"
            style={{ fontSize: '2rem' }}
            required
            aria-label="Team Name"
          />
        </Col>
      </Row>

      <Row>
        <Col>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Number</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {editedPlayers.map(player => (
                <tr key={player.id} data-testid={`player-${player.number}`}>
                  <td>
                    <Form.Control
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      value={player.number}
                      onChange={(e) => handlePlayerChange(player.id, 'number', e.target.value)}
                      required
                      aria-label="Player Number"
                      style={{ width: '80px' }}
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
                      onChange={(e) => handlePlayerChange(player.id, 'name', e.target.value)}
                      required
                      aria-label="Player Name"
                    />
                  </td>
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemovePlayer(player.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex flex-column flex-md-row justify-content-between mt-3 gap-3">
            <Button 
              variant="primary" 
              onClick={handleAddPlayer}
              className="w-md-auto"
            >
              Add Player
            </Button>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex gap-2 justify-content-end">
                <Button 
                  variant="secondary" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleSave}
                  disabled={!hasChanges || Object.keys(validationErrors).length > 0}
                >
                  Save Changes
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleDone}
                >
                  Done
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={handleShare}
                >
                  Share Team
                </Button>
              </div>
            </div>
          </div>
          {showCopySuccess && (
            <Alert variant="success" className="py-2 mb-0">
              Team URL copied to clipboard!
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};