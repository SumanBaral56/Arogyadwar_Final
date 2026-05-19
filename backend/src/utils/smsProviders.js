const twilio = require("twilio");

function getEnv(name) {
  const v = process.env[name];
  if (!v) return undefined;
  return String(v);
}

async function sendTwilioSms({ to, body }) {
  const accountSid = getEnv("TWILIO_ACCOUNT_SID");
  const authToken = getEnv("TWILIO_AUTH_TOKEN");
  const fromNumber = getEnv("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Twilio SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in backend env.",
    );
  }

  const client = twilio(accountSid, authToken);
  // Twilio expects E.164 format for best results (+CountryCodeNumber)
  await client.messages.create({
    from: fromNumber,
    to,
    body,
  });

  return true;
}

module.exports = { sendTwilioSms };

