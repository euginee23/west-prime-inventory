import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import AdminPage from "./components/AdminPage";
import PersonnelPage from "./components/PersonnelPage";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./assets/ict_lab2.jpg";

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");

    if (savedToken && savedRole) {
      setUser({ token: savedToken, role: savedRole });
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate(user.role === "Admin" ? "/admin" : "/personnel");
    }
  }, [user, navigate]);

  const handleLogin = (username, role, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setUser({ token, role });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
  };

  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Routes>
        <Route
          path="/login"
          element={
            <div className="vh-100 vw-100 d-flex align-items-center justify-content-center text-white">
              <Login onLogin={handleLogin} />
            </div>
          }
        />
        {user ? (
          <>
            {user.role === "Admin" ? (
              <Route path="/admin" element={<AdminPage onLogout={handleLogout} />} />
            ) : (
              <Route path="/personnel" element={<PersonnelPage onLogout={handleLogout} />} />
            )}
            <Route path="*" element={<Navigate to={user.role === "Admin" ? "/admin" : "/personnel"} />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
