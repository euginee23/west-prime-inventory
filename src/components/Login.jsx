import { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Loading from "react-loading"; 
import logo from "../assets/wmsu_logo.png";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
  
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/login`;
      const response = await axios.post(apiUrl, { username, password });
  
      if (response.data.token) {
        localStorage.setItem("user_id", response.data.user_id);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("first_name", response.data.first_name);
        localStorage.setItem("last_name", response.data.last_name);
  
        onLogin(username, response.data.role, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };  

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center">
        <div className="col-12 col-md-5 text-center text-md-start">
          <img
            src={logo}
            alt="Logo"
            className="img-fluid mb-4 animated fadeIn"
            style={{
              width: "200px",
              maxWidth: "100%",
              animationDuration: "1s",
            }}
          />
          <h1 className="fw-bold mb-3 text-shadow">ICT Equipment Monitoring and Tracking System</h1>
          <p className="text-shadow lead">Equipment Monitoring and Tracking System</p>
        </div>

        <div className="col-12 col-md-6">
          <div
            className="p-4 rounded shadow-lg mx-auto position-relative"
            style={{
              maxWidth: "400px",
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
            }}
          >
            {isLoading && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ background: "rgba(255, 255, 255, 0.7)", borderRadius: "10px" }}
              >
                <Loading type="spin" color="#28a745" height={50} width={50} />
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-2">
                <label htmlFor="username" className="form-label text-dark">
                  Username:
                </label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{ borderRadius: "0.375rem", boxShadow: "none" }}
                />
              </div>

              <div className="mb-2">
                <label htmlFor="password" className="form-label text-dark">
                  Password:
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{ borderRadius: "0.375rem", boxShadow: "none" }}
                />
              </div>

              {error && <p className="text-danger">{error}</p>}

              <button
                type="submit"
                className="btn btn-success w-100 py-2 mt-3 rounded-3"
                disabled={isLoading}
                style={{ fontSize: "1.2rem", letterSpacing: "1px", transition: "background-color 0.3s ease" }}
              >
                {isLoading ? "Logging in..." : "LOG IN"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// PropTypes validation
Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
};
