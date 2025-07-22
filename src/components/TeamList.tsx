import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Team } from '../types';
import { dbService } from '../services/db';
import { TeamForm } from './TeamForm';

import { useNavigate } from 'react-router-dom';

export const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importValue, setImportValue] = useState('');
  const [importError, setImportError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadTeams = async () => {
      const teamsData = await dbService.getTeams();
      setTeams(teamsData.sort((a, b) => a.name.localeCompare(b.name)));
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

  const handleTeamCreated = (newTeam: Team) => {
    setTeams([...teams, newTeam].sort((a, b) => a.name.localeCompare(b.name)));
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Teams</h2>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => setShowNewTeamModal(true)}>
              Add New Team
            </Button>
            <Button variant="outline-secondary" onClick={() => setShowImportModal(true)}>
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
      <Modal show={showNewTeamModal} onHide={() => setShowNewTeamModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TeamForm 
            isModal={true} 
            onClose={() => setShowNewTeamModal(false)}
            onTeamCreated={handleTeamCreated}
          />
        </Modal.Body>
      </Modal>

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

      {/* Import Modal */}
      <Modal show={showImportModal} onHide={() => { setShowImportModal(false); setImportValue(''); setImportError(''); }}>
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
            setShowImportModal(false);
            setImportValue('');
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
              <Button variant="secondary" onClick={() => { setShowImportModal(false); setImportValue(''); setImportError(''); }}>
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