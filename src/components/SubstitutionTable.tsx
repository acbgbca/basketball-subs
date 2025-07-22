
import React from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import type { Game, SubstitutionEvent } from '../types';

interface SubstitutionTableProps {
  game: Game;
  currentPeriod: number;
  showAllPeriods: boolean;
  onShowAllPeriodsChange: (checked: boolean) => void;
  formatTime: (seconds: number) => string;
  onEditEvent: (event: SubstitutionEvent) => void;
  onDeleteEvent: (event: SubstitutionEvent) => void;
}

const SubstitutionTable: React.FC<SubstitutionTableProps> = ({
  game,
  currentPeriod,
  showAllPeriods,
  onShowAllPeriodsChange,
  formatTime,
  onEditEvent,
  onDeleteEvent
}) => {
  return (
    <>
      <h4>Substitution Events</h4>
      <Form.Check
        type="switch"
        id="show-all-periods"
        label="Show all periods"
        checked={showAllPeriods}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onShowAllPeriodsChange(e.target.checked)}
        className="mb-3"
      />
      <Table striped bordered>
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>Subbed In</th>
            <th>Subbed Out</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {game.periods
            .slice(showAllPeriods ? 0 : currentPeriod, showAllPeriods ? undefined : currentPeriod + 1)
            .sort((a, b) => b.periodNumber - a.periodNumber)
            .map(period => (
              period.subEvents && period.subEvents.length > 0 ?
                [...period.subEvents]
                  .sort((a, b) => a.eventTime - b.eventTime)
                  .map((event, idx) => (
                    <tr key={event.id}>
                      <td>{period.periodNumber}</td>
                      <td>{formatTime(event.eventTime)}</td>
                      <td>{event.subbedIn.map(p => p.name).join(', ')}</td>
                      <td>{event.playersOut.map(p => p.name).join(', ')}</td>
                      <td>
                        {idx === 0 && (
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => onEditEvent(event)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => onDeleteEvent(event)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                : null
            ))}
        </tbody>
      </Table>
    </>
  );
};

export default SubstitutionTable;
