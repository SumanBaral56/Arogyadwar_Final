const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectMongo = require("./config/mongo");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandlers");

const app = express();

// Environment-provided CORS origin (fallback: *).
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "test" ? "tiny" : "dev"));

// Connect to MongoDB on startup.
// (connectMongo is already called in src/server.js)


// Health check.
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// API routes.
app.use("/api", apiRoutes);

// 404 + error handling.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

