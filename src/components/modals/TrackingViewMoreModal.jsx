import React from "react";
import { Modal, Button, Card, Row, Col } from "react-bootstrap";
import { FaTools, FaUser, FaBuilding, FaWrench } from "react-icons/fa";

const TrackingViewMoreModal = ({ show, onClose, action }) => {
  const isMaintenance = action?.tracking_code?.startsWith("MTN");

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
            {/* Left Column: Equipment Details */}
            <Col md={6}>
              <Card className="shadow-sm p-2 bg-light mb-2">
                <h6 className="fw-bold mb-2">
                  <FaTools className="me-2" /> Equipment:
                </h6>
                <div className="small">
                  {[
                    ["Equipment Name", action.equipment_name],
                    ["Equipment Number", action.number],
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

              {/* Display Technician if Maintenance (MTN) else Client (TRK) */}
              <Card className="shadow-sm p-2 bg-light">
                <h6 className="fw-bold mb-2">
                  {isMaintenance ? (
                    <>
                      <FaWrench className="me-2" /> Technician:
                    </>
                  ) : (
                    <>
                      <FaUser className="me-2" /> Client:
                    </>
                  )}
                </h6>
                <div className="small">
                  {(isMaintenance
                    ? [
                        ["Technician Name", action.technician_name],
                        ["Contact", action.technician_contact_number],
                        ["Shop Name", action.technician_shop_name],
                        ["Shop Address", action.technician_shop_address],
                      ]
                    : [
                        [
                          "Full Name",
                          `${action.client_first_name} ${
                            action.client_middle_name || ""
                          } ${action.client_last_name}`.trim(),
                        ],
                        ["Contact", action.client_contact],
                        ["Email", action.client_email],
                        ["Address", action.client_address],
                        ["Client Type", action.client_type],
                      ]
                  ).map(([label, value]) => (
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

            {/* Right Column: Lab & Transaction Details */}
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
                    action.tracking_code?.startsWith("TRK") &&
                    action.return_datetime
                      ? [
                          "Expected Return",
                          new Date(action.return_datetime).toLocaleString(),
                        ]
                      : null,
                    action.transaction_type === "Return Equipment" ||
                    action.latest_status === "Returned"
                      ? [
                          "Status",
                          <span className="text-success fw-bold">
                            ✅ Returned on{" "}
                            {action.return_datetime
                              ? new Date(action.latest_return_datetime).toLocaleString()
                              : "an unknown date"}
                          </span>,
                        ]
                      : action.tracking_code?.startsWith("TRK") &&
                        action.return_datetime
                      ? [
                          "Status",
                          new Date(action.return_datetime) < new Date() ? (
                            <span className="text-danger fw-bold">
                              ❌ Overdue, please contact equipment holder.
                            </span>
                          ) : (
                            <span className="text-success fw-bold">
                              ✅ Good, not yet overdue
                            </span>
                          ),
                        ]
                      : null,
                  ]
                    .filter(Boolean)
                    .map(([label, value]) => (
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
