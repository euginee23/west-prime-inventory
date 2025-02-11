import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaUserPlus,
  FaEdit,
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

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [confirmText, setConfirmText] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchPersonnels();
  }, []);

  const fetchPersonnels = async () => {
    setIsFetching(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/personnels`
      );
      setPersonnels(response.data || []);
    } catch (err) {
      console.error("❌ Error fetching personnels:", err);
      toast.error("Failed to load personnels.");
      setPersonnels([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      toast.warn("⚠️ Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/personnels`,
        formData
      );
      toast.success("✅ Personnel added successfully!");
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
      console.error("❌ Error adding personnel:", err);
      toast.error("❌ Failed to add personnel.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPersonnel = (personnel) => {
    setFormData({ ...personnel, password: "" });
    setIsEditing(true);
    setEditingId(personnel.user_id);
  };

  const handleUpdatePersonnel = async () => {
    setIsLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/personnels/${editingId}`,
        formData
      );
      toast.success("✅ Personnel updated successfully!");
      fetchPersonnels();
      handleCancel();
    } catch (err) {
      console.error("❌ Error updating personnel:", err);
      toast.error("❌ Failed to update personnel.");
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
      toast.success("✅ Personnel removed successfully!");
      setDeleteId(null);
      fetchPersonnels();
    } catch (err) {
      console.error("❌ Error removing personnel:", err);
      toast.error("❌ Failed to remove personnel.");
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

  return (
    <div className="container mt-4">
      <ToastContainer />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-danger">
                  Confirm Personnel Removal
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteId(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted">
                  Are you sure you want to remove this personnel? This action
                  cannot be undone.
                  <br />
                  <strong>
                    Type: <code>confirm-remove</code> to proceed.
                  </strong>
                </p>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type: confirm-remove"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmRemove}
                  disabled={confirmText !== "confirm-remove"}
                >
                  <FaTrash /> Remove Personnel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Personnel Form */}
      <div className="card p-4 shadow-sm mt-4">
        <h4 className="mb-3 text-primary">
          {isEditing ? "Edit Personnel" : "Add New Personnel"}
        </h4>
        <div className="row">
          {["first_name", "middle_name", "last_name", "phone", "email"].map(
            (field, index) => (
              <div key={index} className="col-12 col-md-4">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder={field
                    .replace("_", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
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

        {/* Username & Password Fields */}
        <div className="row">
          <div className="col-12 col-md-6">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          {!isEditing && (
            <div className="col-12 col-md-6">
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
          )}
        </div>

        <div className="d-flex justify-content-end mt-3">
          {isEditing && (
            <button className="btn btn-secondary me-2" onClick={handleCancel}>
              <FaTimes /> Cancel
            </button>
          )}
          <button
            className={`btn ${isEditing ? "btn-primary" : "btn-success"}`}
            onClick={isEditing ? handleUpdatePersonnel : handleAddPersonnel}
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
                <FaUserPlus /> Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Personnel List */}
      <div className="card p-4 shadow-sm mt-4">
        <h4 className="mb-3 text-primary">
          <FaUsers className="me-2" /> List of Personnel
        </h4>
        {isFetching ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <Loading type="spin" color="#007bff" height={50} width={50} />
          </div>
        ) : personnels.length === 0 ? (
          <p className="text-muted text-center">
            No personnel have been added yet.
          </p>
        ) : (
          <ul className="list-group">
            {personnels.map((person) => (
              <li
                key={person.user_id}
                className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center"
              >
                <div className="text-center text-md-start">
                  <strong>
                    {person.first_name}{" "}
                    {person.middle_name ? person.middle_name + " " : ""}
                    {person.last_name}
                  </strong>
                  <p className="mb-0 small text-muted">
                    {person.email} | {person.phone}
                  </p>
                </div>
                <div className="d-flex gap-2 mt-2 mt-md-0">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEditPersonnel(person)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemovePersonnel(person.user_id)}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
