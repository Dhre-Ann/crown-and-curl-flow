require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { shopResolver } = require("./middleware/shopResolver");
const authRoutes = require("./routes/auth");
const stylesRoutes = require("./routes/styles");
const appointmentsRoutes = require("./routes/appointments");
const customerRoutes = require("./routes/customer");
const shopsRoutes = require("./routes/shops");

const app = express();

const defaultOrigins = ["http://localhost:3000", "http://localhost:8080"];
const extraOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...defaultOrigins, ...extraOrigins];

// Browsers send Origin as scheme + host only (no path). For GitHub project pages, use https://<user>.github.io — not the full /repo path.
const relaxGithubIo =
  process.env.CORS_ALLOW_GITHUB_PAGES === "1" || process.env.CORS_ALLOW_GITHUB_PAGES === "true";

function isGithubPagesOrigin(origin) {
  try {
    const u = new URL(origin);
    return u.hostname === "github.io" || u.hostname.endsWith(".github.io");
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (relaxGithubIo && isGithubPagesOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    allowedHeaders: ["Content-Type", "Authorization", "x-shop-slug"],
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

// Resolve optional shop tenant from header/query before route handlers (req.shop or null).
app.use(shopResolver);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Crown Studio API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/shops", shopsRoutes);
app.use("/api/styles", stylesRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/customer", customerRoutes);

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

