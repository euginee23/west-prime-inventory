import { useState } from "react";
import Loading from "react-loading";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { getLoggedInUser, logout } from "../utils/auth"; 
import ProfileSettings from "./common_components/ProfileSettings";
import Laboratories from "./admin_components/Laboratories";
import Personnels from "./admin_components/Personnels";
import Equipments from "./admin_components/Equipments";
import ScanEquipment from "./admin_components/ScanEquipment";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const user = getLoggedInUser();

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

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "10px",
        margin: "10px",
        height: "calc(100vh - 20px)",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Navigation */}
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-dark"
        style={{
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
        }}
      >
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">
            Hi, {user?.firstName || "Admin"} {user?.lastName || ""}
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNav"
            aria-controls="adminNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="adminNav">
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

      {/* Scrollable Main Content Area */}
      <div
        className="container-fluid px-4 py-3"
        style={{
          flex: "1",
          overflowY: "auto",
          maxHeight: "calc(100vh - 70px)",
          paddingBottom: "10px",
        }}
      >
        <div className="row gx-3 gy-4">
          {activeSection === "dashboard" && <div>Dashboard Content</div>}
          {activeSection === "equipments" && <Equipments />}
          {activeSection === "laboratories" && <Laboratories />}
          {activeSection === "personnels" && <Personnels />}
          {activeSection === "scan" && <ScanEquipment/>}
          {activeSection === "track" && <div>Track Equipments</div>}
          {activeSection === "reports" && <div>Reports Section</div>}
          {activeSection === "profile-settings" && <ProfileSettings />}
        </div>
      </div>
    </div>
  );
}
