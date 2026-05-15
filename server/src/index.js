import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import leaveRoutes from "./routes/leave.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://smart-leave-ai-s32q.vercel.app"
  ],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1 });
});

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/analytics", analyticsRoutes);

async function main() {
  const uri = process.env.MONGODB_URI ;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`SmartLeave API http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error(err.message || err);
  console.error("Hint: start MongoDB (e.g. from project root: docker compose up -d) or set MONGODB_URI in server/.env");
  process.exit(1);
});
