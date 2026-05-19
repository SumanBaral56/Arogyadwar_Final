const jwt = require("jsonwebtoken");

function authenticateAccess(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (payload.typ === "login_challenge") {
      return res.status(401).json({ message: "Invalid access token" });
    }
    req.user = { id: payload.sub, email: payload.email, phone: payload.phone, fullName: payload.fullName };
    return next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

module.exports = { authenticateAccess };

