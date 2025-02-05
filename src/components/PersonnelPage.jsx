import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function PersonnelPage({ onLogout }) {
  const [activeSection, setActiveSection] = useState("profile");
  const [userName, setUserName] = useState("");

  const menuItems = [
    { id: "profile", label: "My Profile" },
    { id: "reports", label: "My Reports" },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/user`;
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { first_name, last_name } = response.data;
        setUserName(`${first_name} ${last_name}`);
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
        onLogout();
      }
    };

    fetchUserData();
  }, [onLogout]);

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "10px",
        margin: "10px",
        height: "calc(100vh - 20px)",
        overflow: "hidden",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Top Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark" style={{ borderRadius: "10px 10px 0 0" }}>
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">
            Hi, {userName || "Loading..."}
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#personnelNav"
            aria-controls="personnelNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="personnelNav">
            <ul className="navbar-nav ms-auto">
              {menuItems.map((item) => (
                <li key={item.id} className="nav-item">
                  <button
                    className={`btn btn-link nav-link text-white ${
                      activeSection === item.id ? "fw-bold" : ""
                    }`}
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      textDecoration: "none",
                      fontSize: "1rem",
                      padding: "5px 10px",
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li className="nav-item">
                <button
                  className="btn btn-danger text-white ms-3"
                  onClick={onLogout}
                  style={{
                    fontSize: "1rem",
                    padding: "5px 15px",
                    borderRadius: "5px",
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container-fluid px-4 py-3">
        <h1 className="fw-bold mb-4 text-center text-md-start">
          {menuItems.find((i) => i.id === activeSection)?.label}
        </h1>

        {/* Dynamic Content Based on Active Section */}
        {activeSection === "profile" && (
          <div>
            <h3>My Profile</h3>
            <p>View and update your personal details here.</p>
          </div>
        )}

        {activeSection === "reports" && (
          <div>
            <h3>My Reports</h3>
            <p>View the reports assigned to you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
