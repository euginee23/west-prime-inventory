import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  InputGroup,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaKey,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";

const ViewPersonnelModal = ({ show, onClose, personnel, onSave }) => {
  if (!personnel) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editedPersonnel, setEditedPersonnel] = useState({
    ...personnel,
    new_password: "",
  });

  const [laboratories, setLaboratories] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemovingAssignment, setIsRemovingAssignment] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const [assignmentHistory, setAssignmentHistory] = useState([]);

  const [isLoadingDesignation, setIsLoadingDesignation] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingLaboratories, setIsLoadingLaboratories] = useState(false);

  useEffect(() => {
    fetchLaboratories();
  }, []);

  useEffect(() => {
    if (personnel?.user_id) {
      fetchDesignation();
    } else {
      setDesignation(null);
    }
  }, [personnel?.user_id]);

  useEffect(() => {
    if (isEditing) {
      setEditedPersonnel({ ...personnel, new_password: "" });
    }
  }, [isEditing, personnel]);

  useEffect(() => {
    if (personnel?.user_id) {
      fetchDesignation();
      fetchAssignmentHistory();
    } else {
      setDesignation(null);
      setAssignmentHistory([]);
    }
  }, [personnel?.user_id]);

  const fetchLaboratories = async () => {
    setIsLoadingLaboratories(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/laboratories`
      );
      setLaboratories(response.data.data || []);
    } catch (err) {
      console.error("Error fetching laboratories:", err);
    } finally {
      setIsLoadingLaboratories(false);
    }
  };

  const fetchDesignation = async () => {
    if (!personnel?.user_id) return;
    setIsLoadingDesignation(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/personnel_designations/${
          personnel.user_id
        }`
      );

      if (response.data.data) {
        const latestDesignation = response.data.data;

        if (latestDesignation.status === "Inactive") {
          setDesignation(null);
        } else {
          setDesignation(latestDesignation);
        }
      } else {
        setDesignation(null);
      }
    } catch (err) {
      console.error("Error fetching personnel designation:", err);
      setDesignation(null);
    } finally {
      setIsLoadingDesignation(false);
    }
  };

  const fetchAssignmentHistory = async () => {
    if (!personnel?.user_id) return;
    setIsLoadingHistory(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/personnel_designations/history/${
          personnel.user_id
        }`
      );

      const sortedHistory = response.data.data.sort(
        (a, b) => new Date(b.assign_date) - new Date(a.assign_date)
      );

      setAssignmentHistory(sortedHistory || []);
    } catch (err) {
      console.error("Error fetching assignment history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAssignLab = async () => {
    if (!selectedLab) {
      toast.warn("⚠️ Please select a laboratory.");
      return;
    }

    setIsAssigning(true);
    try {
      const payload = {
        user_id: personnel.user_id,
        lab_id: selectedLab,
      };

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/personnel_designations`,
        payload
      );

      toast.success("Laboratory assigned successfully!");

      fetchDesignation();
      fetchAssignmentHistory();

      setSelectedLab(null);
      setIsReassigning(false);
    } catch (err) {
      console.error("Error assigning laboratory:", err);
      toast.error("Failed to assign laboratory.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!designation) {
      toast.warn("No active assignment to remove.");
      return;
    }

    setIsRemovingAssignment(true);
    try {
      const payload = { user_id: personnel.user_id };

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/personnel_designations/remove`,
        payload
      );

      toast.success("Laboratory assignment removed successfully.");

      fetchDesignation();
      fetchAssignmentHistory();
    } catch (err) {
      console.error("Error removing assignment:", err);
      toast.error("Failed to remove assignment.");
    } finally {
      setIsRemovingAssignment(false);
    }
  };

  const handleReassignLab = async () => {
    if (!selectedLab) {
      toast.warn("Please select a new laboratory.");
      return;
    }

    setIsAssigning(true);
    try {
      const payload = {
        user_id: personnel.user_id,
        new_lab_id: selectedLab,
      };

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/personnel_designations/reassign`,
        payload
      );

      toast.success("Laboratory reassigned successfully!");

      fetchDesignation();
      fetchAssignmentHistory();

      setSelectedLab(null);
      setIsReassigning(false);
    } catch (err) {
      console.error("Error reassigning laboratory:", err);
      toast.error(
        err.response?.data?.message || "Failed to reassign laboratory."
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleChange = (e) => {
    setEditedPersonnel({ ...editedPersonnel, [e.target.name]: e.target.value });
  };

  const generatePassword = () => {
    const generated = Math.random().toString(36).slice(-10);
    setEditedPersonnel({ ...editedPersonnel, new_password: generated });
  };

  const handleSave = async () => {
    if (
      !editedPersonnel.first_name ||
      !editedPersonnel.last_name ||
      !editedPersonnel.email ||
      !editedPersonnel.phone
    ) {
      toast.warn("⚠️ Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = {
        first_name: editedPersonnel.first_name,
        middle_name: editedPersonnel.middle_name || "",
        last_name: editedPersonnel.last_name,
        phone: editedPersonnel.phone,
        email: editedPersonnel.email,
        username: editedPersonnel.username,
      };

      if (editedPersonnel.new_password) {
        updatedData.new_password = editedPersonnel.new_password;
      }

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/personnels/${
          editedPersonnel.user_id
        }`,
        updatedData
      );

      toast.success("Personnel updated successfully!");

      onSave(editedPersonnel);

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating personnel:", err);
      toast.error("Failed to update personnel.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="xl">
      <Modal.Header className="py-2 bg-dark text-white">
        <Modal.Title className="fs-6">Personnel Details</Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onClose}
        ></button>
      </Modal.Header>

      <Modal.Body className="p-3">
        <Row className="g-3">
          {/* Left Side: Personnel Information */}
          <Col xs={12} md={7}>
            <Card className="shadow-sm p-3 border rounded">
              <h6 className="fw-bold text-primary mb-3">
                📋 Personnel Information
              </h6>

              <Form>
                <div className="row g-2">
                  <Form.Group className="col-12">
                    <Form.Label className="fw-bold small mb-1">
                      First Name
                    </Form.Label>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        size="sm"
                        name="first_name"
                        value={editedPersonnel.first_name}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="small mb-1">{personnel.first_name}</p>
                    )}
                  </Form.Group>

                  <Form.Group className="col-12">
                    <Form.Label className="fw-bold small mb-1">
                      Middle Name
                    </Form.Label>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        size="sm"
                        name="middle_name"
                        value={editedPersonnel.middle_name || ""}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="small mb-1">
                        {personnel.middle_name || "-"}
                      </p>
                    )}
                  </Form.Group>

                  <Form.Group className="col-12">
                    <Form.Label className="fw-bold small mb-1">
                      Last Name
                    </Form.Label>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        size="sm"
                        name="last_name"
                        value={editedPersonnel.last_name}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="small mb-1">{personnel.last_name}</p>
                    )}
                  </Form.Group>
                </div>

                <Form.Group className="mt-2">
                  <Form.Label className="fw-bold small mb-1">
                    📞 Phone
                  </Form.Label>
                  {isEditing ? (
                    <Form.Control
                      type="text"
                      size="sm"
                      name="phone"
                      value={editedPersonnel.phone}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="small mb-1">{personnel.phone}</p>
                  )}
                </Form.Group>

                <Form.Group className="mt-2">
                  <Form.Label className="fw-bold small mb-1">
                    📧 Email
                  </Form.Label>
                  {isEditing ? (
                    <Form.Control
                      type="email"
                      size="sm"
                      name="email"
                      value={editedPersonnel.email}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="small mb-1">{personnel.email}</p>
                  )}
                </Form.Group>

                <Form.Group className="mt-2">
                  <Form.Label className="fw-bold small mb-1">
                    👤 Username
                  </Form.Label>
                  {isEditing ? (
                    <Form.Control
                      type="text"
                      size="sm"
                      name="username"
                      value={editedPersonnel.username}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="small mb-1">{personnel.username}</p>
                  )}
                </Form.Group>

                {isEditing && (
                  <Form.Group className="mt-2">
                    <Form.Label className="fw-bold small mb-1">
                      🔑 New Password
                    </Form.Label>
                    <InputGroup size="sm">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="new_password"
                        value={editedPersonnel.new_password}
                        onChange={handleChange}
                        placeholder="Enter new password (optional)"
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                      <Button variant="warning" onClick={generatePassword}>
                        <FaKey />
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted small">
                      Leave empty to keep current password.
                    </Form.Text>
                  </Form.Group>
                )}
              </Form>
            </Card>
          </Col>

          {/* Right Side: Assigned Laboratory */}
          <Col xs={12} md={5}>
            <Card className="shadow-sm p-3 border rounded">
              <h6 className="fw-bold text-primary mb-3 small">
                🏢 Assigned Laboratory
              </h6>

              {isLoadingDesignation ? (
                <div className="d-flex justify-content-center align-items-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : designation ? (
                <>
                  <div className="p-3 border rounded bg-light">
                    <Row className="mb-2 small">
                      <Col xs={5}>
                        <strong>Lab Name:</strong>
                      </Col>
                      <Col xs={7} className="text-end">
                        {designation.lab_name || "N/A"}
                      </Col>
                    </Row>

                    <Row className="mb-2 small">
                      <Col xs={5}>
                        <strong>Lab Number:</strong>
                      </Col>
                      <Col xs={7} className="text-end">
                        {designation.lab_number || "N/A"}
                      </Col>
                    </Row>

                    <Row className="mb-3 small">
                      <Col xs={5}>
                        <strong>Assign Date:</strong>
                      </Col>
                      <Col xs={7} className="text-end">
                        {designation.created_at
                          ? new Date(
                              designation.created_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </Col>
                    </Row>
                  </div>

                  {/* Show select new lab section when changing laboratory */}
                  {selectedLab !== null && (
                    <div className="p-3 border rounded bg-light mt-2">
                      <p className="text-muted text-center small">
                        Select a new laboratory for reassignment.
                      </p>

                      {/* ✅ Show Spinner While Loading Laboratories */}
                      {isLoadingLaboratories ? (
                        <div className="d-flex justify-content-center align-items-center py-3">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : (
                        <Form.Group>
                          <Form.Label className="fw-bold small">
                            Select New Laboratory
                          </Form.Label>
                          <Form.Select
                            size="sm"
                            className="small"
                            value={selectedLab || ""}
                            onChange={(e) => setSelectedLab(e.target.value)}
                            disabled={laboratories.length === 0}
                          >
                            <option value="">
                              --{" "}
                              {laboratories.length === 0
                                ? "No laboratories available"
                                : "Select Laboratory"}{" "}
                              --
                            </option>
                            {laboratories.map((lab) => (
                              <option key={lab.lab_id} value={lab.lab_id}>
                                {lab.lab_name} (#{lab.lab_number})
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      )}

                      <Button
                        size="sm"
                        variant="success"
                        className="mt-2 w-100 small"
                        onClick={handleReassignLab}
                        disabled={isAssigning || !selectedLab}
                      >
                        {isAssigning ? "Processing..." : "Confirm Reassignment"}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2 w-100 small"
                        onClick={() => setSelectedLab(null)}
                      >
                        ❌ Cancel
                      </Button>
                    </div>
                  )}

                  {selectedLab === null && (
                    <div className="d-flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="warning"
                        className="w-100 small"
                        onClick={() => setSelectedLab("")}
                      >
                        🔄 Change Lab Assignment
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        className="w-100 small"
                        onClick={handleRemoveAssignment}
                        disabled={isRemovingAssignment}
                      >
                        {isRemovingAssignment
                          ? "Removing..."
                          : "❌ Remove Assignment"}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 border rounded bg-light">
                  <p className="text-muted text-center small">
                    Personnel is not yet assigned to a laboratory.
                  </p>

                  {/* Assign Lab Dropdown */}
                  <Form.Group>
                    <Form.Label className="fw-bold small">
                      Select Laboratory
                    </Form.Label>
                    <Form.Select
                      size="sm"
                      className="small"
                      value={selectedLab || ""}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      disabled={laboratories.length === 0}
                    >
                      <option value="">
                        --{" "}
                        {laboratories.length === 0
                          ? "Loading..."
                          : "Select Laboratory"}{" "}
                        --
                      </option>
                      {laboratories.map((lab) => (
                        <option key={lab.lab_id} value={lab.lab_id}>
                          {lab.lab_name} (#{lab.lab_number})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Button
                    size="sm"
                    variant="success"
                    className="mt-2 w-100 small"
                    onClick={handleAssignLab}
                    disabled={isAssigning || !selectedLab}
                  >
                    {isAssigning ? "Processing..." : "Assign Laboratory"}
                  </Button>
                </div>
              )}
            </Card>

            <Card className="shadow-sm p-3 border rounded mt-3">
              <h6 className="fw-bold text-primary mb-3 small">
                📜 Assignment History
              </h6>

              {isLoadingHistory ? (
                <div className="d-flex justify-content-center align-items-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : assignmentHistory.length > 0 ? (
                <div
                  className="table-responsive small"
                  style={{ maxHeight: "250px", overflowY: "auto" }}
                >
                  <table className="table table-sm table-bordered">
                    <thead className="bg-light">
                      <tr>
                        <th>Laboratory</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentHistory.map((entry) => (
                        <tr key={entry.designation_id}>
                          <td>{entry.lab_details || "N/A"}</td>
                          <td>
                            <span
                              className={`badge ${
                                entry.status === "Active"
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                          <td>{entry.assign_date || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center small">
                  No assignment history found.
                </p>
              )}
            </Card>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="py-2 bg-light">
        {isEditing ? (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="me-1" /> Save Changes
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsEditing(false)}
            >
              <FaTimes className="me-1" /> Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsEditing(true)}
            >
              <FaEdit className="me-1" /> Edit
            </Button>
            <Button size="sm" variant="secondary" onClick={onClose}>
              <FaTimes className="me-1" /> Close
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ViewPersonnelModal;
