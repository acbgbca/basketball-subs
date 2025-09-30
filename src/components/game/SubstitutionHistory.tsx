import React, { useState } from 'react';
import { Card, Table, Button, Badge, Form, ButtonGroup } from 'react-bootstrap';
import { useGameStore } from '../../stores/gameStore';
import { useSubstitutions, useSubstitutionHistory } from '../../hooks/useSubstitutions';
import { useUIStore } from '../../stores/uiStore';
import { SubstitutionEvent } from '../../types';
import { gameService } from '../../services/gameService';

interface SubstitutionHistoryProps {
  className?: string;
}

/**
 * Individual substitution event row component
 */
const SubstitutionEventRow: React.FC<{ 
  event: SubstitutionEvent & { periodNumber: number }; 
  currentPeriod: number;
}> = React.memo(({ event, currentPeriod }) => {
  const { showEditSubstitutionModal } = useUIStore();
  const { deleteSubstitution } = useSubstitutions();

  const handleEdit = () => {
    showEditSubstitutionModal(event.id, event.eventTime);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this substitution?')) {
      await deleteSubstitution(event.id);
    }
  };

  const isCurrentPeriod = event.periodNumber === currentPeriod + 1;
  const formattedTime = gameService.formatTime(event.eventTime);

  return (
    <tr className={isCurrentPeriod ? 'table-info' : ''}>
      <td>
        <Badge bg={isCurrentPeriod ? 'primary' : 'secondary'}>
          P{event.periodNumber}
        </Badge>
      </td>
      
      <td className="fw-bold text-center">
        {formattedTime}
      </td>
      
      <td>
        {event.subbedIn.length > 0 ? (
          <div>
            {event.subbedIn.map((player, index) => (
              <Badge key={player.id} bg="success" className="me-1 mb-1">
                <i className="fas fa-arrow-right me-1" />
                #{player.number} {player.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted">None</span>
        )}
      </td>
      
      <td>
        {event.playersOut.length > 0 ? (
          <div>
            {event.playersOut.map((player, index) => (
              <Badge key={player.id} bg="warning" className="me-1 mb-1">
                <i className="fas fa-arrow-left me-1" />
                #{player.number} {player.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted">None</span>
        )}
      </td>
      
      <td>
        <ButtonGroup size="sm">
          <Button
            variant="outline-primary"
            onClick={handleEdit}
            title="Edit substitution"
          >
            <i className="fas fa-edit" />
          </Button>
          <Button
            variant="outline-danger"
            onClick={handleDelete}
            title="Delete substitution"
          >
            <i className="fas fa-trash" />
          </Button>
        </ButtonGroup>
      </td>
    </tr>
  );
});

SubstitutionEventRow.displayName = 'SubstitutionEventRow';

/**
 * Enhanced substitution history table with filtering and actions
 */
export const SubstitutionHistory: React.FC<SubstitutionHistoryProps> = ({ className }) => {
  const { game, currentPeriod } = useGameStore();
  const substitutionHistory = useSubstitutionHistory();
  const { substitutions } = useSubstitutions();
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  if (!game) {
    return (
      <Card className={className}>
        <Card.Body>
          <Card.Title>Substitution History</Card.Title>
          <div className="text-muted">No game loaded</div>
        </Card.Body>
      </Card>
    );
  }

  // Filter substitutions based on showAllPeriods setting
  const filteredSubstitutions = showAllPeriods 
    ? substitutionHistory 
    : substitutions.map(event => ({ ...event, periodNumber: currentPeriod + 1 }));

  const totalSubstitutions = substitutionHistory.length;
  const currentPeriodSubs = substitutions.length;

  return (
    <Card className={className}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Substitution History</h5>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="info">
            {showAllPeriods ? totalSubstitutions : currentPeriodSubs} Events
          </Badge>
          <Form.Check
            type="switch"
            id="show-all-periods"
            label="All Periods"
            checked={showAllPeriods}
            onChange={(e) => setShowAllPeriods(e.target.checked)}
          />
        </div>
      </Card.Header>

      <Card.Body className="p-0">
        {filteredSubstitutions.length === 0 ? (
          <div className="p-4 text-center text-muted">
            <i className="fas fa-exchange-alt fa-2x mb-3" />
            <div>No substitutions recorded</div>
            <small>
              {showAllPeriods 
                ? 'No substitutions in any period yet' 
                : `No substitutions in period ${currentPeriod + 1} yet`
              }
            </small>
          </div>
        ) : (
          <Table responsive striped hover className="mb-0">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Period</th>
                <th className="text-center" style={{ width: '100px' }}>Time</th>
                <th>Players In</th>
                <th>Players Out</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubstitutions.map((event) => (
                <SubstitutionEventRow
                  key={event.id}
                  event={event}
                  currentPeriod={currentPeriod}
                />
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      <Card.Footer className="text-muted small">
        <div className="d-flex justify-content-between align-items-center">
          <span>
            <i className="fas fa-info-circle me-1" />
            {showAllPeriods 
              ? `${totalSubstitutions} total substitutions across all periods`
              : `${currentPeriodSubs} substitutions in current period`
            }
          </span>
          
          {totalSubstitutions > 0 && (
            <span>
              <i className="fas fa-clock me-1" />
              Most recent: {gameService.formatTime(substitutionHistory[0]?.eventTime || 0)}
            </span>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
};