import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../api.js";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("sl_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem("sl_token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("sl_token", token);
      setAuthToken(token);
    } else {
      localStorage.removeItem("sl_token");
      localStorage.removeItem("sl_user");
      setAuthToken(null);
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      setSession: (t, u) => {
        setToken(t);
        setUser(u);
        if (u) localStorage.setItem("sl_user", JSON.stringify(u));
        else localStorage.removeItem("sl_user");
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("sl_user");
      },
      isHr: user?.role === "hr",
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
