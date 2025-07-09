import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface EndPeriodModalProps {
  show: boolean;
  onHide: () => void;
  onEndPeriod: () => void;
  currentPeriod: number;
  activePlayersCount: number;
}

const EndPeriodModal: React.FC<EndPeriodModalProps> = ({
  show,
  onHide,
  onEndPeriod,
  currentPeriod,
  activePlayersCount
}) => (
  <Modal show={show} onHide={onHide} data-testid="end-period-modal">
    <Modal.Header closeButton>
      <Modal.Title>End Period Confirmation</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Are you sure you want to end Period {currentPeriod + 1}?
      {activePlayersCount > 0 && ` ${activePlayersCount} player(s) will be subbed out.`}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Cancel
      </Button>
      <Button variant="warning" onClick={onEndPeriod}>
        End Period
      </Button>
    </Modal.Footer>
  </Modal>
);

export default EndPeriodModal;
