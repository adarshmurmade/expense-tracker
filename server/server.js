import connectDB from "./config/db.js";
import express from "express";
import dotenv from "dotenv";
import dns from "dns";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./Routes/transactionRoutes.js";
import aiRoutes from "./Routes/aiRoutes.js";
import budgetRoutes from "./Routes/budgetRoutes.js";
import profileRoutes from "./Routes/profileRoutes.js";
import passwordRoutes from "./Routes/passwordRoutes.js";
import notificationRoutes from "./Routes/notificationRoutes.js";
dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/budgets", budgetRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/notifications", notificationRoutes);

// Database
await connectDB();

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ExpenseFlow API is running 🚀",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`ExpenseFlow API running on port ${PORT}`);
});