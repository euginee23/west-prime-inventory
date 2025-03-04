import React from "react";
import { Modal, Button } from "react-bootstrap";

const ClientConfirmModal = ({ show, client, onConfirm, onCancel }) => {
  return (
    <Modal show={show} onHide={onCancel} centered size="md">
      {/* Styled Header */}
      <Modal.Header closeButton className="py-2 bg-dark text-white">
        <Modal.Title className="fs-6">⚠️ Client Already Exists</Modal.Title>
      </Modal.Header>

      {/* Styled Body */}
      <Modal.Body className="p-3 bg-light">
        <p className="mb-2">A client with these details already exists:</p>
        <ul className="mb-2 ps-3">
          <li>
            <strong>Name:</strong> {client?.first_name} {client?.last_name}
          </li>
          <li>
            <strong>Phone:</strong> {client?.contact_number}
          </li>
          <li>
            <strong>Email:</strong> {client?.email}
          </li>
        </ul>
        <p className="mb-2">Did you mean this client?</p>
      </Modal.Body>

      {/* Styled Footer */}
      <Modal.Footer className="py-2 bg-light">
        <Button variant="outline-secondary" size="sm" onClick={onCancel}>
          No, Cancel
        </Button>
        <Button variant="success" size="sm" onClick={onConfirm}>
          Yes, Use This Client
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClientConfirmModal;
