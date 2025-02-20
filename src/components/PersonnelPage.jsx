import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getLoggedInUser, logout } from "../utils/auth";
import ProfileSettings from "./common_components/ProfileSettings";

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

  const currentSection =
    menuItems.find((item) => item.id === activeSection)?.label || "Administrator Panel";

  return (
    <div
      className="d-flex flex-column"
      style={{
        height: "100dvh",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderRadius: "10px",
        margin: "10px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        overflow: "hidden",
      }}
    >
      {/* Top Navigation */}
      <nav
        className="navbar navbar-dark bg-dark px-2 py-1 rounded-top d-flex align-items-center"
        style={{ minHeight: "40px" }}
      >
        <div className="d-flex align-items-center">
          <button
            className="btn btn-outline-light btn-sm d-flex align-items-center justify-content-center"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasNav"
            style={{ width: "30px", height: "30px", padding: "0" }}
          >
            <span
              className="navbar-toggler-icon"
              style={{ transform: "scale(0.8)" }}
            ></span>
          </button>
          <span className="text-white ms-2" style={{ fontSize: "0.85rem" }}>
            Menu
          </span>
        </div>

        <div
          className="text-white text-center flex-grow-1 d-none d-md-block"
          style={{ fontSize: "1.2rem", fontWeight: "bold", color: "blue" }}
        >
          {currentSection}
        </div>

        <div className="d-flex align-items-center ms-auto">
          <span
            className="navbar-brand fw-semibold me-2 text-white"
            style={{ fontSize: "0.85rem", paddingTop: "2px" }}
          >
            Hi, {user?.firstName || "Personnel"} {user?.lastName || ""}
          </span>
          <button
            className="btn btn-link p-0"
            onClick={() => setActiveSection("profile-settings")}
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <i
              className="fas fa-user-circle text-white"
              style={{ fontSize: "1.8rem" }}
            ></i>
          </button>
        </div>
      </nav>

      {/* Offcanvas Sidebar Menu */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white"
        tabIndex="-1"
        id="offcanvasNav"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Menu</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
          ></button>
        </div>
        <div className="offcanvas-body">
          <ul className="nav flex-column">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <button
                  className={`btn btn-link text-white nav-link ${
                    activeSection === item.id ? "fw-bold" : ""
                  }`}
                  onClick={() => setActiveSection(item.id)}
                  data-bs-dismiss="offcanvas"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <button className="btn btn-danger w-100 mt-3" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area with Scrollable Content */}
      <div
        className="container-fluid flex-grow-1 overflow-auto p-3"
        style={{
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
        }}
      >
        {activeSection === "dashboard" && <div>Welcome to your dashboard.</div>}
        {activeSection === "scan" && (
          <div>Scan QR codes for quick item tracking.</div>
        )}
        {activeSection === "track" && (
          <div>Track equipment and personnel activities.</div>
        )}
        {activeSection === "equipments" && (
          <div>View and manage equipment inventory.</div>
        )}
        {activeSection === "reports" && (
          <div>View reports assigned to you.</div>
        )}
        {activeSection === "profile-settings" && <ProfileSettings />}
      </div>
    </div>
  );
}
