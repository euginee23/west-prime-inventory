import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaUserPlus,
  FaSave,
  FaUsers,
  FaTimes,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaKey,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "react-loading";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import ViewPersonnelModal from "../modals/ViewPersonnelModal";

export default function Personnels() {
  const [personnels, setPersonnels] = useState([]);
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [confirmText, setConfirmText] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLaboratory, setFilterLaboratory] = useState("");
  const [laboratories, setLaboratories] = useState([]);

  useEffect(() => {
    fetchPersonnels();
    fetchLaboratories();
  }, []);

  const fetchPersonnels = async () => {
    setIsFetching(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/personnels`
      );
      setPersonnels(response.data || []);
    } catch (err) {
      console.error("Error fetching personnels:", err);
      toast.error("Failed to load personnels.");
      setPersonnels([]);
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
      console.error("Error fetching laboratories:", err);
    }
  };

  const filteredPersonnels = personnels
    .filter(
      (person) =>
        searchQuery === "" ||
        person.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.phone.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((person) => {
      if (!filterLaboratory) return true;

      if (filterLaboratory === "unassigned") {
        return !person.lab_id;
      }

      return (
        person.lab_id && String(person.lab_id) === String(filterLaboratory)
      );
    });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPersonnel = async () => {
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.phone ||
      !formData.email ||
      !formData.username ||
      !formData.password
    ) {
      toast.warn("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/personnels`,
        formData
      );
      toast.success("Personnel added successfully!");

      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        phone: "",
        email: "",
        username: "",
        password: "",
      });

      fetchPersonnels();
    } catch (err) {
      console.error("Error adding personnel:", err);
      toast.error("Failed to add personnel.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePersonnel = (id) => {
    setDeleteId(id);
    setConfirmText("");
  };

  const handleConfirmRemove = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/personnels/${deleteId}`
      );
      toast.success("Personnel removed successfully!");
      setDeleteId(null);
      fetchPersonnels();
    } catch (err) {
      console.error("Error removing personnel:", err);
      toast.error("Failed to remove personnel.");
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: "",
      middle_name: "",
      last_name: "",
      phone: "",
      email: "",
      username: "",
      password: "",
    });
    setIsEditing(false);
  };

  const generatePassword = () => {
    const generated = Math.random().toString(36).slice(-10);
    setFormData({ ...formData, password: generated });
  };

  const handleViewPersonnel = (personnel) => {
    setSelectedPersonnel(personnel);
    setShowViewModal(true);
  };

  return (
    <div
      className="container-fluid px-2"
      style={{ maxWidth: "1100px", margin: "auto" }}
    >
      <ToastContainer />

      <DeleteConfirmationModal
        deleteId={deleteId}
        confirmText={confirmText}
        setConfirmText={setConfirmText}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmRemove}
      />

      <ViewPersonnelModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        personnel={selectedPersonnel}
        onSave={() => {
          fetchPersonnels();
          setShowViewModal(false);
        }}
      />

      {/* Search & Filter Options */}
      <div className="card p-2 shadow-sm mb-2">
        <div className="row g-2">
          {/* Search Field */}
          <div className="col-12 col-md-6">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="🔍 Search by Name, Email, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Assigned Laboratory Filter */}
          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={filterLaboratory}
              onChange={(e) =>
                setFilterLaboratory(
                  e.target.value ? String(e.target.value) : ""
                )
              }
            >
              <option value="">All Laboratories</option>
              <option value="unassigned">Unassigned</option>{" "}
              {laboratories.map((lab) => (
                <option key={lab.lab_id} value={lab.lab_id}>
                  {lab.lab_name} (#{lab.lab_number})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="col-12 col-md-2">
            <button
              className="btn btn-sm btn-primary w-100"
              onClick={() => {
                setSearchQuery("");
                setFilterLaboratory("");
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="row g-2">
        {/*Add Personnel Form */}
        <div className="col-12 col-md-5">
          <div className="card p-3 shadow-sm border rounded">
            <h6 className="text-primary mb-3 fw-bold">Add Personnel</h6>
            {/* Form Fields */}
            <div className="row g-2">
              {["first_name", "middle_name", "last_name", "phone", "email"].map(
                (field, index) => (
                  <div key={index} className="col-12">
                    <label className="fw-bold small mb-1">
                      {field
                        .replace("_", " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                    />
                  </div>
                )
              )}
            </div>

            {/* Separation Line */}
            <hr />

            {/* Username Field */}
            <div className="col-12">
              <label className="fw-bold small mb-1">Username</label>
              <input
                type="text"
                className="form-control form-control-sm"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            {/* Password Field */}
            <div className="col-12 mt-2">
              <label className="fw-bold small mb-1">Password</label>
              <div className="input-group input-group-sm">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <button
                  className="btn btn-warning"
                  type="button"
                  onClick={generatePassword}
                >
                  <FaKey />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                className="btn btn-sm btn-success"
                onClick={handleAddPersonnel}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <FaUserPlus className="me-1" /> Add
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Personnel List */}
        <div className="col-12 col-md-7">
          <div className="card p-3 shadow-sm">
            <h6 className="text-primary mb-2">
              <FaUsers className="me-2" /> Personnel List
            </h6>
            {isFetching ? (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "200px" }}
              >
                <Loading type="spin" color="#007bff" height={40} width={40} />
              </div>
            ) : personnels.length === 0 ? (
              <p className="text-muted text-center small">
                No personnel have been added yet.
              </p>
            ) : (
              <ul className="list-group list-group-flush small">
                {filteredPersonnels.length === 0 ? (
                  <p className="text-muted text-center small">
                    No matching personnel found.
                  </p>
                ) : (
                  filteredPersonnels.map((person) => (
                    <li
                      key={person.user_id}
                      className="list-group-item d-flex justify-content-between align-items-center p-2"
                    >
                      <div className="text-truncate">
                        <strong>
                          {person.first_name}{" "}
                          {person.middle_name ? person.middle_name + " " : ""}
                          {person.last_name}
                        </strong>
                        <p className="mb-0 small text-muted">
                          {person.email} | {person.phone}
                        </p>
                      </div>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => handleViewPersonnel(person)}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemovePersonnel(person.user_id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
