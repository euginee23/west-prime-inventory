import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import ReactLoading from "react-loading";

const MarkAsLostModal = ({ show, onClose, equipment, handleClear }) => {
  const [loading, setLoading] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const handleMarkAsLost = async () => {
    if (!lostReason.trim()) {
      toast.warn("Please enter a reason for marking as lost.", {
        position: "top-center",
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/${
          equipment.equipment_id
        }/mark-lost`,
        { lostReason } 
      );

      toast.success("Equipment marked as lost!", {
        position: "top-center",
      });
      handleClear();
      onClose();
    } catch (error) {
      console.error("Error marking equipment as lost:", error);
      toast.error("Failed to process the request. Please try again.", {
        position: "top-center",
      });
    }
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header className="bg-warning text-white">
        <Modal.Title className="fs-6">Mark Equipment as Lost</Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </Modal.Header>

      <Modal.Body>
        <p className="small">
          Are you sure the equipment <strong>{equipment?.name}</strong> is lost?
          This action will update its status to <strong>Lost</strong>.
        </p>

        <Form>
          <Form.Group controlId="lostReason">
            <Form.Label className="small">
              Reason for Loss (Required)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter the reason for marking this equipment as lost..."
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
            />
          </Form.Group>
        </Form>

        {loading && (
          <div className="d-flex justify-content-center mt-3">
            <ReactLoading type="spin" color="#ffc107" height={40} width={40} />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="warning"
          size="sm"
          onClick={handleMarkAsLost}
          disabled={loading}
        >
          Confirm as Lost
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MarkAsLostModal;
