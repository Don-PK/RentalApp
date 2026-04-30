import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./modules/auth/auth.routes.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Rental Management API running..." });
});

// Auth routes
app.use("/auth", authRoutes);

// Protected test route (JWT verification)
app.get("/me", requireAuth, (req, res) => {
  res.json({
    message: "User data fetched successfully",
    user: req.user,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});