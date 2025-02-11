import { useState, useEffect } from "react";
import axios from "axios";
import Loading from "react-loading";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserShield,
  FaSave,
  FaTimes,
  FaEdit,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProfileSettings() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);

  const [formData, setFormData] = useState({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [modalMessage, setModalMessage] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/user/profile`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
        setFormData(response.data);
      } catch (err) {
        console.error("❌ Error fetching profile data:", err);
        setError("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSavePersonal = async () => {
    setIsSavingPersonal(true);

    // Validate required fields
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.phone
    ) {
      toast.warn("⚠️ Please fill in all required fields.");
      setIsSavingPersonal(false);
      return;
    }

    // Check if changes were actually made
    const hasChanges =
      formData.first_name !== userData.first_name ||
      formData.middle_name !== userData.middle_name ||
      formData.last_name !== userData.last_name ||
      formData.email !== userData.email ||
      formData.phone !== userData.phone;

    if (!hasChanges) {
      toast.info("ℹ️ No changes detected.");
      setIsSavingPersonal(false);
      return;
    }

    try {
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/user/update-personal`;

      const payload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
      };

      const response = await axios.put(apiUrl, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      toast.success("✅ Personal information updated successfully!");

      setUserData({ ...userData, ...formData });
      setIsEditingPersonal(false);
    } catch (err) {
      console.error("❌ Error updating personal information:", err);
      toast.error(
        err.response?.data?.message ||
          "❌ Failed to update personal information."
      );
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleShowConfirmModal = () => {
    const isUsernameChanged = formData.username !== userData.username;
    const isPasswordChanged = newPassword && confirmNewPassword;

    if (!isUsernameChanged && !isPasswordChanged) {
      toast.warn("⚠️ No changes detected.");
      return;
    }

    if (isPasswordChanged && newPassword !== confirmNewPassword) {
      toast.error("❌ New password and confirmation do not match.");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleSaveCredentials = async () => {
    setIsSavingCredentials(true);

    if (newPassword || confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        toast.error("❌ New password and confirmation do not match.");
        setIsSavingCredentials(false);
        return;
      }
    }

    try {
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/user/update-credentials`;

      const payload = {
        username: formData.username,
      };

      if (newPassword && confirmNewPassword) {
        payload.oldPassword = oldPassword;
        payload.newPassword = newPassword;
        payload.confirmNewPassword = confirmNewPassword;
      }

      const response = await axios.put(apiUrl, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      toast.success("✅ Profile updated successfully!");

      setUserData({ ...userData, username: formData.username });
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsEditingCredentials(false);
      setShowConfirmModal(false);
    } catch (err) {
      console.error("❌ Error updating credentials:", err);
      toast.error(
        err.response?.data?.message || "❌ Failed to update credentials."
      );
    } finally {
      setIsSavingCredentials(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <Loading type="spin" color="#28a745" height={50} width={50} />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <ToastContainer />

      {userData && (
        <>
          {showConfirmModal && (
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content animate-modal">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">Confirm Password</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowConfirmModal(false);
                        setModalMessage("");
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p className="text-muted">
                      Please enter your old password to continue:
                    </p>

                    {/* Password Input with Show/Hide Toggle */}
                    <div className="input-group">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Enter old password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {modalMessage && (
                      <div
                        className={`alert ${
                          modalMessage.includes("✅")
                            ? "alert-success"
                            : "alert-danger"
                        } mt-2 p-2 text-center`}
                      >
                        {modalMessage}
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowConfirmModal(false);
                        setModalMessage("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleSaveCredentials();
                        if (modalMessage.includes("✅")) {
                          setTimeout(() => {
                            setShowConfirmModal(false);
                            setModalMessage("");
                          }, 2000);
                        }
                      }}
                      disabled={isSavingCredentials}
                    >
                      {isSavingCredentials ? "Saving..." : "Confirm & Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card shadow-sm p-4 mt-4">
            <h4 className="mb-3 text-primary">Personal Information</h4>
            <div className="row">
              <div className="col-md-6">
                <p>
                  <FaUser className="me-2 text-success" />
                  <strong>First Name:</strong>
                </p>
                <input
                  type="text"
                  className="form-control"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!isEditingPersonal}
                />

                <p className="mt-3">
                  <FaUser className="me-2 text-success" />
                  <strong>Middle Name:</strong>
                </p>
                <input
                  type="text"
                  className="form-control"
                  name="middle_name"
                  value={formData.middle_name || ""}
                  onChange={handleChange}
                  disabled={!isEditingPersonal}
                />

                <p className="mt-3">
                  <FaUser className="me-2 text-success" />
                  <strong>Last Name:</strong>
                </p>
                <input
                  type="text"
                  className="form-control"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!isEditingPersonal}
                />
              </div>

              <div className="col-md-6">
                <p>
                  <FaEnvelope className="me-2 text-warning" />
                  <strong>Email:</strong>
                </p>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditingPersonal}
                />

                <p className="mt-3">
                  <FaPhone className="me-2 text-info" />
                  <strong>Phone:</strong>
                </p>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditingPersonal}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-3">
              {isEditingPersonal ? (
                <>
                  <button
                    className="btn btn-success me-2"
                    onClick={handleSavePersonal}
                    disabled={isSavingPersonal}
                  >
                    {isSavingPersonal ? (
                      "Saving..."
                    ) : (
                      <>
                        <FaSave className="me-1" /> Save
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsEditingPersonal(false)}
                  >
                    <FaTimes className="me-1" /> Cancel
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditingPersonal(true)}
                >
                  <FaEdit className="me-1" /> Edit
                </button>
              )}
            </div>
          </div>

          <div className="card shadow-sm p-4 mt-4">
            <h4 className="mb-3 text-primary">Login Credentials</h4>
            <div className="row">
              <div className="col-md-6">
                <p>
                  <FaUser className="me-2 text-success" />
                  <strong>Username:</strong>
                </p>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditingCredentials}
                />
              </div>

              <div className="col-md-6">
                <p>
                  <FaLock className="me-2 text-danger" />
                  <strong>New Password:</strong>
                </p>
                <div className="input-group">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="form-control"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={!isEditingCredentials}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <p className="mt-3">
                  <FaLock className="me-2 text-danger" />
                  <strong>Confirm New Password:</strong>
                </p>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control"
                    name="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={!isEditingCredentials}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-3">
              {isEditingCredentials ? (
                <>
                  <button
                    className="btn btn-success me-2"
                    onClick={handleShowConfirmModal}
                    disabled={isSavingCredentials}
                  >
                    {isSavingCredentials ? (
                      "Saving..."
                    ) : (
                      <>
                        <FaSave className="me-1" /> Save
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsEditingCredentials(false)}
                  >
                    <FaTimes className="me-1" /> Cancel
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditingCredentials(true)}
                >
                  <FaEdit className="me-1" /> Edit
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
