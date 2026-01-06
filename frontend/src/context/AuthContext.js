import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  // -----------------------------
  // Fetch Logged-in User
  // -----------------------------
  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/users/me`);
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [API]);

  // -----------------------------
  // Run when token changes
  // -----------------------------
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  // -----------------------------
  // Login
  // -----------------------------
  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });

    const { access_token, user: userData } = response.data;

    setToken(access_token);
    setUser(userData);
    localStorage.setItem("token", access_token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

    return userData;
  };

  // -----------------------------
  // Register
  // -----------------------------
  const register = async (email, name, password, role = "student") => {
    const response = await axios.post(`${API}/auth/register`, {
      email,
      name,
      password,
      role
    });

    const { access_token, user: userData } = response.data;

    setToken(access_token);
    setUser(userData);
    localStorage.setItem("token", access_token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

    return userData;
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  };

  // -----------------------------
  // Provider
  // -----------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isStudent: user?.role === "student"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
