import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

// Custom hook so components can just do: const { user, login } = useAuth();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check if already logged in

  // On first app load, check if a valid cookie already exists (e.g. page refresh)
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const res = await api.get("/users/profile");
        setUser(res.data);
      } catch (error) {
        setUser(null); // no valid cookie — user is logged out
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const register = async (name, email, password) => {
    const res = await api.post("/users/register", { name, email, password });
    setUser(res.data);
  };

  const login = async (email, password) => {
    const res = await api.post("/users/login", { email, password });
    setUser(res.data);
  };

  const logout = async () => {
    await api.post("/users/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};