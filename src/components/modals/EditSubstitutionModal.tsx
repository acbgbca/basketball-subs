import React from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

interface EditSubstitutionModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editForm: { timeIn: number; timeOut: number };
  setEditForm: (form: { timeIn: number; timeOut: number }) => void;
}

const EditSubstitutionModal: React.FC<EditSubstitutionModalProps> = ({
  show,
  onHide,
  onSubmit,
  editForm,
  setEditForm
}) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Edit Substitution</Modal.Title>
    </Modal.Header>
    <Form onSubmit={onSubmit}>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Time In (seconds remaining)</Form.Label>
          <Form.Control
            type="number"
            value={editForm.timeIn}
            onChange={e => setEditForm({ ...editForm, timeIn: Number(e.target.value) })}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Time Out (seconds remaining)</Form.Label>
          <Form.Control
            type="number"
            value={editForm.timeOut}
            onChange={e => setEditForm({ ...editForm, timeOut: Number(e.target.value) })}
            required
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </Modal.Footer>
    </Form>
  </Modal>
);

export default EditSubstitutionModal;
