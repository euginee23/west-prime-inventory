import { useState, useEffect } from "react";
import { getLoggedInUser } from "../../utils/auth.js";
import { openCamera } from "../../utils/camera";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlus, FaEdit, FaSave, FaTrash, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "react-loading";
import ImageUploadModal from "../modals/ImageUploadModal.jsx";
import ViewEquipmentModal from "../modals/ViewEquipmentModal.jsx";

export default function Equipments() {
  const [equipments, setEquipments] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const user = getLoggedInUser();
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    type: "",
    brand: "",
    status: "Operational",
    description: "",
    user_id: user ? user.user_id : "",
    laboratory_id: "",
    images: [],
  });

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
    "Others",
  ];

  const statusOptions = [
    "Operational",
    "Needs Repair",
    "For Disposal",
    "Under Maintenance",
    "Decommissioned",
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [showImageOptions, setShowImageOptions] = useState(false);

  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchEquipments();
    fetchLaboratories();
  }, []);

  const fetchEquipments = async () => {
    setIsFetching(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/equipments`
      );
      const uniqueEquipments = response.data.reduce((acc, equipment) => {
        if (!acc.find((e) => e.equipment_id === equipment.equipment_id)) {
          acc.push(equipment);
        }
        return acc;
      }, []);
      setEquipments(uniqueEquipments);
    } catch (err) {
      console.error("❌ Error fetching equipments:", err);
      toast.error("Failed to load equipments.");
    } finally {
      setIsFetching(false);
    }
  };

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleViewEquipment = (equipment) => {
    setSelectedEquipment({
      ...equipment,
      existing_images: equipment.equipment_image
        ? [equipment.equipment_image]
        : [],
    });
    setShowViewModal(true);
  };

  const handleOpenCamera = async () => {
    try {
      const imageBlob = await openCamera();
      setFormData((prev) => {
        if (prev.images.length < 3) {
          return { ...prev, images: [...prev.images, imageBlob] };
        }
        return prev;
      });
    } catch (err) {
      console.error("Camera was closed or an error occurred:", err);
    }
  };

  const handleDeleteImage = (index) => {
    setFormData((prev) => {
      const updatedImages = [...prev.images];
      updatedImages.splice(index, 1);
      return { ...prev, images: updatedImages };
    });
  };

  const handleAddEquipment = async () => {
    const user = getLoggedInUser();
    if (!user || !user.user_id) {
      toast.error("❌ User not logged in.");
      return;
    }

    const newEquipment = { ...formData, user_id: user.user_id };

    if (
      !newEquipment.name ||
      !newEquipment.number ||
      !newEquipment.type ||
      !newEquipment.brand ||
      !newEquipment.laboratory_id ||
      !newEquipment.description
    ) {
      toast.warn("⚠️ Please fill in all required fields.");
      return;
    }

    if (newEquipment.images.length < 1) {
      toast.warn("⚠️ Please upload at least one image.");
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(newEquipment).forEach(([key, value]) => {
      if (key === "images") {
        value.forEach((file, index) => formDataToSend.append("images", file));
      } else {
        formDataToSend.append(key, value);
      }
    });

    setIsLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/equipments`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("✅ Equipment added successfully!");
      setFormData({
        name: "",
        number: "",
        type: "",
        brand: "",
        status: "Operational",
        description: "",
        laboratory_id: "",
        user_id: user.user_id,
        images: [],
      });
      fetchEquipments();
    } catch (err) {
      console.error(
        "❌ Error adding equipment:",
        err.response?.data || err.message
      );
      toast.error("❌ Failed to add equipment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3 - formData.images.length) {
      toast.warn("⚠️ You can only upload up to 3 images.");
      return;
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const handleEditEquipment = (equipment) => {
    setFormData({ ...equipment });
    setIsEditing(true);
    setEditingId(equipment.equipment_id);
  };

  const handleUpdateEquipment = async () => {
    setIsLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/${editingId}`,
        formData
      );
      toast.success("✅ Equipment updated successfully!");
      fetchEquipments();
      handleCancel();
    } catch (err) {
      console.error("❌ Error updating equipment:", err);
      toast.error("❌ Failed to update equipment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEquipment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this equipment?"))
      return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/${id}`
      );
      toast.success("✅ Equipment removed successfully!");
      fetchEquipments();
    } catch (err) {
      console.error("❌ Error removing equipment:", err);
      toast.error("❌ Failed to remove equipment.");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      number: "",
      type: "",
      status: "Available",
      user_id: formData.user_id,
      laboratory_id: "",
    });
    setIsEditing(false);
  };

  const openImageOptions = () => {
    setShowImageOptions(true);
  };

  return (
    <div className="container-fluid mt-3 px-2">
      <ToastContainer />

      {/* Image Upload Modal */}
      {showImageOptions && (
        <ImageUploadModal
          onClose={() => setShowImageOptions(false)}
          onOpenCamera={() => {
            handleOpenCamera();
            setShowImageOptions(false);
          }}
          onUploadImage={(e) => {
            handleImageUpload(e);
            setShowImageOptions(false);
          }}
        />
      )}

      {/* Two-column layout */}
      <div className="row g-2">
        {/* Left: Add/Edit Form */}
        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm small">
            <h6 className="text-primary mb-2">
              {isEditing ? "Edit Equipment" : "Add Equipment"}
            </h6>

            <div className="mb-1">
              <label className="fw-bold small">Name</label>
              <input
                type="text"
                className="form-control form-control-sm"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Number</label>
              <input
                type="text"
                className="form-control form-control-sm"
                name="number"
                value={formData.number}
                onChange={handleChange}
              />
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Type</label>
              <select
                className="form-select form-select-sm"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                {equipmentTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Laboratory</label>
              <select
                className="form-select form-select-sm"
                name="laboratory_id"
                value={formData.laboratory_id}
                onChange={handleChange}
              >
                <option value="">Select Laboratory</option>
                {laboratories.map((lab) => (
                  <option key={lab.lab_id} value={lab.lab_id}>
                    {lab.lab_name} (#{lab.lab_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Brand</label>
              <select
                className="form-select form-select-sm"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
              >
                <option value="">Select Brand</option>
                {brands.map((brand, index) => (
                  <option key={index} value={brand}>
                    {brand}
                  </option>
                ))}
                <option value="Other">Other (Type Below)</option>
              </select>
              {formData.brand === "Other" && (
                <input
                  type="text"
                  className="form-control form-control-sm mt-1"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Enter brand"
                />
              )}
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Status</label>
              <select
                className="form-select form-select-sm"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="">Select Status</option>
                {statusOptions.map((status, index) => (
                  <option key={index} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Description</label>
              <textarea
                className="form-control form-control-sm"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
              ></textarea>
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Images (Max: 3)</label>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {formData.images.map((img, index) => (
                  <div key={index} className="position-relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt="Equipment"
                      width="60"
                      height="60"
                      className="rounded shadow"
                      style={{ objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      className="btn-close position-absolute top-0 end-0"
                      onClick={() => handleDeleteImage(index)}
                    ></button>
                  </div>
                ))}
                {formData.images.length < 3 && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={openImageOptions}
                    style={{ width: "60px", height: "60px" }}
                  >
                    <FaPlus />
                  </button>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end mt-2">
              {isEditing && (
                <button
                  className="btn btn-secondary btn-sm me-1"
                  onClick={handleCancel}
                >
                  <FaTimes /> Cancel
                </button>
              )}
              <button
                className={`btn btn-sm ${
                  isEditing ? "btn-primary" : "btn-success"
                }`}
                onClick={isEditing ? handleUpdateEquipment : handleAddEquipment}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Saving..."
                ) : isEditing ? (
                  <>
                    <FaSave /> Update
                  </>
                ) : (
                  <>
                    <FaPlus /> Add
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Equipment List */}
        <div className="col-12 col-md-8">
          <div className="card p-3 shadow-sm small">
            <h6 className="text-primary mb-2">Equipment List</h6>
            {isFetching ? (
              <Loading type="spin" color="#007bff" height={40} width={40} />
            ) : (
              <ul className="list-group list-group-flush">
                {equipments.map((equipment) => (
                  <li
                    key={`${equipment.equipment_id}-${equipment.number}`}
                    className="list-group-item d-flex justify-content-between align-items-center p-2"
                  >
                    <span className="text-truncate small">
                      <strong>{equipment.name}</strong> (#{equipment.number}) -{" "}
                      {equipment.type}
                    </span>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleViewEquipment(equipment)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleRemoveEquipment(equipment.equipment_id)
                        }
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ViewEquipmentModal
        show={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          fetchEquipments();
        }}
        equipment={selectedEquipment}
        onUpdate={fetchEquipments}
      />
    </div>
  );
}
