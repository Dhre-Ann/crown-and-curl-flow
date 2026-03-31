require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();

// Allow the local frontend only; keep CORS tight for security.
const allowedOrigins = ["http://localhost:3000", "http://localhost:8080"];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check (only API route implemented in Phase 0).
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Crown Studio API is running" });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Placeholder route groups (no routes implemented in Phase 0).
// Styles routes
// Appointments routes
// Payments routes
// Reviews routes
// Uploads routes

module.exports = app;

// Start server when run directly.
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${port}`);
  });
}

