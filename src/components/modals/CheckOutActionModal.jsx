import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Card, Row, Col } from "react-bootstrap";
import "react-confirm-alert/src/react-confirm-alert.css";
import axios from "axios";
import { toast } from "react-toastify";
import ClientConfirmModal from "./ClientConfirmModal";
import ReactLoading from "react-loading";

const CheckOutActionModal = ({
  show,
  onClose,
  actionReason,
  equipment,
  handleClear,
}) => {
  const [clientData, setClientData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    email: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [matchedClient, setMatchedClient] = useState(null);
  const [resolveConfirm, setResolveConfirm] = useState(null);

  const [showClientConfirm, setShowClientConfirm] = useState(false);

  const [clientType, setClientType] = useState("Student");

  const handleSearchClick = async () => {
    if (searchQuery.length < 2) {
      toast.warn("Enter at least 2 characters to search.");
      return;
    }
  
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/clients/search`,
        {
          params: { query: searchQuery },
        }
      );
  
      setFilteredClients(response.data.clients || []);
      setShowDropdown(response.data.clients.length > 0);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients.");
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };  

  const handleSelectClient = (client) => {
    setClientData({ ...client, client_id: client.client_id });
    setSearchQuery(`${client.first_name} ${client.last_name}`);
    setShowDropdown(false);
  };

  useEffect(() => {
    if (show) {
      setTrackingCode(`TRK-${Date.now()}`);
    }
  }, [show]);

  const handleInputChange = (e) => {
    setClientData({ ...clientData, [e.target.name]: e.target.value });
  };

  const checkExistingClient = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/clients/search`,
        {
          params: {
            query:
              clientData.contact_number ||
              clientData.email ||
              `${clientData.first_name} ${clientData.last_name}`,
          },
        }
      );

      const existingClients = response.data.clients || [];

      if (existingClients.length > 0) {
        const matchedClient = existingClients[0];

        const isExactMatch =
          matchedClient.first_name === clientData.first_name &&
          matchedClient.middle_name === clientData.middle_name &&
          matchedClient.last_name === clientData.last_name &&
          matchedClient.contact_number === clientData.contact_number &&
          matchedClient.email === clientData.email &&
          matchedClient.address === clientData.address;

        if (isExactMatch) {
          return matchedClient.client_id;
        }

        setMatchedClient(matchedClient);
        setShowClientConfirm(true);

        return new Promise((resolve) => {
          setResolveConfirm(() => resolve);
        });
      }

      return undefined;
    } catch (error) {
      console.error("Error checking existing client:", error);
      return undefined;
    }
  };

  const handleSubmit = async () => {
    if (!equipment || !actionReason) {
      toast.error("No equipment or action selected.");
      return;
    }

    if (
      !clientData.first_name ||
      !clientData.last_name ||
      !clientData.contact_number
    ) {
      toast.warn("Please fill in required client details.");
      return;
    }

    setLoading(true);

    try {
      let clientId = clientData.client_id;

      const existingClientId = await checkExistingClient();

      if (existingClientId instanceof Promise) {
        clientId = await existingClientId;
      } else {
        clientId = existingClientId;
      }

      if (!clientId) {
        clientId = "new";
      }

      const status = "Checked Out";

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/${
          equipment.equipment_id
        }/status`,
        { status }
      );

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/scanned-equipment-actions`,
        {
          equipment_id: equipment.equipment_id,
          lab_id: equipment.laboratory?.lab_id || null,
          user_id: localStorage.getItem("user_id"),
          client: { ...clientData, client_type: clientType },
          tracking_code: trackingCode,
          reason: actionReason,
          date: new Date().toISOString().slice(0, 10),
          status,
        }
      );

      toast.success(
        "Action successfully recorded and equipment status updated!"
      );
    } catch (error) {
      console.error("Error saving action:", error);
      toast.error("Failed to record action.");
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
        <Modal.Title className="fs-6">📋 Check Out Equipment</Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </Modal.Header>

      <Modal.Body className="p-3">
        {loading ? (
          <div className="d-flex justify-content-center py-4">
            <ReactLoading type="spin" color="#007bff" height={50} width={50} />
          </div>
        ) : (
          <Row className="g-2">
            {/* Left Side - Equipment & Action Details */}
            <Col md={6} className="d-flex flex-column h-100">
              <Card className="shadow-sm p-2 bg-light">
                <h6 className="fw-bold mb-2" style={{ textAlign: "center" }}>
                  Equipment Details
                </h6>
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
                <h6 className="fw-bold mb-2" style={{ textAlign: "center" }}>
                  Laboratory Information
                </h6>
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
                <h6 className="fw-bold mb-2" style={{ textAlign: "center" }}>
                  Transaction Details
                </h6>
                <div className="small">
                  {[
                    ["Action", actionReason],
                    ["Tracking Code", trackingCode],
                    ["Date", new Date().toISOString().slice(0, 10)],
                    [
                      "Status",
                      actionReason.includes("Borrowed") ||
                      actionReason.includes("Taken")
                        ? "Checked Out"
                        : "Pending",
                    ],
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
                <h6 className="fw-bold mb-2" style={{ textAlign: "center" }}>
                  Client Information
                </h6>
                <div className="small">
                  {/* Search Field for Existing Clients */}
                  <Form.Group className="mb-2 position-relative">
                    <Form.Label className="fw-bold small d-block"> </Form.Label>
                    <div className="input-group input-group-sm">
                      <Form.Control
                        type="text"
                        placeholder="Enter name, email, or contact number"
                        className="form-control form-control-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSearchClick} 
                      >
                        Search
                      </Button>
                    </div>

                    {/* Dropdown for Search Results */}
                    {showDropdown && (
                      <div
                        className="dropdown-menu show w-100 shadow-sm"
                        style={{ maxHeight: "150px", overflowY: "auto" }}
                      >
                        {filteredClients.map((client, index) => (
                          <button
                            key={index}
                            className="dropdown-item small"
                            onClick={() => handleSelectClient(client)}
                          >
                            {client.first_name} {client.last_name} -{" "}
                            {client.contact_number}
                          </button>
                        ))}
                      </div>
                    )}
                  </Form.Group>

                  {/* Client Information Form */}
                  <Form>
                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold small">
                        First Name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={clientData.first_name}
                        onChange={handleInputChange}
                        required
                        size="sm"
                      />
                    </Form.Group>

                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold small">
                        Middle Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="middle_name"
                        value={clientData.middle_name}
                        onChange={handleInputChange}
                        size="sm"
                      />
                    </Form.Group>

                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold small">
                        Last Name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={clientData.last_name}
                        onChange={handleInputChange}
                        required
                        size="sm"
                      />
                    </Form.Group>

                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold small">
                        Contact Number *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="contact_number"
                        value={clientData.contact_number}
                        onChange={handleInputChange}
                        required
                        size="sm"
                      />
                    </Form.Group>

                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold small">Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={clientData.email}
                        onChange={handleInputChange}
                        size="sm"
                      />
                    </Form.Group>

                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold small">
                        Client Type *
                      </Form.Label>
                      <Form.Select
                        size="sm"
                        value={clientType}
                        onChange={(e) => setClientType(e.target.value)}
                      >
                        <option value="Student">Student</option>
                        <option value="Instructor">Instructor</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-1">
                      <Form.Label className="fw-bold small">Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="address"
                        value={clientData.address}
                        onChange={handleInputChange}
                        size="sm"
                        rows={5}
                      />
                    </Form.Group>
                  </Form>
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
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ReactLoading type="spin" color="#fff" height={20} width={20} />
          ) : (
            "Confirm"
          )}
        </Button>
      </Modal.Footer>

      <ClientConfirmModal
        show={showClientConfirm}
        client={matchedClient}
        onCancel={() => {
          setShowClientConfirm(false);
          if (resolveConfirm) {
            resolveConfirm(undefined);
            setResolveConfirm(null);
          }
        }}
        onConfirm={() => {
          setClientData(matchedClient);
          setShowClientConfirm(false);
          if (resolveConfirm) {
            resolveConfirm(matchedClient.client_id);
            setResolveConfirm(null);
          }
        }}
      />
    </Modal>
  );
};

export default CheckOutActionModal;
