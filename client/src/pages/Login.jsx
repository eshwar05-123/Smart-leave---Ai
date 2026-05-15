import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { setSession } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession(data.token, data.user);
      nav(data.user.role === "hr" ? "/hr" : "/");
    } catch (ex) {
      setErr(ex.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "3rem auto" }}>
      <h1 style={{ marginTop: 0 }}>Welcome back</h1>
      <p style={{ color: "var(--muted)", marginTop: "-0.5rem" }}>Sign in to manage leave with AI assistance.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", marginTop: "1.25rem" }}>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err && <div style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{err}</div>}
        <button className="btn btn-primary" type="submit">
          Sign in
        </button>
      </form>
      <p style={{ marginTop: "1rem", color: "var(--muted)" }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
