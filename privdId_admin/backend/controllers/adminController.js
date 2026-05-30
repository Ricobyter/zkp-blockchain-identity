import jwt from "jsonwebtoken";

import { asyncHandler } from "../middleware/asyncHandler.js";
import AppError from "../utils/appError.js";

export const adminLogin = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new AppError("Admin authentication is not configured. Set ADMIN_PASSWORD in .env", 500);
  }

  if (!password || password !== adminPassword) {
    throw new AppError("Invalid admin password.", 401);
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET || "privid-admin-secret",
    { expiresIn: "24h" }
  );

  res.json({
    status: "success",
    token,
  });
});
