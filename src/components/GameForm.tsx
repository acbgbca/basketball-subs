import React, { useState, useEffect } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { Game, Team } from '../types';
import { dbService } from '../services/db';
import { APP_CONFIG } from '../config';
export const GameForm: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [periodLength, setPeriodLength] = useState<10 | 20>(20);
  const [numPeriods, setNumPeriods] = useState<2 | 4>(2);

  useEffect(() => {
    const loadTeams = async () => {
      const teamsData = await dbService.getTeams();
      setTeams(teamsData);
    };
    loadTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedTeam = teams.find(team => team.id === selectedTeamId);
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
      periods
    };

    try {
      await dbService.addGame(newGame);
      // Redirect to game list
      window.location.href = `${APP_CONFIG.basePath}/games`;
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
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
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
          <Form.Label>Game Format</Form.Label>
          <Form.Select
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