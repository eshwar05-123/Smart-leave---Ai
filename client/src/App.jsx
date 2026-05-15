import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import EmployeeHome from "./pages/EmployeeHome.jsx";
import HRDashboard from "./pages/HRDashboard.jsx";

function Protected({ children, hrOnly }) {
  const { token, user, isHr } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (hrOnly && !isHr) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, logout, isHr } = useAuth();
  const nav = useNavigate();

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand">
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,var(--accent),var(--accent2))",
                display: "grid",
                placeItems: "center",
                fontSize: 18,
              }}
            >
              SL
            </span>
            <span>SmartLeave AI</span>
          </div>
        </Link>
        <nav style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {user && (
            <>
              <span className="badge">{user.name}</span>
              {isHr && (
                <Link to="/hr">
                  <button type="button" className="btn btn-ghost">
                    HR Dashboard
                  </button>
                </Link>
              )}
              <button
                type="button"
                className="btn"
                onClick={() => {
                  logout();
                  nav("/login");
                }}
              >
                Log out
              </button>
            </>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Protected>
              <EmployeeHome />
            </Protected>
          }
        />
        <Route
          path="/hr"
          element={
            <Protected hrOnly>
              <HRDashboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
