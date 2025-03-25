import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import ReactLoading from "react-loading";

const RepairFailedReturnModal = ({ show, onClose, equipment, handleClear }) => {
  const [loading, setLoading] = useState(false);
  const [failureReason, setFailureReason] = useState("");

  const handleRepairFailed = async () => {
    if (!failureReason.trim()) {
      toast.warn("Please enter a reason for repair failure.", { position: "top-center" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/maintenance/repair-failed-return`,
        {
          equipment_id: equipment.equipment_id,
          failure_reason: failureReason,
        }
      );

      toast.success("Repair marked as failed & equipment returned!", { position: "top-center" });
      handleClear();
      onClose();
    } catch (error) {
      console.error("Error marking repair as failed:", error);
      toast.error("Failed to process the request. Please try again.", { position: "top-center" });
    }
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header className="bg-danger text-white">
        <Modal.Title className="fs-6">Repair Failed & Return Equipment</Modal.Title>
        <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose}></button>
      </Modal.Header>

      <Modal.Body>
        <p className="small">
          Are you sure the repair attempt for <strong>{equipment?.name}</strong> has failed? Enter the reason and confirm the return to the laboratory.
        </p>

        <Form>
          <Form.Group controlId="failureReason">
            <Form.Label className="small">Failure Reason (Required)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter the reason for repair failure..."
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
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
        <Button variant="danger" size="sm" onClick={handleRepairFailed} disabled={loading}>
          Confirm Repair Failure & Return
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RepairFailedReturnModal;