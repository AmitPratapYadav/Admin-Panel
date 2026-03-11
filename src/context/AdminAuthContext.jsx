import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("admin_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/admin/me");
        setAdmin(res.data.admin);
      } catch (error) {
        localStorage.removeItem("admin_token");
        setToken(null);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/admin/login", { email, password });

    localStorage.setItem("admin_token", res.data.token);
    setToken(res.data.token);
    setAdmin(res.data.admin);

    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/admin/logout");
    } catch (error) {
      // ignore logout API errors
    }

    localStorage.removeItem("admin_token");
    setToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}