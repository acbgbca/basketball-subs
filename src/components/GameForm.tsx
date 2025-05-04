import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Modal } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { Game, Team, Player } from '../types';
import { dbService } from '../services/db';
import { useNavigate } from 'react-router-dom';

export const GameForm: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [opponent, setOpponent] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [periodLength, setPeriodLength] = useState<10 | 20>(20);
  const [numPeriods, setNumPeriods] = useState<2 | 4>(2);
  const [fillInPlayers, setFillInPlayers] = useState<{ id: string, name: string, number: string }[]>([]);
  const [fillInPlayerName, setFillInPlayerName] = useState('');
  const [fillInPlayerNumber, setFillInPlayerNumber] = useState('');
  const [editingFillInPlayerId, setEditingFillInPlayerId] = useState<string | null>(null);
  const [showFillInPlayerModal, setShowFillInPlayerModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTeams = async () => {
      const teamsData = await dbService.getTeams();
      setTeams(teamsData);
    };
    loadTeams();
  }, []);

  const handleTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId) || null;
    setSelectedTeam(team);
    setSelectedPlayers(new Set());
  };

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleAddOrEditFillInPlayer = () => {
    if (fillInPlayerName && fillInPlayerNumber) {
      if (editingFillInPlayerId) {
        setFillInPlayers(prev =>
          prev.map(player =>
            player.id === editingFillInPlayerId
              ? { ...player, name: fillInPlayerName, number: fillInPlayerNumber }
              : player
          )
        );
        setEditingFillInPlayerId(null);
      } else {
        setFillInPlayers(prev => [
          ...prev,
          { id: uuidv4(), name: fillInPlayerName, number: fillInPlayerNumber }
        ]);
      }
      setFillInPlayerName('');
      setFillInPlayerNumber('');
      setShowFillInPlayerModal(false);
    }
  };

  const handleEditFillInPlayer = (id: string) => {
    const player = fillInPlayers.find(p => p.id === id);
    if (player) {
      setFillInPlayerName(player.name);
      setFillInPlayerNumber(player.number);
      setEditingFillInPlayerId(id);
      setShowFillInPlayerModal(true);
    }
  };

  const handleRemoveFillInPlayer = (id: string) => {
    setFillInPlayers(prev => prev.filter(player => player.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    const periods = Array(numPeriods).fill(null).map((_, index) => ({
      id: uuidv4(),
      periodNumber: index + 1,
      length: periodLength,
      substitutions: [],
      fouls: []  // Initialize fouls array
    }));

    const selectedTeamPlayers = selectedTeam.players.filter(player => selectedPlayers.has(player.id));
    const fillInPlayersList: Player[] = fillInPlayers.map(player => ({
      id: player.id,
      name: player.name,
      number: player.number
    }));

    const newGame: Game = {
      id: uuidv4(),
      date: new Date(),
      team: selectedTeam,
      opponent,
      players: [...selectedTeamPlayers, ...fillInPlayersList],
      periods,
      activePlayers: [],
      currentPeriod: 0,
      isRunning: false
    };

    try {
      await dbService.addGame(newGame);
      navigate('/games');
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  return (
    <Container>
      <h2>Create New Game</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="team-select">Select Team</Form.Label>
          <Form.Select
            id="team-select"
            data-testid="team-select"
            value={selectedTeam?.id || ''}
            onChange={(e) => handleTeamChange(e.target.value)}
            required
          >
            <option value="">Choose a team...</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label htmlFor="opponent">Opponent</Form.Label>
          <Form.Control
            id="opponent"
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            required
          />
        </Form.Group>

        {selectedTeam && (
          <Form.Group className="mb-3">
            <Form.Label>Players</Form.Label>
            {selectedTeam.players.map(player => (
              <Form.Check
                key={player.id}
                id={`player-${player.id}`}
                type="checkbox"
                label={`${player.number} - ${player.name}`}
                checked={selectedPlayers.has(player.id)}
                onChange={() => handlePlayerToggle(player.id)}
              />
            ))}
          </Form.Group>
        )}

        <Button variant="secondary" onClick={() => setShowFillInPlayerModal(true)}>
          Add Fill in Player
        </Button>

        {fillInPlayers.length > 0 && (
          <Form.Group className="mb-3">
            <Form.Label>Fill in Players</Form.Label>
            <ul>
              {fillInPlayers.map((player, index) => (
                <li key={index}>
                  {player.number} - {player.name}
                  &nbsp;
                  <Button variant="outline-secondary" onClick={() => handleEditFillInPlayer(player.id)}>
                    Edit
                  </Button>
                  &nbsp;
                  <Button variant="outline-danger" onClick={() => handleRemoveFillInPlayer(player.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Form.Label htmlFor="game-format-select">Game Format</Form.Label>
          <Form.Select
            id="game-format-select"
            data-testid="game-format-select"
            value={`${numPeriods}-${periodLength}`}
            onChange={(e) => {
              const [periods, length] = e.target.value.split('-').map(Number);
              setNumPeriods(periods as 2 | 4);
              setPeriodLength(length as 10 | 20);
            }}
            required
          >
            <option value="2-20">2 halves (20 minutes each)</option>
            <option value="4-10">4 quarters (10 minutes each)</option>
          </Form.Select>
        </Form.Group>

        <Button variant="primary" type="submit">
          Create Game
        </Button>
      </Form>

      {/* Fill in Player Modal */}
      <Modal show={showFillInPlayerModal} onHide={() => setShowFillInPlayerModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingFillInPlayerId ? 'Edit Fill in Player' : 'Add Fill in Player'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="fillInPlayerName">Fill in Player Name</Form.Label>
            <Form.Control
              id="fillInPlayerName"
              type="text"
              value={fillInPlayerName}
              onChange={(e) => setFillInPlayerName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="fillInPlayerNumber">Fill in Player Number</Form.Label>
            <Form.Control
              id="fillInPlayerNumber"
              type="text"
              value={fillInPlayerNumber}
              onChange={(e) => setFillInPlayerNumber(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFillInPlayerModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddOrEditFillInPlayer}>
            {editingFillInPlayerId ? 'Save Changes' : 'Add Player'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};