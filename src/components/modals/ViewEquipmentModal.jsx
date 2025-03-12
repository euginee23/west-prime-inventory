import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Row, Col, Image, Card, Form } from "react-bootstrap";
import { FaDownload, FaTimes, FaEdit, FaSave, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import ImageUploadModal from "./ImageUploadModal";
import { openCamera } from "../../utils/camera";
import ImageViewerModal from "./ImageViewerModal";

const ViewEquipmentModal = ({ show, onClose, equipment, onSave }) => {
  if (!equipment) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [laboratories, setLaboratories] = useState([]);

  const [isSaving, setIsSaving] = useState(false);

  const [editedEquipment, setEditedEquipment] = useState({
    ...equipment,
    images:
      equipment?.images && Array.isArray(equipment.images)
        ? equipment.images
        : [],
  });

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handlePrevious = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : equipment.images.length - 1
    );
  };

  const handleNext = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex < equipment.images.length - 1 ? prevIndex + 1 : 0
    );
  };

  const handleOpenImageUploadModal = () => {
    setShowImageUploadModal(true);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (editedEquipment.images.length + files.length > 3) {
      alert("You can only upload up to 3 images.");
      return;
    }

    setEditedEquipment((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        ...files.map((file) => URL.createObjectURL(file)),
      ],
      newImages: prev.newImages ? [...prev.newImages, ...files] : [...files],
    }));

    setShowImageUploadModal(false);
  };

  const handleRemoveImage = (index) => {
    if (editedEquipment.images.length === 1) {
      toast.warn(
        "Cannot remove the last image. At least one image is required."
      );
      return;
    }

    setEditedEquipment((prev) => {
      const removedImage = prev.images[index];
      const updatedImages = prev.images.filter((_, i) => i !== index);

      return {
        ...prev,
        images: updatedImages,
        remove_images: prev.remove_images
          ? [...prev.remove_images, removedImage]
          : [removedImage],
      };
    });
  };

  const handleSave = async () => {
    if (!editedEquipment || !editedEquipment.name) {
      alert("Error: Equipment data is missing.");
      return;
    }

    const originalInfo = {
      name: equipment.name,
      number: equipment.number,
      type: equipment.type,
      brand: equipment.brand,
      availability_status: equipment.availability_status,
      operational_status: equipment.operational_status,
      laboratory_id: equipment.laboratory?.lab_number || "",
      description: equipment.description,
    };

    const newInfo = {
      name: editedEquipment.name,
      number: editedEquipment.number,
      type: editedEquipment.type,
      brand: editedEquipment.brand,
      availability_status: editedEquipment.availability_status,
      operational_status: editedEquipment.operational_status,
      laboratory_id: editedEquipment.laboratory_id,
      description: editedEquipment.description,
    };

    const infoChanged =
      JSON.stringify(originalInfo) !== JSON.stringify(newInfo);
    const imagesChanged =
      (editedEquipment.newImages && editedEquipment.newImages.length > 0) ||
      (editedEquipment.remove_images &&
        editedEquipment.remove_images.length > 0);

    if (!infoChanged && !imagesChanged) {
      alert("No changes were made.");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        ...editedEquipment,
        remove_images: editedEquipment.remove_images || [],
        newImages: editedEquipment.newImages || [],
      });

      setIsEditing(false);
    } catch (error) {
      alert("Failed to save equipment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDownloadQR = () => {
    if (!equipment.qr_img) return;

    const img = document.createElement("img");
    img.crossOrigin = "Anonymous";
    img.src = equipment.qr_img;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scaleFactor = 4;

      canvas.width = img.naturalWidth * scaleFactor;
      canvas.height = img.naturalHeight * scaleFactor;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const highResQR = canvas.toDataURL("image/png", 1.0);

      const link = document.createElement("a");
      link.href = highResQR;

      const equipmentName = equipment.name
        ? equipment.name.replace(/\s+/g, "_")
        : "equipment";
      const equipmentNumber = equipment.number
        ? equipment.number.replace(/\s+/g, "_")
        : "000";
      link.download = `${equipmentName}_${equipmentNumber}_qr.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.onerror = () => {
      console.error("Failed to load QR image.");
    };
  };

  const handleOpenCamera = async () => {
    try {
      const imageBlob = await openCamera();
  
      if (editedEquipment.images.length >= 3) {
        toast.warn("You can only upload up to 3 images.");
        return;
      }
  
      const imageFile = new File([imageBlob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      const imageURL = URL.createObjectURL(imageBlob);
  
      setEditedEquipment((prev) => ({
        ...prev,
        images: [...prev.images, imageURL],  
        newImages: prev.newImages ? [...prev.newImages, imageFile] : [imageFile],
      }));
  
      setShowImageUploadModal(false);
    } catch (err) {
      console.error("Camera was closed or an error occurred:", err);
      toast.error("Failed to capture image.");
    }
  };  

  const equipmentTypes = [
    "Computer Accessory",
    "Printer / Scanner",
    "Computer Hardware",
    "Networking Equipment",
    "Laboratory Equipment",
    "Office Equipment",
    "Multimedia Device",
    "Others",
  ];

  const brands = [
    "Acer",
    "Asus",
    "Dell",
    "Epson",
    "Altos",
    "HP",
    "Lenovo",
    "Apple",
    "Samsung",
    "MSI",
    "Brother",
    "Canon",
    "Logitech",
  ];

  const operationalStatusOptions = [
    "Operational",
    "Needs Repair",
    "For Disposal",
    "Under Maintenance",
    "Decommissioned",
  ];

  const availabilityStatusOptions = [
    "Available",
    "In Use",
    "Reserved",
    "Out of Service",
    "Retired",
  ];

  useEffect(() => {
    if (isEditing) {
      setEditedEquipment({
        ...equipment,
        images:
          equipment?.images && Array.isArray(equipment.images)
            ? equipment.images
            : [],
        laboratory_id: equipment.laboratory?.lab_number || "",
      });
    }
  }, [isEditing, equipment]);

  useEffect(() => {
    fetchLaboratories();
  }, []);

  const fetchLaboratories = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/laboratories`
      );
      setLaboratories(response.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching laboratories:", err);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onClose} centered size="xl" scrollable>
        <Modal.Header className="py-2 bg-dark text-white d-flex align-items-center justify-content-between">
          <Modal.Title className="fs-6">📋 Equipment Details</Modal.Title>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </Modal.Header>

        <Modal.Body className="p-3">
          <Row className="g-3">
            {/* Left Side: QR Code & Images */}
            <Col xs={12} md={4}>
              <Card className="shadow-sm p-3 text-center">
                {equipment.qr_img && (
                  <div className="mb-3 d-flex flex-column align-items-center">
                    <Image
                      src={equipment.qr_img}
                      alt="QR Code"
                      fluid
                      className="border border-dark rounded p-2"
                      style={{ width: "150px" }}
                    />
                    <Button
                      size="sm"
                      variant="success"
                      className="mt-2"
                      style={{ width: "150px" }}
                      onClick={handleDownloadQR}
                    >
                      <FaDownload className="me-1" /> Download QR
                    </Button>
                  </div>
                )}

                <h6 className="fw-bold mt-3">📷 Equipment Images</h6>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {editedEquipment.images.map((img, index) => (
                    <div key={index} className="position-relative">
                      <Image
                        src={
                          img.startsWith("blob:") ||
                          img.startsWith("data:image")
                            ? img
                            : `data:image/jpeg;base64,${img}`
                        }
                        alt="Equipment"
                        className="border rounded shadow-sm"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                        onClick={() => handleImageClick(index)}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          className="btn-close position-absolute top-0 end-0 bg-white border border-dark rounded-circle"
                          onClick={() => handleRemoveImage(index)}
                          style={{ transform: "scale(1.2)" }}
                        ></button>
                      )}
                    </div>
                  ))}

                  {/* Show Upload Button Only If Less Than 3 Images */}
                  {isEditing && editedEquipment.images.length < 3 && (
                    <div
                      className="d-flex align-items-center justify-content-center border border-dashed rounded"
                      style={{
                        width: "80px",
                        height: "80px",
                        borderWidth: "2px",
                        cursor: "pointer",
                        color: "#007bff",
                        fontSize: "24px",
                        fontWeight: "bold",
                        background: "#f8f9fa",
                      }}
                      onClick={handleOpenImageUploadModal}
                    >
                      <FaPlus />
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Middle Section: Equipment Details (Stacked on mobile, inline on desktop) */}
            <Col xs={12} md={8}>
              <Row>
                <Col xs={12} md={showHistory ? 6 : 12}>
                  <Card className="shadow-sm p-3 bg-light">
                    <h6 className="fw-bold">🔧 Equipment Information</h6>
                    <div className="small">
                      {[
                        ["Equipment Name", "name"],
                        ["Number", "number"],
                        ["Type", "type"],
                        ["Brand", "brand"],
                        ["Availability Status", "availability_status"],
                        ["Operational Status", "operational_status"],
                      ].map(([label, key]) => (
                        <div
                          key={label}
                          className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                        >
                          <strong>{label}:</strong>
                          {isEditing ? (
                            key === "type" ? (
                              <Form.Select
                                name="type"
                                value={editedEquipment.type || ""}
                                onChange={(e) =>
                                  setEditedEquipment({
                                    ...editedEquipment,
                                    type: e.target.value,
                                  })
                                }
                                className="ms-2"
                                size="sm"
                              >
                                <option value="">Select Type</option>
                                {equipmentTypes.map((type, index) => (
                                  <option key={index} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </Form.Select>
                            ) : key === "brand" ? (
                              <div className="input-group input-group-sm w-100">
                                {/* Brand Dropdown */}
                                <Form.Select
                                  className="form-select"
                                  name="brand"
                                  value={
                                    brands.includes(editedEquipment.brand)
                                      ? editedEquipment.brand
                                      : "Other"
                                  }
                                  onChange={(e) => {
                                    setEditedEquipment({
                                      ...editedEquipment,
                                      brand: e.target.value,
                                    });
                                  }}
                                >
                                  <option value="">Select Brand</option>
                                  {brands.map((brand, index) => (
                                    <option key={index} value={brand}>
                                      {brand}
                                    </option>
                                  ))}
                                  <option value="Other">Other</option>
                                </Form.Select>

                                {/* Always Editable Text Input */}
                                <Form.Control
                                  type="text"
                                  className="form-control"
                                  name="brand"
                                  value={editedEquipment.brand}
                                  onChange={(e) =>
                                    setEditedEquipment({
                                      ...editedEquipment,
                                      brand: e.target.value,
                                    })
                                  }
                                  placeholder="Other"
                                />
                              </div>
                            ) : key === "availability_status" ? (
                              <Form.Select
                                name="availability_status"
                                value={
                                  editedEquipment.availability_status || ""
                                }
                                onChange={(e) =>
                                  setEditedEquipment({
                                    ...editedEquipment,
                                    availability_status: e.target.value,
                                  })
                                }
                                className="ms-2"
                                size="sm"
                              >
                                <option value="">Select Availability</option>
                                {availabilityStatusOptions.map(
                                  (status, index) => (
                                    <option key={index} value={status}>
                                      {status}
                                    </option>
                                  )
                                )}
                              </Form.Select>
                            ) : key === "operational_status" ? (
                              <Form.Select
                                name="operational_status"
                                value={editedEquipment.operational_status || ""}
                                onChange={(e) =>
                                  setEditedEquipment({
                                    ...editedEquipment,
                                    operational_status: e.target.value,
                                  })
                                }
                                className="ms-2"
                                size="sm"
                              >
                                <option value="">
                                  Select Operational Status
                                </option>
                                {operationalStatusOptions.map(
                                  (status, index) => (
                                    <option key={index} value={status}>
                                      {status}
                                    </option>
                                  )
                                )}
                              </Form.Select>
                            ) : (
                              <Form.Control
                                type="text"
                                name={key}
                                value={editedEquipment[key] || ""}
                                onChange={(e) =>
                                  setEditedEquipment({
                                    ...editedEquipment,
                                    [key]: e.target.value,
                                  })
                                }
                                className="ms-2"
                                size="sm"
                              />
                            )
                          ) : (
                            <span>{editedEquipment[key] || "N/A"}</span>
                          )}
                        </div>
                      ))}

                      {/* Separate Lab Location Field */}
                      <div className="d-flex justify-content-between border-bottom py-1 flex-wrap">
                        <strong>Lab Location:</strong>
                        {isEditing ? (
                          <Form.Select
                            name="laboratory_id"
                            value={editedEquipment.laboratory_id || ""}
                            onChange={(e) =>
                              setEditedEquipment({
                                ...editedEquipment,
                                laboratory_id: e.target.value,
                              })
                            }
                            className="ms-2"
                            size="sm"
                          >
                            <option value="">Select Laboratory</option>
                            {laboratories.map((lab) => (
                              <option
                                key={lab.lab_number}
                                value={lab.lab_number}
                              >
                                {lab.lab_name} (#{lab.lab_number})
                              </option>
                            ))}
                          </Form.Select>
                        ) : (
                          <span>
                            {equipment.laboratory
                              ? `${
                                  equipment.laboratory.lab_name || "Unknown Lab"
                                } ${equipment.laboratory.lab_number || ""}`
                              : "N/A"}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Additional Information */}
                  <Card className="shadow-sm p-3 mt-3 mb-3">
                    <h6 className="fw-bold">📍 Additional Information</h6>
                    <div className="small">
                      {[
                        [
                          "Added By",
                          equipment.user
                            ? `${equipment.user.first_name} ${equipment.user.last_name} (${equipment.user.user_type})`
                            : "N/A",
                        ],
                        ["Date Added", formatDate(equipment.created_at)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                        >
                          <strong>{label}:</strong>{" "}
                          <span>{value || "N/A"}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>

                {/* Right Side: Compact History Table */}
                {showHistory && (
                  <Col xs={12} md={6}>
                    <Card className="shadow-sm p-2 text-center">
                      <h6 className="fw-bold mb-2">📜 Equipment History</h6>
                      <div className="table-responsive">
                        <table className="table table-bordered table-sm small">
                          <thead className="table-dark text-center">
                            <tr>
                              <th className="px-2 py-1">Date</th>
                              <th className="px-2 py-1">Action</th>
                              <th className="px-2 py-1">Performed By</th>
                            </tr>
                          </thead>
                          <tbody className="text-center">
                            <tr>
                              <td className="px-2 py-1">Feb 10, 2025</td>
                              <td className="px-2 py-1">Maintenance</td>
                              <td className="px-2 py-1">John Doe</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">Feb 5, 2025</td>
                              <td className="px-2 py-1">Checked Out</td>
                              <td className="px-2 py-1">Jane Smith</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">Jan 22, 2025</td>
                              <td className="px-2 py-1">Repaired</td>
                              <td className="px-2 py-1">Admin</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </Col>
                )}
              </Row>
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
                onClick={() => {
                  setIsEditing(false);
                  setEditedEquipment({ ...equipment });
                }}
              >
                <FaTimes className="me-1" /> Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditedEquipment({
                    ...equipment,
                    images:
                      equipment?.images && Array.isArray(equipment.images)
                        ? equipment.images
                        : [],
                  });
                  setIsEditing(true);
                }}
              >
                <FaEdit className="me-1" /> Edit
              </Button>

              <Button size="sm" variant="secondary" onClick={onClose}>
                <FaTimes className="me-1" /> Close
              </Button>
              <Button
                size="sm"
                variant="info"
                onClick={() => setShowHistory((prev) => !prev)}
              >
                {showHistory ? "Hide History" : "Show History"}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Image Upload Modal */}
      {showImageUploadModal && (
        <ImageUploadModal
          onClose={() => setShowImageUploadModal(false)}
          onOpenCamera={handleOpenCamera}
          onUploadImage={handleImageUpload}
        />
      )}

      <ImageViewerModal
        show={selectedImageIndex !== null}
        onClose={() => setSelectedImageIndex(null)}
        images={equipment.images}
        currentIndex={selectedImageIndex}
        onNext={handleNext}
        onPrev={handlePrevious}
      />
    </>
  );
};

export default ViewEquipmentModal;
