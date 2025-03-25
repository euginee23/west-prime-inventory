import { useState, useEffect } from "react";
import { getLoggedInUser } from "../../utils/auth.js";
import { openCamera } from "../../utils/camera.js";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlus, FaEdit, FaSave, FaTrash, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Loading from "react-loading";
import ImageUploadModal from "../modals/ImageUploadModal.jsx";
import ViewEquipmentModal from "../modals/ViewEquipmentModal.jsx";
import ReLoginModal from "../modals/ReloginModal.jsx";

export default function Equipments() {
  const [equipments, setEquipments] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [showReLoginModal, setShowReLoginModal] = useState(false);

  const user = getLoggedInUser();
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    type: "",
    brand: "",
    operational_status: "Operational",
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
  ];

  const operationalStatusOptions = [
    "Operational",
    "Defective",
    "Damaged",
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [showImageOptions, setShowImageOptions] = useState(false);

  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLaboratory, setFilterLaboratory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [assignedLabName, setAssignedLabName] = useState("Unknown Laboratory");

  useEffect(() => {
    fetchEquipments();
    fetchLaboratories();
  }, []);

  const fetchEquipments = async () => {
    setIsFetching(true);

    const user = getLoggedInUser();
    if (!user || !user.token) {
      setShowReLoginModal(true);
      setIsFetching(false);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/equipments`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setEquipments(response.data);
    } catch (err) {
      console.error("Error fetching equipments:", err);
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
      const allLabs = response.data.data || [];
      setLaboratories(allLabs);

      if (user.role === "Personnel") {
        const designationResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/personnel_designations/${
            user.user_id
          }`
        );

        if (designationResponse.data.data) {
          const assignedLab = designationResponse.data.data;
          setFormData((prev) => ({
            ...prev,
            laboratory_id: assignedLab.lab_id,
          }));
          setAssignedLabName(
            `${assignedLab.lab_name} (Lab #${assignedLab.lab_number})`
          );
        } else {
          setAssignedLabName("Unknown Laboratory");
        }
      }
    } catch (err) {
      console.error("Error fetching laboratories:", err);
      setAssignedLabName("Unknown Laboratory");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleViewEquipment = (equipment) => {
    setSelectedEquipment(null);
    setShowViewModal(false);

    setTimeout(() => {
      setSelectedEquipment({
        ...equipment,
        images: Array.isArray(equipment.images) ? equipment.images : [],
      });
      setShowViewModal(true);
    }, 0);
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

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddEquipment = async () => {
    const user = getLoggedInUser();

    if (!user || !user.user_id) {
      setShowReLoginModal(true);
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
      toast.warn("Please fill in all required fields.");
      return;
    }

    if (newEquipment.images.length < 1) {
      toast.warn("Please upload at least one image.");
      return;
    }

    setIsLoading(true);

    try {
      const checkResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/search/${
          newEquipment.number
        }`
      );

      if (checkResponse.data.found) {
        toast.error(
          "This equipment number already exists. Please use a unique number."
        );
        setIsLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      Object.entries(newEquipment).forEach(([key, value]) => {
        if (key === "images") {
          value.forEach((file) => formDataToSend.append("images", file));
        } else {
          formDataToSend.append(key, value);
        }
      });

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/equipments`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Equipment added successfully!");
      setFormData({
        name: "",
        number: "",
        type: "",
        brand: "",
        operational_status: "Operational",
        description: "",
        laboratory_id: "",
        user_id: user.user_id,
        images: [],
      });
      fetchEquipments();
    } catch (err) {
      if (err.response?.status === 401) {
        setShowReLoginModal(true);
      } else if (err.response?.status === 409) {
        toast.error(
          "This equipment number already exists. Please use a unique number."
        );
      } else {
        console.error("Error adding equipment:", err);
        toast.error("Failed to add equipment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3 - formData.images.length) {
      toast.warn("You can only upload up to 3 images.");
      return;
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const onUpdateEquipment = async (updatedEquipment, isUpdated) => {
    if (!updatedEquipment || !updatedEquipment.name) {
      toast.error("Error: Equipment data is missing.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", updatedEquipment.name);
      formData.append("number", updatedEquipment.number);
      formData.append("type", updatedEquipment.type);
      formData.append("brand", updatedEquipment.brand);
      formData.append(
        "availability_status",
        updatedEquipment.availability_status
      );
      formData.append(
        "operational_status",
        updatedEquipment.operational_status
      );
      formData.append("laboratory_id", updatedEquipment.laboratory_id);
      formData.append("description", updatedEquipment.description);

      formData.append(
        "remove_images",
        JSON.stringify(updatedEquipment.remove_images || [])
      );

      if (updatedEquipment.newImages && updatedEquipment.newImages.length > 0) {
        updatedEquipment.newImages.forEach((file) => {
          formData.append("images", file);
        });
      }

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/${
          updatedEquipment.equipment_id
        }`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Equipment updated successfully!");

      if (isUpdated) {
        fetchEquipments();
      }

      setShowViewModal(false);
    } catch (error) {
      toast.error("Failed to update equipment.");
    }
  };

  const handleRemoveEquipment = (id) => {
    confirmAlert({
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this equipment?",
      buttons: [
        {
          label: "Yes, Delete",
          onClick: async () => {
            setIsLoading(true);
            try {
              await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/equipments/${id}`
              );

              toast.success("Equipment removed successfully!");
              fetchEquipments();
            } catch (err) {
              console.error("Error removing equipment:", err);
              toast.error("Failed to remove equipment.");
            } finally {
              setIsLoading(false);
            }
          },
        },
        {
          label: "Cancel",
        },
      ],
    });
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
    <div
      className="container-fluid px-2"
      style={{ maxWidth: "1300px", margin: "auto" }}
    >
      <ToastContainer />
      <ReLoginModal
        show={showReLoginModal}
        onReLogin={() => window.location.reload()}
      />

      {/* Search & Filter Container */}
      <div className="card p-2 shadow-sm mb-2">
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="🔍 Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-6">
            <div
              className={`row g-2 ${
                user.role !== "Personnel"
                  ? "row-cols-2 row-cols-md-5"
                  : "row-cols-2 row-cols-md-4"
              }`}
            >
              <div className="col">
                <select
                  className="form-select form-select-sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Type</option>
                  {equipmentTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {user.role !== "Personnel" && (
                <div className="col">
                  <select
                    className="form-select form-select-sm"
                    value={filterLaboratory}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      setFilterLaboratory(
                        selectedValue !== "" ? String(selectedValue) : ""
                      );
                    }}
                  >
                    <option value="">Lab</option>
                    {laboratories.map((lab) => (
                      <option key={lab.lab_id} value={String(lab.lab_id)}>
                        {lab.lab_name} (#{lab.lab_number})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col">
                <select
                  className="form-select form-select-sm"
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                >
                  <option value="">Brand</option>
                  {brands.map((brand, index) => (
                    <option key={index} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col">
                <select
                  className="form-select form-select-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Status</option>
                  {operationalStatusOptions.map((status, index) => (
                    <option key={index} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col">
                <button
                  className="btn btn-sm btn-primary w-100"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("");
                    setFilterLaboratory("");
                    setFilterBrand("");
                    setFilterStatus("");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <div className="row g-2">
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
              {user.role === "Personnel" ? (
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={assignedLabName || "Unknown Laboratory"}
                  disabled
                />
              ) : (
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
              )}
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Brand</label>
              <div className="input-group input-group-sm">
                <select
                  className="form-select"
                  name="brand"
                  value={
                    brands.includes(formData.brand) ? formData.brand : "Other"
                  }
                  onChange={handleChange}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand, index) => (
                    <option key={index} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-control"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Other"
                />
              </div>
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Operational Status</label>
              <select
                className="form-select form-select-sm"
                name="operational_status"
                value={formData.operational_status}
                onChange={handleChange}
              >
                <option value="">Select Operational Status</option>
                {operationalStatusOptions.map((status, index) => (
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
                rows="7"
              ></textarea>
            </div>

            <div className="mb-1">
              <label className="fw-bold small">Images (Max: 3)</label>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {formData.images.map((img, index) => (
                  <div key={index} className="position-relative">
                    <img
                      src={
                        img instanceof Blob
                          ? URL.createObjectURL(img)
                          : img.startsWith("blob:") ||
                            img.startsWith("data:image")
                          ? img
                          : `data:image/jpeg;base64,${img}`
                      }
                      alt="Equipment"
                      width="60"
                      height="60"
                      className="rounded shadow"
                      style={{ objectFit: "cover" }}
                    />
                    {/* ✅ Add remove button for each image */}
                    <button
                      type="button"
                      className="btn-close position-absolute top-0 end-0 bg-white border border-dark rounded-circle"
                      onClick={() => handleRemoveImage(index)}
                      style={{ transform: "scale(1.2)" }}
                    ></button>
                  </div>
                ))}

                {/* Show Upload Button Only If Less Than 3 Images */}
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
                className="btn btn-sm btn-success d-flex align-items-center justify-content-center"
                style={{ minWidth: "100px" }} // Ensures proper spacing
                onClick={handleAddEquipment}
                disabled={isLoading} // ✅ Disable button while loading
              >
                {isLoading ? (
                  <>
                    <Loading
                      type="spin"
                      color="#ffffff"
                      height={22}
                      width={22}
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaPlus className="me-1" /> Add
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

            {/* Scrollable Table Container */}
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {isFetching ? (
                <Loading type="spin" color="#007bff" height={40} width={40} />
              ) : equipments.length === 0 ? (
                <div className="text-center p-3 text-muted">
                  📭 No equipment added yet.
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {equipments
                    .filter(
                      (equipment) =>
                        searchQuery === "" ||
                        equipment.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        equipment.number
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        equipment.type
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                    )
                    .filter(
                      (equipment) =>
                        filterType === "" || equipment.type === filterType
                    )
                    .filter((equipment) => {
                      if (!filterLaboratory) return true;

                      return (
                        equipment.laboratory &&
                        equipment.laboratory.lab_id &&
                        String(equipment.laboratory.lab_id).trim() ===
                          String(filterLaboratory).trim()
                      );
                    })
                    .filter(
                      (equipment) =>
                        filterBrand === "" || equipment.brand === filterBrand
                    )
                    .filter(
                      (equipment) =>
                        filterStatus === "" ||
                        equipment.operational_status === filterStatus
                    )
                    .map((equipment) => (
                      <li
                        key={`${equipment.equipment_id}-${equipment.number}`}
                        className="list-group-item d-flex justify-content-between align-items-center p-2"
                      >
                        <span className="text-truncate small">
                          <strong>{equipment.name}</strong> (#{equipment.number}
                          ) - {equipment.type}
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
      </div>

      <ViewEquipmentModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        equipment={selectedEquipment}
        onSave={onUpdateEquipment}
      />
    </div>
  );
}
