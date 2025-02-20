import { jwtDecode } from "jwt-decode";

export const getLoggedInUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decodedToken = jwtDecode(token);  
    const currentTime = Date.now() / 1000; 

    if (decodedToken.exp && decodedToken.exp < currentTime) {
      return null; 
    }

    return {
      user_id: localStorage.getItem("user_id"),
      token,
      role: localStorage.getItem("role"),
      firstName: localStorage.getItem("first_name"),
      lastName: localStorage.getItem("last_name"),
    };
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

export const isAuthenticated = () => !!getLoggedInUser();

export const logout = () => {
  localStorage.clear();
  window.location.href = "/login";
};
