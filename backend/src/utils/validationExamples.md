# Validation Examples (Beginner Notes)

All API inputs are validated using **zod**.

## Signup (POST /api/auth/signup)

### Expected body

- fullName (string, min 2)
- contactMethod: "email" | "phone"
- email or phone (depending on contactMethod)
- password (>= 8 + password rules)

### Response codes

- 201: success
- 400: invalid request body
- 409: duplicate email/phone

## Login (POST /api/auth/login)

Body:

- contactMethod: "email" | "phone"
- email or phone
- password

Returns:

- 200: { accessToken, user }
- 401: invalid credentials

## Forgot password OTP

- Request OTP
  POST /api/auth/forgot-password/request-otp
- Verify OTP
  POST /api/auth/forgot-password/verify-otp
- Reset password
  POST /api/auth/forgot-password/reset-password

OTP sending is mocked: OTP is printed to server console.
