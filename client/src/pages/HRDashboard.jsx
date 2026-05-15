import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api.js";

function hrLabel(r) {
  if (r === "urgent_attention") return "Urgent";
  if (r === "approve") return "Approve";
  return "Review";
}

export default function HRDashboard() {
  const [summary, setSummary] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  async function refresh() {
    setError("");
    try {
      const [s, l] = await Promise.all([api.get("/analytics/summary"), api.get("/leave/all")]);
      setSummary(s.data);
      setLeaves(l.data.leaves);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load dashboard");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const rows = useMemo(() => {
    return leaves.filter((x) => {
      if (filter === "pending") return x.status === "pending";
      if (filter === "emergency") return ["Medical Emergency", "Personal Emergency"].includes(x.reasonType);
      if (filter === "suspicious") return x.suspiciousPattern;
      return true;
    });
  }, [leaves, filter]);

  async function setStatus(id, status) {
    await api.patch(`/leave/${id}/status`, { status });
    await refresh();
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 0.35rem" }}>HR dashboard</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>Monitor volume, emergencies, suspicious signals, and approve or reject in one place.</p>
        </div>
        <Link to="/">
          <button type="button" className="btn btn-ghost">
            Employee view
          </button>
        </Link>
      </div>

      {error && <div style={{ color: "var(--danger)" }}>{error}</div>}

      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: "0.75rem",
          }}
        >
          {[
            ["Total requests", summary.totalRequests],
            ["Pending", summary.pending],
            ["Pending emergencies", summary.pendingEmergency],
            ["Flagged suspicious", summary.suspiciousCount],
            ["Employees", summary.employeeCount],
          ].map(([k, v]) => (
            <div key={k} className="card" style={{ padding: "1rem" }}>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{k}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Requests by reason</h2>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={summary?.byReason || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" />
                <XAxis dataKey="reason" tick={{ fill: "#8b9ab5", fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis tick={{ fill: "#8b9ab5", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#141a24", border: "1px solid #2a3548", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#5b8cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Volume by month</h2>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={summary?.byMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" />
                <XAxis dataKey="label" tick={{ fill: "#8b9ab5", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b9ab5", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#141a24", border: "1px solid #2a3548", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#7c5cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", flex: "1 1 auto" }}>All requests</h2>
          {["all", "pending", "emergency", "suspicious"].map((f) => (
            <button key={f} type="button" className={`pill ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                <th style={{ padding: "0.5rem 0" }}>Employee</th>
                <th>Dept</th>
                <th>Reason</th>
                <th>Dates</th>
                <th>Urgency</th>
                <th>HR AI</th>
                <th>Flags</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h._id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.55rem 0" }}>{h.user?.name}</td>
                  <td>{h.user?.department}</td>
                  <td>{h.reasonType}</td>
                  <td>
                    {new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}
                  </td>
                  <td>{h.urgency}</td>
                  <td>{hrLabel(h.hrRecommendation)}</td>
                  <td>{h.suspiciousPattern ? <span className="badge badge-urgent">Review</span> : "—"}</td>
                  <td>{h.status}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button type="button" className="btn" style={{ padding: "0.35rem 0.6rem" }} onClick={() => setStatus(h._id, "approved")}>
                        Approve
                      </button>
                      <button type="button" className="btn" style={{ padding: "0.35rem 0.6rem" }} onClick={() => setStatus(h._id, "rejected")}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "1rem 0", color: "var(--muted)" }}>
                    No rows for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
