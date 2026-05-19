// OTP utility. Mock sending (logs OTP) for now.
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function now() {
  return new Date();
}

function addMs(ms) {
  return new Date(Date.now() + ms);
}

const { sendTwilioSms } = require("./smsProviders");

function normalizePhoneForSms(phone) {
  // Keep digits only; if user gave +, Twilio wants E.164.
  // We’ll convert leading 00 to + (common in some locales).
  const raw = String(phone || "").trim();
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return `+${raw.slice(2)}`;
  const digits = raw.replace(/[^0-9]/g, "");
  // If no country code is provided, you should prepend your country code.
  // We do not guess; just return as +<digits> to avoid sending invalid SMS.
  return digits ? `+${digits}` : "";
}

async function sendOtpMock({ destination, otp }) {
  // eslint-disable-next-line no-console
  console.log(`Mock OTP sent to ${destination}: ${otp}`);
  return true;
}

async function sendOtpSms({ destination, otp }) {
  const provider = process.env.OTP_SEND_PROVIDER || "mock";

  if (provider === "mock") {
    return sendOtpMock({ destination, otp });
  }

  if (provider === "twilio") {
    const to = normalizePhoneForSms(destination);
    if (!to) throw new Error("Invalid destination phone number.");

    const msg = process.env.OTP_SMS_TEMPLATE || `Your OTP is: ${otp}`;
    await sendTwilioSms({ to, body: msg });
    return true;
  }

  // unknown provider
  throw new Error(`Unknown OTP_SEND_PROVIDER: ${provider}`);
}

module.exports = {
  generateOtp,
  addMs,
  now,
  sendOtpMock,
  sendOtpSms,
};


