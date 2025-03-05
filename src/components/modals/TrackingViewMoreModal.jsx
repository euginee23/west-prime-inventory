import React from "react";
import { Modal, Button, Card, Row, Col } from "react-bootstrap";
import { FaTools, FaUser, FaBuilding } from "react-icons/fa";

const TrackingViewMoreModal = ({ show, onClose, action }) => {
  return (
    <Modal show={show} onHide={onClose} centered size="xl">
      <Modal.Header className="py-2 bg-dark text-white">
        <Modal.Title className="fs-6">📋 Full Equipment Details</Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </Modal.Header>

      <Modal.Body className="p-3">
        {action ? (
          <Row className="g-2">
            {/* Left Column: Equipment & Client */}
            <Col md={6}>
              <Card className="shadow-sm p-2 bg-light mb-2">
                <h6 className="fw-bold mb-2">
                  <FaTools className="me-2" /> Equipment:
                </h6>
                <div className="small">
                  {[
                    ["Equipment Name", action.equipment_name],
                    ["Type", action.type],
                    ["Brand", action.brand],
                    ["Status", action.operational_status],
                    ["Availability", action.availability_status],
                    ["Description", action.description],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="shadow-sm p-2 bg-light">
                <h6 className="fw-bold mb-2">
                  <FaUser className="me-2" /> Client:
                </h6>
                <div className="small">
                  {[
                    [
                      "Full Name",
                      `${action.client_first_name} ${
                        action.client_middle_name || ""
                      } ${action.client_last_name}`.trim(),
                    ],
                    ["Contact", action.client_contact],
                    ["Email", action.client_email],
                    ["Client Type", action.client_type],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Right Column: Lab & Personnel */}
            <Col md={6}>
              <Card className="shadow-sm p-2 bg-light mb-2">
                <h6 className="fw-bold mb-2">
                  <FaBuilding className="me-2" /> Laboratory Location:
                </h6>
                <div className="small">
                  {[
                    ["Lab Name", action.lab_name],
                    ["Lab Number", action.lab_number],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="shadow-sm p-2 bg-light mb-2">
                <h6 className="fw-bold mb-2">📍 Transaction Overview</h6>
                <div className="small">
                  {[
                    ["Tracking Code", action.tracking_code],
                    ["Transaction Type", action.transaction_type],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          <p className="text-center text-muted">No data found.</p>
        )}
      </Modal.Body>

      <Modal.Footer className="py-2 bg-light">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TrackingViewMoreModal;
