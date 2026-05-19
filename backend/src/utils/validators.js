const { z } = require("zod");

const { validatePasswordRules } = require("./passwordRules");

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request body",
        details: result.error.flatten(),
      });
    }
    req.validatedBody = result.data;
    return next();
  };
}

const baseUserSchema = {
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters"),

  contactMethod: z.enum(["email", "phone"]),
};

const signupSchema = z
  .object({
    ...baseUserSchema,
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(8),
  })
  .refine(
    (data) => {
      if (data.contactMethod === "email") return !!data.email;
      return !!data.phone;
    },
    { message: "Provide email for email signup or phone for phone signup", path: ["contactMethod"] },
  )
  .refine(
    (data) => {
      if (data.contactMethod === "email") return /^.+@.+\..+$/.test(data.email);
      const digits = String(data.phone || "").replace(/[^0-9]/g, "");
      return digits.length >= 10;
    },
    { message: "Enter a valid email or phone number" },
  )
  .refine(
    (data) => {
      const msg = validatePasswordRules(data.password);
      return msg === "";
    },
    { message: "Password does not meet security rules" },
  );

const loginSchema = z
  .object({
    contactMethod: z.enum(["email", "phone"]),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1),
  })
  .refine((data) => (data.contactMethod === "email" ? !!data.email : !!data.phone), {
    message: "Provide email or phone",
  })
  .refine(
    (data) => {
      if (data.contactMethod === "email") return true;
      const digits = String(data.phone || "").replace(/[^0-9]/g, "");
      return digits.length >= 10;
    },
    { message: "Enter a valid phone number" },
  );

const loginVerifyOtpSchema = z.object({
  loginChallengeToken: z.string().min(20),
  otp: z.string().length(6).regex(/^\d+$/),
});

const loginResendOtpSchema = z.object({
  loginChallengeToken: z.string().min(20),
});

const requestOtpSchema = z.object({
  contactMethod: z.enum(["email", "phone"]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const verifyOtpSchema = z.object({
  contactMethod: z.enum(["email", "phone"]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  otp: z.string().length(6),
});

const resetPasswordSchema = z.object({
  contactMethod: z.enum(["email", "phone"]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
}).refine(
  (data) => {
    const msg = validatePasswordRules(data.newPassword);
    return msg === "";
  },
  { message: "Password does not meet security rules" },
);

module.exports = {
  validateBody,
  signupSchema,
  loginSchema,
  loginVerifyOtpSchema,
  loginResendOtpSchema,
  requestOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};

