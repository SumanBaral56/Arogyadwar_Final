const rateLimit = require("express-rate-limit");

const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.LOGIN_RATE_LIMIT_MAX || 10);

const loginRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." },
});

const otpStepWindowMs = Number(process.env.OTP_STEP_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const otpStepMax = Number(process.env.OTP_STEP_RATE_LIMIT_MAX || 40);

const otpStepRateLimiter = rateLimit({
  windowMs: otpStepWindowMs,
  max: otpStepMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Try again later." },
});

module.exports = { loginRateLimiter, otpStepRateLimiter };

