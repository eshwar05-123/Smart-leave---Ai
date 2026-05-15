import { useEffect, useState } from "react";
import api from "../api.js";
import VoiceCapture from "../components/VoiceCapture.jsx";

const REASONS_DEFAULT = ["Fever", "Medical Emergency", "Exam", "Travel", "Personal Emergency", "Other"];

function urgencyColor(u) {
  if (u === "critical" || u === "high") return "var(--danger)";
  if (u === "medium") return "var(--warning)";
  return "var(--success)";
}

function hrLabel(r) {
  if (r === "urgent_attention") return "Urgent attention";
  if (r === "approve") return "Approve";
  return "Review";
}

export default function EmployeeHome() {
  const [reasons, setReasons] = useState(REASONS_DEFAULT);
  const [reasonType, setReasonType] = useState("Fever");
  const [userNotes, setUserNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api
      .get("/leave/reasons")
      .then((r) => setReasons(r.data.reasons))
      .catch(() => {});
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data } = await api.get("/leave/mine");
    setHistory(data.leaves);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setLast(null);
    try {
      const { data } = await api.post("/leave/request", { reasonType, userNotes, startDate, endDate });
      setLast(data.leave);
      await loadHistory();
    } catch (ex) {
      setError(ex.response?.data?.error || "Could not submit leave");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Apply for leave</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>Pick a reason, add context (or use voice), and let SmartLeave draft your request with urgency and HR routing hints.</p>
      </div>

      <div className="grid2">
        <form className="card" onSubmit={submit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <span className="label">Reason</span>
            <div className="pill-row" style={{ marginTop: 6 }}>
              {reasons.map((r) => (
                <button key={r} type="button" className={`pill ${reasonType === r ? "active" : ""}`} onClick={() => setReasonType(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="grid2" style={{ gap: "0.75rem" }}>
            <div>
              <label className="label">Start date</label>
              <input className="input" type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="label">End date</label>
              <input className="input" type="date" value={endDate} min={startDate || today} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={4} value={userNotes} onChange={(e) => setUserNotes(e.target.value)} placeholder="Short context for HR…" />
            <VoiceCapture onText={(t) => setUserNotes((prev) => (prev ? `${prev}\n${t}` : t))} />
          </div>
          {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Analyzing with AI…" : "Generate & submit request"}
          </button>
        </form>

        <div className="card" style={{ minHeight: 280 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>AI output</h2>
          {!last && <p style={{ color: "var(--muted)" }}>Submit a request to see generated copy, urgency, duration suggestion, and HR recommendation.</p>}
          {last && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <span className="badge" style={{ borderColor: urgencyColor(last.urgency), color: "var(--text)" }}>
                  Urgency: {last.urgency}
                </span>
                <span className="badge">Suggest {last.suggestedDurationDays} day(s)</span>
                <span className="badge badge-ok">HR: {hrLabel(last.hrRecommendation)}</span>
                {last.suspiciousPattern && <span className="badge badge-urgent">Suspicious pattern</span>}
              </div>
              {last.suspiciousPattern && (
                <div style={{ fontSize: "0.9rem", color: "var(--warning)" }}>{last.suspiciousReason || "Flagged for review."}</div>
              )}
              <div>
                <div className="label">Prediction</div>
                <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>{last.aiPredictionSummary}</div>
              </div>
              <div>
                <div className="label">Generated message</div>
                <div className="mono" style={{ background: "var(--bg)", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}>
                  {last.aiGeneratedMessage}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Your requests</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                <th style={{ padding: "0.5rem 0" }}>When</th>
                <th>Reason</th>
                <th>Urgency</th>
                <th>HR hint</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.55rem 0" }}>{new Date(h.createdAt).toLocaleString()}</td>
                  <td>{h.reasonType}</td>
                  <td>{h.urgency}</td>
                  <td>{hrLabel(h.hrRecommendation)}</td>
                  <td>{h.status}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "1rem 0", color: "var(--muted)" }}>
                    No requests yet.
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
