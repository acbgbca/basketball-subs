import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Team } from '../types';
import { dbService } from '../services/db';
import { TeamForm } from './TeamForm';
import { useNavigate } from 'react-router-dom';
import { useModalState, useModalWithData } from '../hooks/useModalState';
import { useTeams } from '../hooks/useDataLoading';

export const TeamList: React.FC = () => {
  // Use custom hook for teams loading
  const { teams, loading, error, setTeams } = useTeams(true);
  const [importValue, setImportValue] = useState('');
  const [importError, setImportError] = useState('');
  const navigate = useNavigate();

  // Modal state management using custom hooks
  const newTeamModal = useModalState(false);
  const deleteModal = useModalWithData<Team>();
  const importModal = useModalState(false, () => {
    setImportValue('');
    setImportError('');
  });

  const handleDeleteClick = (team: Team) => {
    deleteModal.open(team);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.data) return;

    try {
      await dbService.deleteTeam(deleteModal.data.id);
      setTeams(teams.filter(team => team.id !== deleteModal.data.id));
      deleteModal.close();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleTeamCreated = (newTeam: Team) => {
    setTeams([...teams, newTeam].sort((a, b) => a.name.localeCompare(b.name)));
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Teams</h2>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={newTeamModal.open}>
              Add New Team
            </Button>
            <Button variant="outline-secondary" onClick={importModal.open}>
              Import
            </Button>
          </div>
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

      {/* New Team Modal */}
      <Modal show={newTeamModal.show} onHide={newTeamModal.close}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TeamForm 
            isModal={true} 
            onClose={newTeamModal.close}
            onTeamCreated={handleTeamCreated}
          />
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModal.show} onHide={deleteModal.close}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the team "{deleteModal.data?.name}"?
          {deleteModal.data?.players.length ? (
            <div className="text-danger mt-2">
              Warning: This team has {deleteModal.data.players.length} player(s) that will also be deleted.
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={deleteModal.close}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Team
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Import Modal */}
      <Modal show={importModal.show} onHide={importModal.close}>
        <Modal.Header closeButton>
          <Modal.Title>Import Team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setImportError('');
            let share = importValue.trim();
            // Try to extract ?share=... or &share=... from a full URL
            const match = share.match(/[?&]share=([^&#]+)/);
            if (match) {
              share = match[1];
            }
            // If it looks like a valid share string (base64 or json), continue
            if (!share) {
              setImportError('Please enter a valid share URL or code.');
              return;
            }
            // Navigate to TeamForm with share param
            navigate(`/teams/new?share=${encodeURIComponent(share)}`);
            importModal.close();
          }}>
            <Form.Group>
              <Form.Label>Paste the full share URL or just the share code below:</Form.Label>
              <Form.Control
                type="text"
                value={importValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImportValue(e.target.value)}
                placeholder="https://.../teams/new?share=... or just the code"
                autoFocus
                required
              />
            </Form.Group>
            {importError && <div className="text-danger mt-2">{importError}</div>}
            <div className="d-flex gap-2 mt-3 justify-content-end">
              <Button variant="secondary" onClick={importModal.close}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Import
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};