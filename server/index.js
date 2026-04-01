require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const stylesRoutes = require("./routes/styles");

const app = express();

const defaultOrigins = ["http://localhost:3000", "http://localhost:8080"];
const extraOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...defaultOrigins, ...extraOrigins];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Crown Studio API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/styles", stylesRoutes);

// Placeholder route groups (future phases).
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

