import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role === "hr" ? "hr" : "employee",
      department: department || "General",
    });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
