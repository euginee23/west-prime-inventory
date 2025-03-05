import React, { useEffect, useState } from "react";
import { Modal, Button, Card, Row, Col } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { FaClipboardList } from "react-icons/fa";
import TrackingTimelineModal from "./TrackingTimelineModal";
import TrackingViewMoreModal from "./TrackingViewMoreModal";

const ViewTrackedEquipmentModal = ({ show, onClose, trackingCode }) => {
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  useEffect(() => {
    if (show && trackingCode) {
      fetchTrackingData();
    }
  }, [show, trackingCode]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/scanned-equipment-actions/${trackingCode}`
      );
      setAction(response.data);
    } catch (error) {
      console.error("Error fetching tracked equipment:", error);
      toast.error("Failed to fetch tracking data.");
      setAction(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onClose} centered size="lg">
        <Modal.Header className="py-2 bg-dark text-white">
          <Modal.Title className="fs-6">
            <FaClipboardList className="me-2" /> Tracking Details
          </Modal.Title>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </Modal.Header>

        <Modal.Body className="p-3">
          {loading ? (
            <div className="text-center py-3">
              <span className="spinner-border text-primary"></span>
            </div>
          ) : action ? (
            <Row className="g-2">
              {/* Left Column: Tracking History */}
              <Col md={12}>
                <Card className="shadow-sm p-2 bg-light">
                  <h6 className="fw-bold mb-2">📍 Timeline</h6>
                  <TrackingTimelineModal trackingCode={trackingCode} />
                </Card>
              </Col>
            </Row>
          ) : (
            <p className="text-center text-muted">
              No data found for this tracking code.
            </p>
          )}
        </Modal.Body>

        {/* Footer with Close & More Info Button */}
        <Modal.Footer className="py-2 bg-light d-flex justify-content-between">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={() => setShowMoreInfo(true)}
          >
            More Info
          </Button>
        </Modal.Footer>
      </Modal>

      {/* More Info Modal */}
      <TrackingViewMoreModal
        show={showMoreInfo}
        onClose={() => setShowMoreInfo(false)}
        action={action}
      />
    </>
  );
};

export default ViewTrackedEquipmentModal;
