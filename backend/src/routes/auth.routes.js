const express = require("express");

const { authenticateAccess } = require("../middleware/auth");

const {
  signup,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  requestPasswordResetOtp,
  verifyOtp,
  resetPassword,
} = require("../controllers/auth.controller");

const {
  validateBody,
  signupSchema,
  loginSchema,
  loginVerifyOtpSchema,
  loginResendOtpSchema,
  requestOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} = require("../utils/validators");

const { loginRateLimiter, otpStepRateLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

// Public endpoints.
router.post("/signup", validateBody(signupSchema), signup);
router.post("/login", loginRateLimiter, validateBody(loginSchema), login);
router.post(
  "/login/verify-otp",
  otpStepRateLimiter,
  validateBody(loginVerifyOtpSchema),
  verifyLoginOtp,
);
router.post(
  "/login/resend-otp",
  otpStepRateLimiter,
  validateBody(loginResendOtpSchema),
  resendLoginOtp,
);

router.post(
  "/forgot-password/request-otp",
  validateBody(requestOtpSchema),
  requestPasswordResetOtp,
);
router.post("/forgot-password/verify-otp", validateBody(verifyOtpSchema), verifyOtp);
router.post(
  "/forgot-password/reset-password",
  validateBody(resetPasswordSchema),
  resetPassword,
);

// Example protected route.
router.get("/me", authenticateAccess, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

