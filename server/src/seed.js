import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smartleave";

async function run() {
  await mongoose.connect(uri);
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const demos = [
    { name: "Demo Employee", email: "employee@demo.com", role: "employee", department: "Engineering" },
    { name: "Demo HR", email: "hr@demo.com", role: "hr", department: "People Ops" },
  ];

  for (const d of demos) {
    await User.findOneAndUpdate(
      { email: d.email },
      { $set: { ...d, passwordHash } },
      { upsert: true, new: true }
    );
    console.log("Seeded:", d.email, "/ password: demo1234");
  }

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
