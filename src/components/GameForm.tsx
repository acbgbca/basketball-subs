import React, { useState, useEffect } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    const periods = Array(numPeriods).fill(null).map((_, index) => ({
      id: uuidv4(),
      periodNumber: index + 1,
      length: periodLength,
      substitutions: []
    }));

    const newGame: Game = {
      id: uuidv4(),
      date: new Date(),
      team: selectedTeam,
      opponent,
      players: selectedTeam.players.filter(player => selectedPlayers.has(player.id)),
      periods
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
          <Form.Label>Select Team</Form.Label>
          <Form.Select
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
                type="checkbox"
                label={`${player.number} - ${player.name}`}
                checked={selectedPlayers.has(player.id)}
                onChange={() => handlePlayerToggle(player.id)}
              />
            ))}
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Game Format</Form.Label>
          <Form.Select
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
    </Container>
  );
};