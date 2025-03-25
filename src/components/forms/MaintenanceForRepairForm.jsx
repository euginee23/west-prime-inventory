import React, { useState, useRef, useEffect } from "react";
import { Card, Col, Form, Row, Button } from "react-bootstrap";

const MaintenanceForRepairForm = ({
  actionReason, 
  equipment,
  repairInfo,
  handleRepairInfoChange,
  searchQuery,
  setSearchQuery,
  handleTechnicianSearch,
  filteredTechnicians,
  showDropdown,
  setShowDropdown,
  handleSelectTechnician,
}) => {
  const [contactError, setContactError] = useState("");

  const handleNumberInput = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) {
      setContactError("Contact number must be 11 digits only.");
    } else {
      setContactError("");
    }

    handleRepairInfoChange({
      target: {
        name: e.target.name,
        value,
      },
    });
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const [trackingCode] = useState(`MTN-${Date.now()}`);
  const currentDate = new Date().toISOString().slice(0, 10);

  return (
    <Row className="g-3">
      {/* Equipment Info */}
      <Col md={6}>
        <Card className="p-3 bg-light shadow-sm h-100">
          <h6 className="fw-bold text-center mb-2">Equipment Info</h6>
          <div className="small">
            {[
              ["Name", equipment?.name],
              ["Number", equipment?.number],
              ["Type", equipment?.type],
              ["Brand", equipment?.brand],
            ].map(([label, value]) => (
              <div
                key={label}
                className="d-flex justify-content-between border-bottom py-1"
              >
                <span className="text-muted">{label}</span>
                <strong>{value || "N/A"}</strong>
              </div>
            ))}
          </div>
        </Card>
      </Col>

      {/* Laboratory Info */}
      <Col md={6}>
        <Card className="p-3 bg-light shadow-sm h-100">
          <h6 className="fw-bold text-center mb-2">Laboratory Info</h6>
          <div className="small">
            {[
              ["Lab Name", equipment?.laboratory?.lab_name],
              ["Lab Number", equipment?.laboratory?.lab_number],
            ].map(([label, value]) => (
              <div
                key={label}
                className="d-flex justify-content-between border-bottom py-1"
              >
                <span className="text-muted">{label}</span>
                <strong>{value || "N/A"}</strong>
              </div>
            ))}
          </div>
        </Card>
      </Col>

      {/* Maintenance Request Info */}
      <Col xs={12}>
        <Card className="p-3 bg-light shadow-sm">
          <h6 className="fw-bold text-center mb-2">
            {actionReason} Request Info
          </h6>{" "}
          <div className="small">
            {[
              ["Purpose", actionReason], 
              ["Tracking Code", trackingCode],
              ["Requested Date", currentDate],
              ["Status", "Pending"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="d-flex justify-content-between border-bottom py-1"
              >
                <span className="text-muted">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </Col>

      {/* Technician Info */}
      <Col xs={12}>
        <Card className="p-3 bg-light shadow-sm">
          <h6 className="fw-bold mb-3 text-center">Technician Info</h6>

          {/* Technician Search Bar */}
          <Form.Group className="mb-3 position-relative" ref={dropdownRef}>
            <div className="input-group input-group-sm">
              <Form.Control
                type="text"
                placeholder="Search by name, contact, or shop"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleTechnicianSearch}
              >
                Search
              </Button>
            </div>

            <hr />
            {showDropdown && (
              <div
                className="dropdown-menu show w-100 shadow-sm"
                style={{ maxHeight: "150px", overflowY: "auto", zIndex: 10 }}
              >
                {filteredTechnicians.length > 0 ? (
                  filteredTechnicians.map((tech) => (
                    <button
                      key={tech.technician_id}
                      className="dropdown-item small text-start"
                      onClick={() => handleSelectTechnician(tech)}
                    >
                      <div>
                        <strong>{tech.name}</strong> - {tech.contact_number}
                      </div>
                      <div className="small text-muted">{tech.shop_name}</div>{" "}
                    </button>
                  ))
                ) : (
                  <div className="dropdown-item text-muted small">
                    No technician found
                  </div>
                )}
              </div>
            )}
          </Form.Group>

          {/* Technician Fields */}
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small mb-1">Technician Name</Form.Label>
                <Form.Control
                  type="text"
                  name="technician_name"
                  size="sm"
                  value={repairInfo.technician_name}
                  onChange={handleRepairInfoChange}
                  placeholder="Enter technician name"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small mb-1">Contact Number</Form.Label>
                <Form.Control
                  type="text"
                  name="contact_number"
                  size="sm"
                  value={repairInfo.contact_number}
                  onChange={handleNumberInput}
                  placeholder="11-digit contact number"
                  maxLength={11}
                />
                {contactError && (
                  <small className="text-danger">{contactError}</small>
                )}
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small mb-1">Repair Shop Name</Form.Label>
                <Form.Control
                  type="text"
                  name="shop_name"
                  size="sm"
                  value={repairInfo.shop_name}
                  onChange={handleRepairInfoChange}
                  placeholder="Enter shop name"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="small mb-1">Shop Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  name="shop_address"
                  size="sm"
                  value={repairInfo.shop_address}
                  onChange={handleRepairInfoChange}
                  placeholder="Enter shop address"
                />
              </Form.Group>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default MaintenanceForRepairForm;
