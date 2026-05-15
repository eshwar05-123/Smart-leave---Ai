import express from "express";
import LeaveRequest, { LEAVE_REASONS } from "../models/LeaveRequest.js";
import User from "../models/User.js";
import { authMiddleware, requireHr } from "../middleware/auth.js";
import { analyzeLeaveRequest } from "../services/gemini.js";

const router = express.Router();

function daysBetween(a, b) {
  const ms = Math.max(0, new Date(b) - new Date(a));
  return Math.ceil(ms / (86400000)) + 1;
}

router.get("/reasons", (_req, res) => {
  res.json({ reasons: LEAVE_REASONS });
});

router.post("/request", authMiddleware, async (req, res) => {
  try {
    const { reasonType, userNotes, startDate, endDate } = req.body;
    if (!reasonType || !startDate || !endDate) return res.status(400).json({ error: "Missing required fields" });
    if (!LEAVE_REASONS.includes(reasonType)) return res.status(400).json({ error: "Invalid reason" });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return res.status(400).json({ error: "endDate must be on or after startDate" });

    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    const requestedDays = daysBetween(start, end);

    const ai = await analyzeLeaveRequest({
      employeeName: user.name,
      department: user.department,
      reasonType,
      userNotes: userNotes || "",
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      requestedDays,
    });

    const doc = await LeaveRequest.create({
      user: user._id,
      reasonType,
      userNotes: userNotes || "",
      startDate: start,
      endDate: end,
      aiGeneratedMessage: ai.generated_message,
      urgency: ai.urgency,
      suggestedDurationDays: ai.suggested_duration_days,
      hrRecommendation: ai.hr_recommendation,
      suspiciousPattern: ai.suspicious_pattern,
      suspiciousReason: ai.suspicious_reason,
      aiPredictionSummary: ai.ai_prediction_summary,
    });

    res.json({ leave: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Server error" });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  const list = await LeaveRequest.find({ user: req.user.sub }).sort({ createdAt: -1 }).lean();
  res.json({ leaves: list });
});

router.get("/all", authMiddleware, requireHr, async (_req, res) => {
  const list = await LeaveRequest.find()
    .populate("user", "name email department role")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ leaves: list });
});

router.patch("/:id/status", authMiddleware, requireHr, async (req, res) => {
  const { status } = req.body;
  if (!["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  const updated = await LeaveRequest.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate("user", "name email department");
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ leave: updated });
});

export default router;
