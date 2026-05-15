import express from "express";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import { authMiddleware, requireHr } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", authMiddleware, requireHr, async (_req, res) => {
  const [total, pending, emergency, suspicious] = await Promise.all([
    LeaveRequest.countDocuments(),
    LeaveRequest.countDocuments({ status: "pending" }),
    LeaveRequest.countDocuments({
      reasonType: { $in: ["Medical Emergency", "Personal Emergency"] },
      status: "pending",
    }),
    LeaveRequest.countDocuments({ suspiciousPattern: true }),
  ]);

  const byReason = await LeaveRequest.aggregate([
    { $group: { _id: "$reasonType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const byMonth = await LeaveRequest.aggregate([
    {
      $group: {
        _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
    { $limit: 12 },
  ]);

  const headcount = await User.countDocuments({ role: "employee" });

  res.json({
    totalRequests: total,
    pending,
    pendingEmergency: emergency,
    suspiciousCount: suspicious,
    employeeCount: headcount,
    byReason: byReason.map((r) => ({ reason: r._id, count: r.count })),
    byMonth: byMonth.map((r) => ({ label: `${r._id.y}-${String(r._id.m).padStart(2, "0")}`, count: r.count })),
  });
});

router.get("/employee/:userId/history", authMiddleware, requireHr, async (req, res) => {
  const leaves = await LeaveRequest.find({ user: req.params.userId }).sort({ createdAt: -1 }).lean();
  res.json({ leaves });
});

export default router;
