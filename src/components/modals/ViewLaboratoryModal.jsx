import React, { useEffect, useState } from "react";
import { Modal, Button, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";

function ViewLaboratoryModal({ show, onClose, laboratory, setActiveSection }) {
  if (!laboratory) return null;

  const [assignedPersonnel, setAssignedPersonnel] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersonnelIndex, setCurrentPersonnelIndex] = useState(0);

  useEffect(() => {
    if (laboratory?.lab_id) {
      fetchAssignedPersonnel();
    }
  }, [laboratory?.lab_id]);

  const fetchAssignedPersonnel = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/personnel_designations/laboratory/${laboratory.lab_id}`
      );
      setAssignedPersonnel(response.data.data || []);
      setCurrentPersonnelIndex(0);
    } catch (error) {
      console.error("Error fetching assigned personnel:", error);
      setAssignedPersonnel([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentPersonnelIndex((prev) =>
      prev < assignedPersonnel.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrev = () => {
    setCurrentPersonnelIndex((prev) =>
      prev > 0 ? prev - 1 : assignedPersonnel.length - 1
    );
  };

  return (
    <Modal show={show} onHide={onClose} centered size="md">
      <Modal.Header className="py-2 bg-dark text-white">
        <Modal.Title className="fs-6">Laboratory Details</Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onClose}
        ></button>
      </Modal.Header>

      <Modal.Body className="p-3">
        {/* Laboratory Info */}
        <Card className="shadow-sm p-3 border rounded mb-3">
          <h6 className="fw-bold text-primary mb-2">Laboratory Information</h6>
          <hr className="mb-2 mt-1 border-top border-secondary" />
          <Row className="g-2 small">
            <Col xs={5}>
              <strong>Lab Name:</strong>
            </Col>
            <Col xs={7} className="text-end">
              {laboratory.lab_name}
            </Col>

            <Col xs={5}>
              <strong>Lab Number:</strong>
            </Col>
            <Col xs={7} className="text-end">
              #{laboratory.lab_number}
            </Col>
          </Row>
        </Card>

        {/* Assigned Personnel Section */}
        <Card className="shadow-sm p-3 border rounded">
          <h6 className="fw-bold text-primary mb-3">Assigned Personnel</h6>

          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center py-3">
              <Spinner animation="border" size="sm" variant="primary" />
            </div>
          ) : assignedPersonnel.length > 0 ? (
            <div className="p-3 border rounded bg-light">
              <Row className="mb-2 small">
                <Col xs={5}>
                  <strong>Personnel Name:</strong>
                </Col>
                <Col xs={7} className="text-end">
                  {assignedPersonnel[currentPersonnelIndex].first_name}{" "}
                  {assignedPersonnel[currentPersonnelIndex].last_name}
                </Col>
              </Row>

              <Row className="mb-2 small">
                <Col xs={5}>
                  <strong>Assigned Date:</strong>
                </Col>
                <Col xs={7} className="text-end">
                  {new Date(
                    assignedPersonnel[currentPersonnelIndex].created_at
                  ).toLocaleDateString()}
                </Col>
              </Row>

              <Row className="mb-2 small">
                <Col xs={5}>
                  <strong>Status:</strong>
                </Col>
                <Col xs={7} className="text-end">
                  <span
                    className={`badge ${
                      assignedPersonnel[currentPersonnelIndex].status ===
                      "Active"
                        ? "bg-success"
                        : "bg-secondary"
                    }`}
                  >
                    {assignedPersonnel[currentPersonnelIndex].status}
                  </span>
                </Col>
              </Row>

              {/* If Inactive, Show Message to Assign New Personnel */}
              {assignedPersonnel[currentPersonnelIndex].status ===
                "Inactive" && (
                <Alert variant="warning" className="text-center small mt-2">
                  Assigned personnel is currently inactive.
                  <br />
                  <button
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => {
                      setActiveSection("personnels");
                      onClose();
                    }}
                  >
                    ➡️ Go to Personnel Page to Assign New Personnel
                  </button>
                </Alert>
              )}
              <hr className="my-3 border-top border-secondary" />
              {/* Navigation Buttons */}
              {assignedPersonnel.length > 1 && (
                <div className="d-flex justify-content-between mt-3">
                  <Button
                    variant="success"
                    className="rounded-square"
                    style={{ width: "40px", height: "40px" }}
                    onClick={handlePrev}
                  >
                    <FaChevronLeft />
                  </Button>
                  <Row className="mt-2 small text-center">
                    <Col xs={13} className="fw-bold">
                      Personnel {currentPersonnelIndex + 1} of{" "}
                      {assignedPersonnel.length}
                    </Col>
                  </Row>
                  <Button
                    variant="success"
                    className="rounded-square"
                    style={{ width: "40px", height: "40px" }}
                    onClick={handleNext}
                  >
                    <FaChevronRight />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Alert variant="warning" className="text-center small">
              No personnel assigned to this laboratory.
              <br />
              <button
                className="btn btn-sm btn-primary mt-2"
                onClick={() => {
                  setActiveSection("personnels");
                  onClose();
                }}
              >
                ➡️ Go to Personnel Page to Assign
              </button>
            </Alert>
          )}
        </Card>
      </Modal.Body>

      <Modal.Footer className="py-2 bg-light">
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ViewLaboratoryModal;
