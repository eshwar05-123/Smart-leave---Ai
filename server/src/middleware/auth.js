import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "smartleave-dev-secret-change-me";

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, email: user.email }, secret(), { expiresIn: "7d" });
}

export function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, secret());
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireHr(req, res, next) {
  if (req.user?.role !== "hr") return res.status(403).json({ error: "HR role required" });
  next();
}
