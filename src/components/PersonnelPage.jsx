import { useState } from "react";
import Loading from "react-loading";
import ProfileSettings from "./common_components/ProfileSettings";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { getLoggedInUser, logout } from "../utils/auth"; 

export default function PersonnelPage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const user = getLoggedInUser();

  const menuItems = [
    { id: "scan", label: "Scan" },
    { id: "track", label: "Track" },
    { id: "equipments", label: "Equipments" },
    { id: "reports", label: "Reports" },
    { id: "profile-settings", label: "Profile Settings" },
  ];

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "10px",
        margin: "10px",
        height: "calc(100vh - 20px)",
        overflow: "hidden",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        position: "relative",
      }}
    >
      {/* Top Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark" style={{ borderRadius: "10px 10px 0 0" }}>
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">
            Hi, {user?.firstName || "Personnel"} {user?.lastName || ""}
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
                  onClick={logout} 
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
      <div
        className="container-fluid px-4 py-3"
        style={{
          height: "calc(100vh - 75px)", 
          overflowY: "auto", 
        }}
      >
        <div className="row gx-3 gy-4">
          {activeSection === "dashboard" && <div>Welcome to your dashboard.</div>}
          {activeSection === "scan" && <div>Scan QR codes for quick item tracking.</div>}
          {activeSection === "track" && <div>Track equipment and personnel activities.</div>}
          {activeSection === "equipments" && <div>View and manage equipment inventory.</div>}
          {activeSection === "reports" && <div>View reports assigned to you.</div>}
          {activeSection === "profile-settings" && <ProfileSettings />}
        </div>
      </div>
    </div>
  );
}
