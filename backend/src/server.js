const http = require("http");
const path = require("path");
const app = require("./app");

// Ensure dotenv loads the backend/.env regardless of where the process is started from.
require("dotenv").config({
  // backend/.env -> server.js is at backend/src/server.js => go up one to backend, then load .env
  path: path.join(__dirname, "..", ".env"),
});


//console.log(process.env.MONGODB_URI);
const connectMongo = require("./config/mongo");
connectMongo();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth API listening on port ${PORT}`);
});


