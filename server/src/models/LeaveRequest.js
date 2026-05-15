import mongoose from "mongoose";

const REASONS = ["Fever", "Medical Emergency", "Exam", "Travel", "Personal Emergency", "Other"];

const leaveRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reasonType: { type: String, enum: REASONS, required: true },
    userNotes: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    aiGeneratedMessage: { type: String, default: "" },
    urgency: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    suggestedDurationDays: { type: Number, default: 1 },
    hrRecommendation: { type: String, enum: ["approve", "review", "urgent_attention"], default: "review" },
    suspiciousPattern: { type: Boolean, default: false },
    suspiciousReason: { type: String, default: "" },
    aiPredictionSummary: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const LEAVE_REASONS = REASONS;
export default mongoose.model("LeaveRequest", leaveRequestSchema);
