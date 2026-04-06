const rateLimit = require("express-rate-limit");

const windowMs = 15 * 60 * 1000;

/** All /api/auth routes (stack with strictLimiter on login for tighter cap). */
const authLimiter = rateLimit({
  windowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Do not count 2xx/3xx so repeated successful logins (e.g. account switching) are not capped here.
  skipSuccessfulRequests: true,
  message: { success: false, error: "Too many auth attempts, please try again later" },
});

/** Non-auth /api routes — applied in index.js with /api/auth skipped. */
const apiLimiter = rateLimit({
  windowMs,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later" },
});

/** Login only — stricter cap to slow credential stuffing (failed attempts only). */
const strictLimiter = rateLimit({
  windowMs,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Successful 2xx/3xx logins do not count, so dev and account-switching are not penalized.
  skipSuccessfulRequests: true,
  message: { success: false, error: "Too many login attempts, please try again later" },
});

module.exports = { authLimiter, apiLimiter, strictLimiter };
