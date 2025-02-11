export const getLoggedInUser = () => {
    const user = {
      user_id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token"),
      role: localStorage.getItem("role"),
      firstName: localStorage.getItem("first_name"),
      lastName: localStorage.getItem("last_name"),
    };
  
    return user.token ? user : null; 
  };
  
  export const isAuthenticated = () => {
    return !!localStorage.getItem("token"); 
  };
  
  export const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };
  