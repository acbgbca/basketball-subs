import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Team } from '../types';
import { dbService } from '../services/db';

export const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      const teamsData = await dbService.getTeams();
      setTeams(teamsData);
    };
    loadTeams();
  }, []);

  const handleDeleteClick = (team: Team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;

    try {
      await dbService.deleteTeam(teamToDelete.id);
      setTeams(teams.filter(team => team.id !== teamToDelete.id));
      setShowDeleteModal(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Teams</h2>
          <Link to="/teams/new">
            <Button variant="primary">Add New Team</Button>
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
                <div className="d-flex gap-2">
                  <Link to={`/teams/${team.id}`}>
                    <Button variant="outline-primary" data-testid={"view-team-" + team.name}>
                      View Team
                    </Button>
                  </Link>
                  <Button 
                    variant="outline-danger"
                    onClick={() => handleDeleteClick(team)}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the team "{teamToDelete?.name}"?
          {teamToDelete?.players.length ? (
            <div className="text-danger mt-2">
              Warning: This team has {teamToDelete.players.length} player(s) that will also be deleted.
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Team
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}; 