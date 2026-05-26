import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes.js";
import propertyRoutes from "./modules/property/property.routes.js";
import unitRoutes from "./modules/unit/unit.routes.js";
import tenantRoutes from "./modules/tenant/tenant.routes.js";
import leaseRoutes from "./modules/lease/lease.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import invoiceRoutes from "./modules/invoice/invoice.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import waterRoutes from "./modules/water/water.routes.js";

import { requireAuth } from "./middleware/auth.js";

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Rental Management API running..." });
});

// Auth routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Protected test route (JWT verification)
app.get("/me", requireAuth, (req, res) => {
  res.json({
    message: "User data fetched successfully",
    user: req.user,
  });
});

// Feature routes
app.use("/properties", propertyRoutes);
app.use("/units", unitRoutes);
app.use("/tenants", tenantRoutes);
app.use("/leases", leaseRoutes);
app.use("/payments", paymentRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/water", waterRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});