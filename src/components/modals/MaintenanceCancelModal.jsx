import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import ReactLoading from "react-loading";

const MaintenanceCancelledModal = ({ show, onClose, equipment, handleClear }) => {
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleCancelMaintenance = async () => {
    if (!cancelReason.trim()) {
      toast.warn("Please enter a reason for cancellation.", { position: "top-center" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/maintenance/cancel-return`,
        {
          equipment_id: equipment.equipment_id,
          cancel_reason: cancelReason,
        }
      );

      toast.success("Maintenance cancelled & equipment returned!", { position: "top-center" });
      handleClear();
      onClose();
    } catch (error) {
      console.error("Error cancelling maintenance:", error);
      toast.error("Failed to process cancellation. Please try again.", { position: "top-center" });
    }
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header className="bg-danger text-white">
        <Modal.Title className="fs-6">Cancel Maintenance & Return Equipment</Modal.Title>
        <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose}></button>
      </Modal.Header>

      <Modal.Body>
        <p className="small">
          Are you sure you want to cancel the maintenance process for <strong>{equipment?.name}</strong> and return it to the laboratory?
        </p>

        <Form>
          <Form.Group controlId="cancelReason">
            <Form.Label className="small">Cancellation Reason (Required)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter the reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Group>
        </Form>

        {loading && (
          <div className="d-flex justify-content-center mt-3">
            <ReactLoading type="spin" color="#dc3545" height={40} width={40} />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={handleCancelMaintenance} disabled={loading}>
          Confirm Cancellation
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MaintenanceCancelledModal;