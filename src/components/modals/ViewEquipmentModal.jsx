import React, { useState } from "react";
import Loading from "react-loading";
import axios from "axios";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import {
  FaTimes,
  FaDownload,
  FaPlus,
  FaTrash,
  FaSave,
  FaEdit,
} from "react-icons/fa";

const ViewEquipmentModal = ({ show, onClose, equipment, onUpdate }) => {
  if (!equipment) return null;

  const [editMode, setEditMode] = useState(false);
  const [updatedData, setUpdatedData] = useState({
    ...equipment,
    images: equipment.images || [],
  });
  const [newImages, setNewImages] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalImages =
      newImages.length + (equipment.images?.length || 0) + files.length;

    if (totalImages > 3) {
      alert("⚠️ You can only upload up to 3 images.");
      return;
    }

    setNewImages([...newImages, ...files]);
  };

  const handleDeleteImage = (index) => {
    const existingCount = equipment.images ? equipment.images.length : 0;
    if (index >= existingCount) {
      setNewImages(newImages.filter((_, i) => i !== index - existingCount));
    } else {
      alert("To remove an existing image, please contact support.");
    }
  };

  const handleSaveChanges = async () => {
    if (
      !updatedData.name ||
      !updatedData.number ||
      !updatedData.type ||
      !updatedData.brand ||
      !updatedData.status ||
      !updatedData.description
    ) {
      alert("⚠️ Please fill in all required fields.");
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(updatedData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    formDataToSend.append(
      "remove_old_images",
      newImages.length > 0 ? "true" : "false"
    );

    newImages.forEach((file) => {
      formDataToSend.append("images", file);
    });

    setIsLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/${
          equipment.equipment_id
        }`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("✅ Equipment updated successfully!");
      onUpdate();
      setEditMode(false);
      setNewImages([]);
    } catch (err) {
      console.error(
        "❌ Error updating equipment:",
        err.response?.data || err.message
      );
      alert(
        `❌ Failed to update equipment: ${
          err.response?.data?.message || "Internal server error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUpdatedData({ ...equipment });
    setNewImages([]);
    setEditMode(false);
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = equipment.qr_img;
    link.download = `${equipment.name}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" animation={true}>
      <Modal.Header closeButton className="modal-header-custom">
        <Modal.Title className="fw-bold fs-6">
          {editMode ? "Edit Equipment" : "View Equipment"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row className="align-items-start">
          {/* Left Column: QR Code + Images */}
          <Col md={4} className="text-center mb-3 mb-md-0">
            {/* QR Code Section */}
            {equipment.qr_img && (
              <div className="qr-container p-3 border rounded shadow-sm mb-4">
                <img
                  src={equipment.qr_img}
                  alt="QR Code"
                  className="img-fluid mb-3 rounded"
                />
                <Button variant="success" onClick={handleDownloadQR}>
                  <FaDownload className="me-1" /> Download QR
                </Button>
              </div>
            )}

            {/* Image Section */}
            <h5 className="fw-bold">Images</h5>
            <div className="container">
              <Row className="gx-2 gy-2 justify-content-center">
                {(equipment.images || [])
                  .concat(newImages)
                  .map((img, index) => (
                    <Col
                      xs={6}
                      key={index}
                      className="d-flex justify-content-center"
                    >
                      <div className="position-relative image-wrapper">
                        <img
                          src={
                            img instanceof File ? URL.createObjectURL(img) : img
                          }
                          alt="Equipment"
                          className="img-thumbnail image-thumbnail"
                        />
                        {editMode && (
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDeleteImage(index)}
                            title="Delete Image"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </Col>
                  ))}

                {/* Add Image Button in Second Row */}
                {editMode &&
                  (equipment.existing_images?.length || 0) + newImages.length <
                    3 && (
                    <Col xs={6} className="d-flex justify-content-center">
                      <label className="btn btn-outline-primary add-image-btn">
                        <FaPlus className="me-1" /> Add Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          hidden
                        />
                      </label>
                    </Col>
                  )}
              </Row>
            </div>
          </Col>

          {/* Right Column: Equipment Details Form */}
          <Col md={8}>
            <Form>
              {["name", "number", "type", "brand"].map((field, idx) => (
                <Form.Group className="mb-3" key={idx}>
                  <Form.Label className="fw-bold text-capitalize">
                    {field}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name={field}
                    value={updatedData[field] || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                    placeholder={`Enter ${field}`}
                  />
                </Form.Group>
              ))}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Status</Form.Label>
                <Form.Select
                  name="status"
                  value={updatedData.status || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                >
                  {[
                    "Operational",
                    "Needs Repair",
                    "For Disposal",
                    "Under Maintenance",
                    "Decommissioned",
                  ].map((status, idx) => (
                    <option key={idx} value={status}>
                      {status}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={updatedData.description || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                  placeholder="Enter description..."
                />
              </Form.Group>
            </Form>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="justify-content-end">
        {editMode ? (
          <>
            <Button
              variant="success"
              onClick={handleSaveChanges}
              className="me-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loading type="spin" color="#fff" height={20} width={20} />
              ) : (
                <>
                  <FaSave className="me-1" /> Save Changes
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              <FaTimes className="me-1" /> Cancel
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => setEditMode(true)}>
            <FaEdit className="me-1" /> Edit
          </Button>
        )}
      </Modal.Footer>
      <style>{`
        .modal-header-custom {
          background-color: #f1f3f5;
          border-bottom: 1px solid #dee2e6;
          height: 40px;
        }
        .qr-container {
          background-color: #ffffff;
        }
        .image-wrapper {
          width: 120px;
          height: 120px;
        }
        .image-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
          transition: transform 0.2s;
        }
        .image-thumbnail:hover {
          transform: scale(1.05);
        }
        .delete-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: #dc3545;
          color: #ffffff;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .delete-btn:hover {
          opacity: 1;
        }
        .add-image-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          border: 2px dashed #007bff;
          border-radius: 10px;
          color: #007bff;
          transition: background-color 0.3s, color 0.3s;
          cursor: pointer;
        }
        .add-image-btn:hover {
          background-color: #007bff;
          color: #ffffff;
        }
      `}</style>
    </Modal>
  );
};

export default ViewEquipmentModal;
