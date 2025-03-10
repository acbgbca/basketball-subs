import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Table, Form, Modal } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Team, Player } from '../types';
import { dbService } from '../services/db';

export const TeamView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    number: ''
  });

  useEffect(() => {
    const loadTeam = async () => {
      if (id) {
        const teamData = await dbService.getTeam(id);
        setTeam(teamData);
      }
    };
    loadTeam();
  }, [id]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    const newPlayer: Player = {
      id: uuidv4(),
      name: playerForm.name,
      number: playerForm.number
    };

    const updatedTeam: Team = {
      ...team,
      players: [...team.players, newPlayer]
    };

    await dbService.updateTeam(updatedTeam);
    setTeam(updatedTeam);
    setShowAddModal(false);
    setPlayerForm({ name: '', number: '' });
  };

  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !selectedPlayer) return;

    const updatedPlayers = team.players.map(player => 
      player.id === selectedPlayer.id 
        ? { ...player, name: playerForm.name, number: playerForm.number }
        : player
    );

    const updatedTeam: Team = {
      ...team,
      players: updatedPlayers
    };

    await dbService.updateTeam(updatedTeam);
    setTeam(updatedTeam);
    setShowEditModal(false);
    setSelectedPlayer(null);
    setPlayerForm({ name: '', number: '' });
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!team) return;

    const updatedTeam: Team = {
      ...team,
      players: team.players.filter(player => player.id !== playerId)
    };

    await dbService.updateTeam(updatedTeam);
    setTeam(updatedTeam);
  };

  const openEditModal = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerForm({
      name: player.name,
      number: player.number
    });
    setShowEditModal(true);
  };

  if (!team) return <div>Loading...</div>;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>{team.name}</h2>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Add Player
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Number</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.players.map(player => (
                <tr key={player.id} data-testid={`player-${player.number}`}>
                  <td>{player.number}</td>
                  <td>{player.name}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => openEditModal(player)}
                    >
                      Edit
                    </Button>
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
        </Col>
      </Row>

      {/* Add Player Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Player</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddPlayer}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="playerName">Name</Form.Label>
              <Form.Control
                id="playerName"
                type="text"
                value={playerForm.name}
                onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="playerNumber">Number</Form.Label>
              <Form.Control
                id="playerNumber"
                type="text"
                value={playerForm.number}
                onChange={(e) => setPlayerForm({ ...playerForm, number: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" data-testid="add-player-button">
              Add Player
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Player Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Player</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditPlayer}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={playerForm.name}
                onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Number</Form.Label>
              <Form.Control
                type="text"
                value={playerForm.number}
                onChange={(e) => setPlayerForm({ ...playerForm, number: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}; 