import React from "react";
import { Modal, Button } from "react-bootstrap";

const PreventLostActionsModal = ({ show, onClose }) => {
  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header className="bg-danger text-white py-2">
        <Modal.Title className="fs-6">Action Not Allowed</Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </Modal.Header>

      <Modal.Body>
        <p className="small mb-0">
          This equipment is marked as <strong>Lost</strong> and no actions can be performed.
        </p>
      </Modal.Body>

      <Modal.Footer className="py-2">
        <Button variant="danger" size="sm" onClick={onClose}>
          Okay
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PreventLostActionsModal;
