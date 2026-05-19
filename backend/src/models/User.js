const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allow phone-only users
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allow email-only users
      index: true,
    },

    passwordHash: { type: String, required: true },

    // OTP fields for password reset.
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    // OTP after successful password check (second login step).
    loginOtp: { type: String, default: null },
    loginOtpExpiry: { type: Date, default: null },

    // You can also store verified flag if needed.
  },
  {
    timestamps: true,
  },
);



module.exports = mongoose.model("User", userSchema);

