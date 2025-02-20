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
import ReLoginModal from "../modals/ReloginModal";

export default function ProfileSettings() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [showReloginModal, setShowReloginModal] = useState(false);

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
        setShowReloginModal(true);
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

  const handleReLogin = () => {
    localStorage.clear();
    window.location.href = "/login";
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
    <div className="container-fluid mt-3 px-2">
      
      <ToastContainer />
      <ReLoginModal show={showReloginModal} onReLogin={handleReLogin} />

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

          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div
              className="col-12 col-md-8 col-lg-5 mx-auto mt-4"
              style={{ maxWidth: "600px" }}
            >
              <div className="card shadow-sm p-3 h-100">
                <h6 className="mb-2 text-primary">Personal Information</h6>
                <div className="row g-2 small">
                  {[
                    {
                      name: "first_name",
                      icon: <FaUser className="me-1 text-success" />,
                      label: "First Name",
                    },
                    {
                      name: "middle_name",
                      icon: <FaUser className="me-1 text-success" />,
                      label: "Middle Name",
                    },
                    {
                      name: "last_name",
                      icon: <FaUser className="me-1 text-success" />,
                      label: "Last Name",
                    },
                    {
                      name: "email",
                      icon: <FaEnvelope className="me-1 text-warning" />,
                      label: "Email",
                    },
                    {
                      name: "phone",
                      icon: <FaPhone className="me-1 text-info" />,
                      label: "Phone",
                    },
                  ].map((field, index) => (
                    <div key={index} className="col-12 col-sm-6">
                      <label className="small text-muted">
                        {field.icon} {field.label}
                      </label>
                      <input
                        type={field.name === "email" ? "email" : "text"}
                        className="form-control form-control-sm"
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        disabled={!isEditingPersonal}
                      />
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-end mt-2">
                  {isEditingPersonal ? (
                    <>
                      <button
                        className="btn btn-success btn-sm me-2"
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
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsEditingPersonal(false)}
                      >
                        <FaTimes className="me-1" /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsEditingPersonal(true)}
                    >
                      <FaEdit className="me-1" /> Edit
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              className="col-12 col-md-8 col-lg-5 mx-auto mt-4"
              style={{ maxWidth: "600px" }}
            >
              <div className="card shadow-sm p-3">
                <h6 className="mb-2 text-primary">Login Credentials</h6>
                <div className="row g-2 small">
                  <div className="col-12 col-sm-6">
                    <label className="small text-muted">
                      <FaUser className="me-1 text-success" /> Username
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!isEditingCredentials}
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="small text-muted">
                      <FaLock className="me-1 text-danger" /> New Password
                    </label>
                    <div className="input-group input-group-sm">
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
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="small text-muted">
                      <FaLock className="me-1 text-danger" /> Confirm New
                      Password
                    </label>
                    <div className="input-group input-group-sm">
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
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-2">
                  {isEditingCredentials ? (
                    <>
                      <button
                        className="btn btn-success btn-sm me-2"
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
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsEditingCredentials(false)}
                      >
                        <FaTimes className="me-1" /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsEditingCredentials(true)}
                    >
                      <FaEdit className="me-1" /> Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
