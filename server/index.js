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

function isGitHubPagesOrigin(origin) {
  if (!origin || typeof origin !== "string") {
    return false;
  }
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && !u.port && /\.github\.io$/i.test(u.hostname);
  } catch {
    return false;
  }
}

// Allow explicit CORS_ORIGINS plus any https://*.github.io (user/org Pages) so Render works without env churn.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || isGitHubPagesOrigin(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
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

