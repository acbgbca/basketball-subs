import React from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { Game, Substitution } from '../types';

interface SubstitutionTableProps {
  game: Game;
  currentPeriod: number;
  showAllPeriods: boolean;
  onShowAllPeriodsChange: (checked: boolean) => void;
  formatTime: (seconds: number) => string;
  onEditSub: (sub: Substitution) => void;
  onDeleteSub: (sub: Substitution) => void;
  editForm: { timeIn: number; timeOut: number };
  setEditForm: (form: { timeIn: number; timeOut: number }) => void;
}

const SubstitutionTable: React.FC<SubstitutionTableProps> = ({
  game,
  currentPeriod,
  showAllPeriods,
  onShowAllPeriodsChange,
  formatTime,
  onEditSub,
  onDeleteSub
}) => (
  <>
    <h4>Substitutions</h4>
    <Form.Check
      type="switch"
      id="show-all-periods"
      label="Show all periods"
      checked={showAllPeriods}
      onChange={e => onShowAllPeriodsChange(e.target.checked)}
      className="mb-3"
    />
    <Table striped bordered>
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Time In</th>
          <th>Time Out</th>
          <th>Played</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {game.periods
          .slice(showAllPeriods ? 0 : currentPeriod, showAllPeriods ? undefined : currentPeriod + 1)
          .sort((a, b) => b.periodNumber - a.periodNumber)
          .map(period => (
            period.substitutions
              .sort((a, b) => a.timeIn - b.timeIn)
              .map(sub => (
                <tr key={sub.id}>
                  <td>{period.periodNumber}</td>
                  <td>{sub.player.name}</td>
                  <td>{formatTime(sub.timeIn)}</td>
                  <td>{sub.timeOut || sub.timeOut === 0 ? formatTime(sub.timeOut) : 'Active'}</td>
                  <td>{sub.secondsPlayed ? formatTime(sub.secondsPlayed) : '-'}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => onEditSub(sub)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onDeleteSub(sub)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
          ))}
      </tbody>
    </Table>
  </>
);

export default SubstitutionTable;
