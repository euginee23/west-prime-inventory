import React, { useState, useEffect } from "react";
import { Modal, Button, Card, Row, Col } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import ReactLoading from "react-loading";

const MaintenanceAcceptedModal = ({ show, onClose, equipment, handleClear }) => {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [technicianData, setTechnicianData] = useState(null);
  const [previousMaintenance, setPreviousMaintenance] = useState(null);

  useEffect(() => {
    if (show) {
      fetchLastRepairTransaction();
    }
  }, [show]);

  const fetchLastRepairTransaction = async () => {
    if (!equipment) return;

    setLoading(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/scanned-equipment-actions/last/${
          equipment.equipment_id
        }`
      );

      if (response.data) {
        setTechnicianData({
          technician_name: response.data.technician_name || "N/A",
          contact_number: response.data.technician_contact_number || "N/A",
          shop_name: response.data.technician_shop_name || "N/A",
          shop_address: response.data.technician_shop_address || "N/A",
        });

        setTrackingCode(response.data.tracking_code || "N/A");

        setPreviousMaintenance({
          action: response.data.transaction_type || "N/A",
          tracking_code: response.data.tracking_code || "N/A",
          reason: response.data.reason || "N/A",
          date:
            response.data.date && !isNaN(Date.parse(response.data.date))
              ? new Date(response.data.date).toLocaleDateString()
              : "Invalid Date",
          time: response.data.time || "N/A",
          status: response.data.status || "N/A",
        });
      } else {
        setTechnicianData(null);
        setTrackingCode("N/A");
        setPreviousMaintenance(null);
      }
    } catch (error) {
      console.error("Error fetching last maintenance transaction:", error);
      setTechnicianData(null);
      setTrackingCode("N/A");
      setPreviousMaintenance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!equipment) {
      toast.error("No equipment selected.");
      return;
    }
  
    setConfirming(true);
  
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/maintenance/ongoing-repair`,
        { equipment_id: equipment.equipment_id }
      );
  
      toast.success(response.data.message);
  
      handleClear();  
      onClose();  
    } catch (error) {
      console.error("Error confirming maintenance:", error);
      toast.error("Failed to update maintenance status.");
    } finally {
      setConfirming(false);
    }
  };
  

  return (
    <Modal show={show} onHide={onClose} centered size="xl">
      <Modal.Header className="py-2 bg-secondary text-white">
        <Modal.Title className="fs-6">Maintenance Accepted</Modal.Title>
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
            {/* Left Side - Equipment Details */}
            <Col md={6} className="d-flex flex-column h-100">
              <Card className="shadow-sm p-2 bg-light">
                <h6 className="fw-bold mb-2">Equipment Details</h6>
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
                <h6 className="fw-bold mb-2">Laboratory Information</h6>
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
                <h6 className="fw-bold mb-2">Previous Maintenance Details</h6>
                <div className="small">
                  {previousMaintenance ? (
                    [
                      ["Action", previousMaintenance.action],
                      ["Tracking Code", previousMaintenance.tracking_code],
                      ["Reason", previousMaintenance.reason],
                      ["Date", previousMaintenance.date],
                      ["Time", previousMaintenance.time],
                      ["Status", previousMaintenance.status],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                      >
                        <strong>{label}:</strong> <span>{value || "N/A"}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">
                      No past maintenance data available.
                    </p>
                  )}
                </div>
              </Card>
            </Col>

            {/* Right Side - Technician Information */}
            <Col md={6}>
              <Card className="shadow-sm p-2 bg-light">
                <h6 className="fw-bold mb-2">Technician Details</h6>
                <div className="small">
                  {technicianData ? (
                    [
                      ["Technician Name", technicianData.technician_name],
                      ["Contact Number", technicianData.contact_number],
                      ["Shop Name", technicianData.shop_name],
                      ["Shop Address", technicianData.shop_address],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                      >
                        <strong>{label}:</strong> <span>{value || "N/A"}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No technician data available.</p>
                  )}
                </div>
              </Card>

              <Card className="shadow-sm p-2 mt-2 bg-light mb-2">
                <h6 className="fw-bold mb-2">Current Transaction</h6>
                <div className="small">
                  {[
                    ["Action", "Maintenance Accepted"],
                    ["Tracking Code", trackingCode],
                    ["Date", new Date().toISOString().slice(0, 10)],
                    ["Status", "Being Maintained"],
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
          </Row>
        )}
      </Modal.Body>

      <Modal.Footer className="py-2 bg-light">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={handleConfirm}
          disabled={confirming}
        >
          {confirming ? "Processing..." : "Confirm On-Going Repair"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MaintenanceAcceptedModal;
