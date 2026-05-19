const express = require("express");

const authRoutes = require("./auth.routes");
const appointmentRoutes = require("./appointment.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/appointments", appointmentRoutes);

module.exports = router;


