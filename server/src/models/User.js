import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["employee", "hr"], default: "employee" },
    department: { type: String, default: "General" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
