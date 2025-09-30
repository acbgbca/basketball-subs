import React, { useState } from 'react';
import { Table, Button, Badge, Form, Modal, ButtonGroup, Alert } from 'react-bootstrap';
import { Player } from '../../types';
import { useForm } from '../../hooks/useForm';
import { FormField, PlayerNameField, JerseyNumberField } from '../ui/FormField';
import { validatePlayerForm } from '../../validations/playerValidation';

interface PlayerTableProps {
  players: Player[];
  onAddPlayer?: (playerData: Omit<Player, 'id'>) => void;
  onUpdatePlayer?: (player: Player) => void;
  onDeletePlayer?: (playerId: string) => void;
  onPlayerSelect?: (playerId: string, selected: boolean) => void;
  selectedPlayers?: Set<string>;
  editable?: boolean;
  selectable?: boolean;
  showAddButton?: boolean;
  maxPlayers?: number;
  className?: string;
}

interface PlayerFormData {
  name: string;
  number: string;
}

/**
 * Reusable player table component for team management
 */
export const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onPlayerSelect,
  selectedPlayers = new Set(),
  editable = false,
  selectable = false,
  showAddButton = true,
  maxPlayers,
  className,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form for adding/editing players
  const form = useForm<PlayerFormData>(
    { name: '', number: '' },
    validatePlayerForm
  );

  // Get used jersey numbers (excluding the one being edited)
  const usedNumbers = players
    .filter(p => !editingPlayer || p.id !== editingPlayer.id)
    .map(p => p.number);

  // Check if jersey number is available
  const isNumberAvailable = (number: string): boolean => {
    return !usedNumbers.includes(number);
  };

  // Open modal for adding new player
  const handleAddPlayer = () => {
    form.reset({ name: '', number: '' });
    setEditingPlayer(null);
    setShowModal(true);
  };

  // Open modal for editing existing player
  const handleEditPlayer = (player: Player) => {
    form.reset({ name: player.name, number: player.number });
    setEditingPlayer(player);
    setShowModal(true);
  };

  // Close modal and reset form
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlayer(null);
    form.reset();
  };

  // Submit form (add or update player)
  const handleSubmitForm = form.handleSubmit(async (values) => {
    // Additional validation for jersey number availability
    if (!isNumberAvailable(values.number)) {
      form.setFieldError('number', `Jersey number ${values.number} is already taken`);
      return;
    }

    if (editingPlayer) {
      // Update existing player
      const updatedPlayer: Player = {
        ...editingPlayer,
        name: values.name.trim(),
        number: values.number.trim(),
      };
      onUpdatePlayer?.(updatedPlayer);
    } else {
      // Add new player
      const newPlayerData: Omit<Player, 'id'> = {
        name: values.name.trim(),
        number: values.number.trim(),
      };
      onAddPlayer?.(newPlayerData);
    }

    handleCloseModal();
  });

  // Handle player selection
  const handlePlayerSelection = (playerId: string, checked: boolean) => {
    onPlayerSelect?.(playerId, checked);
  };

  // Delete player with confirmation
  const handleDeletePlayer = (player: Player) => {
    if (window.confirm(`Are you sure you want to delete ${player.name}?`)) {
      onDeletePlayer?.(player.id);
    }
  };

  // Sort players by jersey number
  const sortedPlayers = [...players].sort((a, b) => {
    const numA = parseInt(a.number) || 999;
    const numB = parseInt(b.number) || 999;
    return numA - numB;
  });

  const canAddMore = !maxPlayers || players.length < maxPlayers;

  return (
    <div className={className}>
      {/* Header with add button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0">
            Players 
            <Badge bg="secondary" className="ms-2">
              {players.length}
              {maxPlayers ? `/${maxPlayers}` : ''}
            </Badge>
          </h5>
          {selectable && (
            <small className="text-muted">
              {selectedPlayers.size} of {players.length} selected
            </small>
          )}
        </div>
        
        {editable && showAddButton && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddPlayer}
            disabled={!canAddMore}
          >
            <i className="fas fa-plus me-1" />
            Add Player
          </Button>
        )}
      </div>

      {/* Players table */}
      {players.length === 0 ? (
        <Alert variant="info" className="text-center">
          <i className="fas fa-users fa-2x mb-2" />
          <div>No players added yet</div>
          {editable && showAddButton && (
            <Button variant="outline-primary" size="sm" onClick={handleAddPlayer} className="mt-2">
              Add your first player
            </Button>
          )}
        </Alert>
      ) : (
        <Table responsive striped hover>
          <thead>
            <tr>
              {selectable && <th style={{ width: '50px' }}>Select</th>}
              <th style={{ width: '80px' }}>Number</th>
              <th>Name</th>
              {editable && <th style={{ width: '120px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.id}>
                {selectable && (
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedPlayers.has(player.id)}
                      onChange={(e) => handlePlayerSelection(player.id, e.target.checked)}
                    />
                  </td>
                )}
                
                <td>
                  <Badge bg="secondary" className="fs-6">
                    #{player.number}
                  </Badge>
                </td>
                
                <td className="fw-bold">{player.name}</td>
                
                {editable && (
                  <td>
                    <ButtonGroup size="sm">
                      <Button
                        variant="outline-primary"
                        onClick={() => handleEditPlayer(player)}
                        title="Edit player"
                      >
                        <i className="fas fa-edit" />
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => handleDeletePlayer(player)}
                        title="Delete player"
                      >
                        <i className="fas fa-trash" />
                      </Button>
                    </ButtonGroup>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Add/Edit Player Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingPlayer ? 'Edit Player' : 'Add New Player'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmitForm}>
          <Modal.Body>
            <PlayerNameField
              name="name"
              label="Player Name"
              form={form}
              required
              className="mb-3"
            />
            
            <JerseyNumberField
              name="number"
              label="Jersey Number"
              form={form}
              required
              usedNumbers={usedNumbers}
              className="mb-3"
            />

            {!canAddMore && !editingPlayer && (
              <Alert variant="warning">
                <i className="fas fa-exclamation-triangle me-2" />
                Maximum number of players ({maxPlayers}) reached
              </Alert>
            )}
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={form.isSubmitting || (!canAddMore && !editingPlayer)}
            >
              {form.isSubmitting ? 'Saving...' : (editingPlayer ? 'Update Player' : 'Add Player')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Footer info */}
      {maxPlayers && (
        <div className="mt-2 small text-muted">
          {canAddMore ? (
            `${maxPlayers - players.length} more players can be added`
          ) : (
            'Maximum number of players reached'
          )}
        </div>
      )}
    </div>
  );
};