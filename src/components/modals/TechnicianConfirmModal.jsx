import React from "react";
import { Modal, Button } from "react-bootstrap";

const TechnicianConfirmModal = ({ show, technician, onConfirm, onCancel }) => {
  return (
    <Modal show={show} onHide={onCancel} centered size="md">
      <Modal.Header closeButton className="py-2 bg-dark text-white">
        <Modal.Title className="fs-6">⚠️ Technician Already Exists</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3 bg-light">
        <p className="mb-2">A technician with similar details already exists:</p>
        <ul className="mb-2 ps-3">
          <li><strong>Name:</strong> {technician?.name}</li>
          <li><strong>Phone:</strong> {technician?.contact_number}</li>
          <li><strong>Shop:</strong> {technician?.shop_name}</li>
        </ul>
        <p className="mb-2">Would you like to use this technician?</p>
      </Modal.Body>

      <Modal.Footer className="py-2 bg-light">
        <Button variant="outline-secondary" size="sm" onClick={onCancel}>
          No, Cancel
        </Button>
        <Button variant="success" size="sm" onClick={onConfirm}>
          Yes, Use Technician
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TechnicianConfirmModal;
