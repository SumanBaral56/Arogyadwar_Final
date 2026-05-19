const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { generateOtp, addMs, sendOtpSms, sendOtpMock } = require("../utils/otp");


function pickContactIdentifiers(contactMethod, body) {
  if (contactMethod === "email") {
    return { email: String(body.email || "").trim().toLowerCase(), phone: undefined };
  }
  // Normalize phone digits only
  const digits = String(body.phone || "").replace(/[^0-9]/g, "");
  return { phone: digits, email: undefined };
}

const LOGIN_CHALLENGE_TYP = "login_challenge";
const ACCESS_TYP = "access";

function signAccessToken(user) {
  return jwt.sign(
    {
      typ: ACCESS_TYP,
      sub: user._id.toString(),
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" },
  );
}

function signLoginChallenge(userId) {
  return jwt.sign(
    { typ: LOGIN_CHALLENGE_TYP, sub: userId.toString() },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_LOGIN_CHALLENGE_EXPIRES_IN || "10m" },
  );
}

/** @returns {{ sub: string } | null} */
function decodeLoginChallengeToken(token) {
  try {
    const p = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (p.typ !== LOGIN_CHALLENGE_TYP || !p.sub) return null;
    return p;
  } catch {
    return null;
  }
}

async function signup(req, res, next) {
  try {
    const { fullName, contactMethod, email, phone, password } = req.validatedBody;

    const identifiers = pickContactIdentifiers(contactMethod, { email, phone });

    // Prevent duplicates.
    const duplicateQuery = {
      $or: [
        identifiers.email ? { email: identifiers.email } : null,
        identifiers.phone ? { phone: identifiers.phone } : null,
      ].filter(Boolean),
    };

    const existing = await User.findOne(duplicateQuery);
    if (existing) {
      return res.status(409).json({ message: "Email or phone already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await User.create({
      fullName,
      email: identifiers.email,
      phone: identifiers.phone,
      passwordHash,
      otp: null,
      otpExpiry: null,
      loginOtp: null,
      loginOtpExpiry: null,
    });

    return res.status(201).json({
      message: "Signup successful",
      user: { id: created._id, fullName: created.fullName, email: created.email, phone: created.phone },
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { contactMethod, email, phone, password } = req.validatedBody;

    const identifiers = pickContactIdentifiers(contactMethod, { email, phone });

    const user = await User.findOne({
      ...(identifiers.email ? { email: identifiers.email } : {}),
      ...(identifiers.phone ? { phone: identifiers.phone } : {}),
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const otp = generateOtp();
    const expiry = addMs(Number(process.env.OTP_EXPIRES_IN_MS || 5 * 60 * 1000));
    user.loginOtp = otp;
    user.loginOtpExpiry = expiry;
    await user.save();

    const destination = identifiers.email || identifiers.phone;
    // For phone OTP you must set OTP_SEND_PROVIDER=twilio (and Twilio env vars)
    await sendOtpSms({ destination, otp }).catch(async (e) => {
      // Fallback to console mock to avoid breaking auth flow during integration
      console.warn("sendOtpSms failed, falling back to mock:", e?.message || e);
      return sendOtpMock({ destination, otp });
    });


    const loginChallengeToken = signLoginChallenge(user._id);

    return res.status(200).json({
      message: "Verification code sent.",
      requiresOtp: true,
      delivery: contactMethod,
      loginChallengeToken,
    });
  } catch (err) {
    return next(err);
  }
}

async function verifyLoginOtp(req, res, next) {
  try {
    const { loginChallengeToken, otp } = req.validatedBody;

    const payload = decodeLoginChallengeToken(loginChallengeToken);
    if (!payload) {
      return res.status(401).json({ message: "Login session expired. Sign in again." });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.loginOtp || !user.loginOtpExpiry) {
      return res.status(400).json({ message: "OTP invalid or expired" });
    }

    if (String(user.loginOtp) !== String(otp)) {
      return res.status(400).json({ message: "OTP invalid" });
    }

    if (user.loginOtpExpiry.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.loginOtp = null;
    user.loginOtpExpiry = null;
    await user.save();

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone },
    });
  } catch (err) {
    return next(err);
  }
}

async function resendLoginOtp(req, res, next) {
  try {
    const { loginChallengeToken } = req.validatedBody;

    const payload = decodeLoginChallengeToken(loginChallengeToken);
    if (!payload) {
      return res.status(401).json({ message: "Login session expired. Sign in again." });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Login session expired. Sign in again." });
    }

    const otp = generateOtp();
    const expiry = addMs(Number(process.env.OTP_EXPIRES_IN_MS || 5 * 60 * 1000));
    user.loginOtp = otp;
    user.loginOtpExpiry = expiry;
    await user.save();

    const destination = user.email || user.phone;
    if (destination) {
      await sendOtpSms({ destination, otp }).catch(async (e) => {
        console.warn("sendOtpSms failed, falling back to mock:", e?.message || e);
        return sendOtpMock({ destination, otp });
      });
    }


    return res.status(200).json({ message: "OTP resent" });
  } catch (err) {
    return next(err);
  }
}

async function requestPasswordResetOtp(req, res, next) {
  try {
    const { contactMethod, email, phone } = req.validatedBody;

    const identifiers = pickContactIdentifiers(contactMethod, { email, phone });

    const user = await User.findOne({
      ...(identifiers.email ? { email: identifiers.email } : {}),
      ...(identifiers.phone ? { phone: identifiers.phone } : {}),
    });

    if (!user) {
      // Avoid user enumeration - same response.
      return res.status(200).json({ message: "If the account exists, an OTP has been sent." });
    }

    const otp = generateOtp();
    const expiry = addMs(Number(process.env.OTP_EXPIRES_IN_MS || 5 * 60 * 1000));

    user.otp = otp;
    user.otpExpiry = expiry;
    user.loginOtp = null;
    user.loginOtpExpiry = null;
    await user.save();

    const destination = identifiers.email || identifiers.phone;

    await sendOtpSms({ destination, otp }).catch(async (e) => {
      console.warn("sendOtpSms failed, falling back to mock:", e?.message || e);
      return sendOtpMock({ destination, otp });
    });

    return res.status(200).json({ message: "OTP sent" });

  } catch (err) {
    return next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { contactMethod, email, phone, otp } = req.validatedBody;

    const identifiers = pickContactIdentifiers(contactMethod, { email, phone });

    const user = await User.findOne({
      ...(identifiers.email ? { email: identifiers.email } : {}),
      ...(identifiers.phone ? { phone: identifiers.phone } : {}),
    });

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "OTP invalid or expired" });
    }

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({ message: "OTP invalid" });
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    return res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { contactMethod, email, phone, otp, newPassword } = req.validatedBody;

    const identifiers = pickContactIdentifiers(contactMethod, { email, phone });

    const user = await User.findOne({
      ...(identifiers.email ? { email: identifiers.email } : {}),
      ...(identifiers.phone ? { phone: identifiers.phone } : {}),
    });

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "OTP invalid or expired" });
    }

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({ message: "OTP invalid" });
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;

    // Clear OTP so it can't be reused.
    user.otp = null;
    user.otpExpiry = null;
    user.loginOtp = null;
    user.loginOtpExpiry = null;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signup,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  requestPasswordResetOtp,
  verifyOtp,
  resetPassword,
};

