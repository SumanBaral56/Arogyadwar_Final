# Telemedicine Authentication Backend (Node + Express + MongoDB)

This backend supports the existing React frontend pages for:

- **Login (2-step):** password check → 6-digit OTP (mock) → JWT access token
- Signup (email/phone) with MongoDB persistence
- Forgot password (OTP mock via email/phone)
- Reset password after OTP verification

## Tech

- Node.js + Express
- MongoDB + Mongoose
- bcrypt
- JWT (access token)
- zod for request validation

## Folder Structure

```
backend/
  src/
    server.js
    app.js
    config/
      mongo.js
    controllers/
      auth.controller.js
    models/
      User.js
    routes/
      index.js
      auth.routes.js
    middleware/
      auth.js
      errorHandlers.js
      rateLimiters.js
    utils/
      validators.js
      otp.js
      passwordRules.js
```

## Setup

1. Create a MongoDB database (local or Atlas) and update `MONGODB_URI`.
2. Copy `.env.example` to `.env`.
3. Install dependencies.
4. Run the server.

### Commands

From repo root:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## API Base URL

By default:

- `http://localhost:5000/api`

## Postman Examples

File:

- `src/routes/auth.postman.json`

## Notes

- OTP sending is mocked: the OTP is printed in server logs (login and password-reset flows).
- After `POST /api/auth/login`, use `loginChallengeToken` for `POST /api/auth/login/verify-otp` and `POST /api/auth/login/resend-otp`.
- Frontend: set `REACT_APP_API_URL` (see repo `/.env.example`) to `http://localhost:5000`.
- Refresh tokens / account lock / roles are not implemented yet (optional enhancements).
