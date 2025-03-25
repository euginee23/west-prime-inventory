import React, { useState, useEffect } from "react";
import { Modal, Button, Card, Row, Col } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import ReactLoading from "react-loading";

const ReturnEquipmentModal = ({ show, onClose, equipment, handleClear }) => {
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [clientData, setClientData] = useState(null);

  useEffect(() => {
    if (show) {
      setTrackingCode(`RET-${Date.now()}`);
      fetchLastTransaction();
    }
  }, [show]);

  const fetchLastTransaction = async () => {
    if (!equipment) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/scanned-equipment-actions/last/${
          equipment.equipment_id
        }`
      );

      if (
        response.data &&
        response.data.transaction_type === "Check Out" &&
        response.data.status === "Checked Out"
      ) {
        setClientData(response.data);
        setTrackingCode(response.data.tracking_code);
      } else {
        setClientData(null);
        setTrackingCode(`RET-${Date.now()}`);
      }
    } catch (error) {
      console.error("Error fetching last transaction:", error);
      setClientData(null);
      setTrackingCode(`RET-${Date.now()}`);
    }
  };

  const handleReturnEquipment = async () => {
    if (!equipment) {
      toast.error("No equipment selected.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/scanned-equipment-actions/return/${equipment.equipment_id}`,
        {
          lab_id: equipment.laboratory?.lab_id || null,
          user_id: localStorage.getItem("user_id"),
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().split(" ")[0],
        }
      );

      toast.success("Equipment successfully returned!");
    } catch (error) {
      console.error("Error returning equipment:", error);
      toast.error("Failed to return equipment.");
    } finally {
      setLoading(false);
      setTimeout(() => {
        onClose();
        handleClear();
      }, 300);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="xl">
      <Modal.Header className="py-2 bg-dark text-white">
        <Modal.Title className="fs-6">🔄 Return Equipment</Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </Modal.Header>

      <Modal.Body className="p-3">
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "200px" }}
          >
            <ReactLoading type="spin" color="#007bff" height={50} width={50} />
          </div>
        ) : (
          <Row className="g-2">
            {/* Left Side - Equipment & Action Details */}
            <Col md={6} className="d-flex flex-column h-100">
              <Card className="shadow-sm p-2 bg-light">
                <h6 className="fw-bold mb-2">🔧 Equipment Details</h6>
                <div className="small">
                  {[
                    ["Equipment Name", equipment?.name],
                    ["Number", equipment?.number],
                    ["Type", equipment?.type],
                    ["Brand", equipment?.brand],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="shadow-sm p-2 mt-2 bg-light">
                <h6 className="fw-bold mb-2">🏫 Laboratory Information</h6>
                <div className="small">
                  {[
                    ["Lab Name", equipment?.laboratory?.lab_name],
                    ["Lab Number", equipment?.laboratory?.lab_number],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="shadow-sm p-2 mt-2 bg-light mb-2">
                <h6 className="fw-bold mb-2">🛠 Transaction Details</h6>
                <div className="small">
                  {[
                    ["Action", "Return Equipment"],
                    ["Tracking Code", trackingCode],
                    ["Date", new Date().toISOString().slice(0, 10)],
                    ["Status", "Available"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Right Side - Client Information */}
            <Col md={6}>
              <Card className="shadow-sm p-2 bg-light">
                <h6 className="fw-bold mb-2">👤 Client Information</h6>
                <div className="small">
                  {clientData ? (
                    [
                      ["First Name", clientData.first_name],
                      ["Middle Name", clientData.middle_name],
                      ["Last Name", clientData.last_name],
                      ["Contact Number", clientData.contact_number],
                      ["Email", clientData.email],
                      ["Address", clientData.address],
                      ["Type", clientData.client_type],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                      >
                        <strong>{label}:</strong> <span>{value || "N/A"}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No client data available.</p>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Modal.Body>

      <Modal.Footer className="py-2 bg-light">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={handleReturnEquipment}
          disabled={loading}
        >
          {loading ? (
            <ReactLoading type="spin" color="#fff" height={20} width={20} />
          ) : (
            "Return Equipment"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReturnEquipmentModal;
