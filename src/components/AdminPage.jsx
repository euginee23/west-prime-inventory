import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { getLoggedInUser, logout } from "../utils/auth";
import ProfileSettings from "./common_components/ProfileSettings";
import Laboratories from "./admin_components/Laboratories";
import Personnels from "./admin_components/Personnels";
import Equipments from "./admin_components/Equipments";
import ScanEquipment from "./admin_components/ScanEquipment";
import Dashboard from "./admin_components/Dashboard";
import ReLoginModal from "../components/modals/ReloginModal";
import Track from "./common_components/Track";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showReLoginModal, setShowReLoginModal] = useState(false);
  const user = getLoggedInUser();

  useEffect(() => {
    if (!user) {
    }
  }, [user]);

  const handleReLogin = () => {
    logout();
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "equipments", label: "Equipments" },
    { id: "laboratories", label: "Laboratories" },
    { id: "personnels", label: "Personnels" },
    { id: "scan", label: "Scan" },
    { id: "track", label: "Track" },
    { id: "reports", label: "Reports" },
    { id: "profile-settings", label: "Profile Settings" },
  ];

  const currentSection =
    menuItems.find((item) => item.id === activeSection)?.label ||
    "Administrator Panel";

  return (
    <div
      className="d-flex flex-column"
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        overflow: "hidden",
      }}
    >
      {/* Re-login Modal */}
      <ReLoginModal show={showReLoginModal} onReLogin={handleReLogin} />

      {/* Top Navigation */}
      <nav
        className="navbar navbar-dark bg-dark px-2 py-1 d-flex align-items-center"
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
            Hi, {user?.firstName || "Admin"} {user?.lastName || ""}
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
        {activeSection === "dashboard" && <Dashboard />}
        {activeSection === "equipments" && <Equipments />}
        {activeSection === "laboratories" && <Laboratories />}
        {activeSection === "personnels" && <Personnels />}
        {activeSection === "scan" && <ScanEquipment />}
        {activeSection === "track" && <Track />}
        {activeSection === "reports" && <div>Reports Section</div>}
        {activeSection === "profile-settings" && <ProfileSettings />}
      </div>
    </div>
  );
}
