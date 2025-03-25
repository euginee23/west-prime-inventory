import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import ReactLoading from "react-loading";

const FinishRepairAndReturnModal = ({ show, onClose, equipment, handleClear }) => {
  const [loading, setLoading] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");

  const handleFinishAndReturn = async () => {
    if (!returnNotes.trim()) {
      toast.warn("Please enter return notes.", { position: "top-center" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/maintenance/finish-repair`,
        {
          equipment_id: equipment.equipment_id,
          return_notes: returnNotes,
        }
      );

      toast.success("Equipment successfully returned with notes!", { position: "top-center" });
      handleClear();
      onClose();
    } catch (error) {
      console.error("Error finishing repair and returning equipment:", error);
      toast.error("Failed to return equipment. Please try again.", { position: "top-center" });
    }
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header className="bg-success text-white">
        <Modal.Title className="fs-6">Finish Repair & Return Equipment</Modal.Title>
        <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose}></button>
      </Modal.Header>

      <Modal.Body>
        <p className="small">
          Are you sure you want to mark <strong>{equipment?.name}</strong> as repaired and return it to the laboratory?
        </p>

        <Form>
          <Form.Group controlId="returnNotes">
            <Form.Label className="small">Return Notes (Required)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter any notes about the repair..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
            />
          </Form.Group>
        </Form>

        {loading && (
          <div className="d-flex justify-content-center mt-3">
            <ReactLoading type="spin" color="#007bff" height={40} width={40} />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="success" size="sm" onClick={handleFinishAndReturn} disabled={loading}>
          Confirm & Return
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FinishRepairAndReturnModal;
