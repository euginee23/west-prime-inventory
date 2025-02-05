import { useState, useEffect } from "react";
import axios from "axios";
import Loading from "react-loading";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function AdminPage({ onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true); 

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "users", label: "Manage Users" },
    { id: "reports", label: "View Reports" },
    { id: "settings", label: "Settings" },
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
      } finally {
        setIsLoading(false); 
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
        position: "relative",
      }}
    >
      {/* Show loader */}
      {isLoading && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(255, 255, 255, 0.7)", borderRadius: "10px" }}
        >
          <Loading type="spin" color="#28a745" height={50} width={50} />
        </div>
      )}

      {/* Top Navigation */}
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-dark"
        style={{
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          borderBottomLeftRadius: "0px",
          borderBottomRightRadius: "0px",
        }}
      >
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">
            {isLoading ? "Loading..." : `Hi, ${userName}`}
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
                    disabled={isLoading}
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
                  disabled={isLoading}
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
        {!isLoading ? (
          <>
            <h1 className="fw-bold mb-4 text-center text-md-start">
              {menuItems.find((i) => i.id === activeSection)?.label}
            </h1>

            {/* Dynamic Content Based on Active Section */}
            {activeSection === "dashboard" && (
              <div className="row gx-3 gy-4">
                <div className="col-lg-4 col-md-6 col-12">
                  <div
                    className="card shadow-sm p-3 text-center"
                    style={{ height: "150px", borderRadius: "10px" }}
                  >
                    <h5>Total Users</h5>
                    <p className="display-6">1,234</p>
                  </div>
                </div>
                <div className="col-lg-4 col-md-6 col-12">
                  <div
                    className="card shadow-sm p-3 text-center"
                    style={{ height: "150px", borderRadius: "10px" }}
                  >
                    <h5>Active Sessions</h5>
                    <p className="display-6">56</p>
                  </div>
                </div>
                <div className="col-lg-4 col-md-6 col-12">
                  <div
                    className="card shadow-sm p-3 text-center"
                    style={{ height: "150px", borderRadius: "10px" }}
                  >
                    <h5>Reports Generated</h5>
                    <p className="display-6">12</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "users" && (
              <div>
                <h3>Manage Users</h3>
                <p>
                  This is the Manage Users section. You can add, edit, or delete
                  users here.
                </p>
              </div>
            )}

            {activeSection === "reports" && (
              <div>
                <h3>View Reports</h3>
                <p>This is the View Reports section. Access system reports here.</p>
              </div>
            )}

            {activeSection === "settings" && (
              <div>
                <h3>Settings</h3>
                <p>
                  This is the Settings section. Customize your dashboard settings
                  here.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <Loading type="spin" color="#28a745" height={60} width={60} />
            <p>Loading content...</p>
          </div>
        )}
      </div>
    </div>
  );
}
