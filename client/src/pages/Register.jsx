import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { setSession } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [role, setRole] = useState("employee");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/auth/register", { name, email, password, department, role });
      setSession(data.token, data.user);
      nav(data.user.role === "hr" ? "/hr" : "/");
    } catch (ex) {
      setErr(ex.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: "2rem auto" }}>
      <h1 style={{ marginTop: 0 }}>Create account</h1>
      <p style={{ color: "var(--muted)", marginTop: "-0.5rem" }}>Employees submit AI-assisted requests; HR users get the analytics dashboard.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", marginTop: "1.25rem" }}>
        <div>
          <label className="label">Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <div>
          <label className="label">Department</label>
          <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="hr">HR / Admin</option>
          </select>
        </div>
        {err && <div style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{err}</div>}
        <button className="btn btn-primary" type="submit">
          Register
        </button>
      </form>
      <p style={{ marginTop: "1rem", color: "var(--muted)" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
