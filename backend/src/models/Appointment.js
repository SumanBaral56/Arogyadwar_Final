const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    age: {
        type: Number,
        required: true,
    },

    gender: {
        type: String,
        required: true,
    },

    phone: {
        type: String,
        required: true,
    },

    doctor: {
        type: String,
        required: true,
    },

    date: {
        type: String,
        required: true,
    },

    problem: {
        type: String,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Appointment", appointmentSchema);