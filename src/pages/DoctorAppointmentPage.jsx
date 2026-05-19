import { motion } from "framer-motion";
import { CalendarDays, Clock3, Phone, Stethoscope, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DoctorAppointmentPage() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    doctor: "",
    date: "",
    problem: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Today's Date
  const today = new Date().toISOString().split("T")[0];

  // Maximum Date = Today + 1 Month
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);

  const formattedMaxDate = maxDate.toISOString().split("T")[0];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && data.message) || `Request failed (${res.status})`,
        );
      }

      console.log(data);

      setSuccessMessage("Appointment Booked Successfully ✅");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

      setFormData({
        name: "",
        age: "",
        gender: "",
        phone: "",
        doctor: "",
        date: "",
        problem: "",
      });
    } catch (error) {
      console.log(error);

      alert("Something went wrong ❌");
    }
  };

  return (
    <div className="min-h-screen px-6 py-12 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {successMessage && (
        <div className="fixed z-50 px-6 py-4 text-white transform -translate-x-1/2 bg-green-600 shadow-2xl top-6 left-1/2 rounded-xl animate-bounce">
          {successMessage}
        </div>
      )}
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mb-12 text-center"
      >
        <h1 className="mb-4 text-5xl font-extrabold text-gray-800">
          Doctor Appointment Portal
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-gray-600">
          Book appointments with trusted healthcare professionals quickly and
          securely.
        </p>
      </motion.div>

      {/* Main Section */}
      <div className="grid max-w-6xl grid-cols-1 gap-10 mx-auto lg:grid-cols-2">
        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="p-8 text-white shadow-2xl rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500"
        >
          <h2 className="mb-6 text-3xl font-bold">Why Choose Arogyadwar?</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <User size={24} />
              </div>

              <div>
                <h3 className="text-xl font-semibold">Expert Doctors</h3>
                <p className="text-blue-100">
                  Consult experienced and verified medical professionals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <CalendarDays size={24} />
              </div>

              <div>
                <h3 className="text-xl font-semibold">Easy Scheduling</h3>
                <p className="text-blue-100">
                  Book appointments anytime with a smooth scheduling system.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Clock3 size={24} />
              </div>

              <div>
                <h3 className="text-xl font-semibold">24/7 Availability</h3>
                <p className="text-blue-100">
                  Access healthcare support and appointment booking anytime.
                </p>
              </div>
            </div>
          </div>

          <img
            src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1000&q=80"
            alt="Doctor"
            className="object-cover w-full mt-10 shadow-xl h-72 rounded-2xl"
          />
          <div className="p-6 mt-8 bg-white shadow-2xl rounded-2xl">
            <h3 className="mb-3 text-2xl font-bold text-blue-700">
              Check Appointment Status
            </h3>

            <p className="mb-5 text-gray-600">
              View your booked appointments and track appointment details
              easily.
            </p>

            <button
              onClick={() => navigate("/appointment-status")}
              className="px-6 py-3 font-semibold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:scale-105"
            >
              Check Status
            </button>
          </div>
        </motion.div>

        {/* Right Side Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="p-8 bg-white border shadow-2xl rounded-3xl"
        >
          <h2 className="mb-8 text-3xl font-bold text-center text-gray-800">
            Book Your Appointment
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Patient Name
              </label>

              <div className="flex items-center border rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                <User className="ml-3 text-gray-400" size={20} />

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full p-4 outline-none rounded-xl"
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Age
              </label>

              <input
                type="number"
                name="age"
                min="0"
                max="100"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter your age"
                required
                className="w-full p-4 border outline-none rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Gender
              </label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full p-4 bg-white border outline-none rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Phone Number
              </label>

              <div className="flex items-center border rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                <Phone className="ml-3 text-gray-400" size={20} />

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");

                    if (value.length <= 10) {
                      setFormData({
                        ...formData,
                        phone: value,
                      });
                    }
                  }}
                  placeholder="Enter 10-digit phone number"
                  required
                  className="w-full p-4 outline-none rounded-xl"
                />
              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Select Doctor
              </label>

              <div className="flex items-center border rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                <Stethoscope className="ml-3 text-gray-400" size={20} />

                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                  required
                  className="w-full p-4 bg-white outline-none rounded-xl"
                >
                  <option value="">Choose a Doctor</option>
                  <option>Dr. Rahul Sharma - Cardiologist</option>
                  <option>Dr. Priya Sen - Neurologist</option>
                  <option>Dr. Amit Roy - General Physician</option>
                  <option>Dr. Sneha Das - Dermatologist</option>
                  <option>Dr. Arjun Mehta - Orthopedic</option>
                  <option>Dr. Neha Kapoor - Pediatrician</option>
                  <option>Dr. Vikram Sinha - ENT Specialist</option>
                  <option>Dr. Riya Mukherjee - Gynecologist</option>
                  <option>Dr. Souvik Ghosh - Psychiatrist</option>
                  <option>Dr. Tanmay Dutta - Ophthalmologist</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Appointment Date
              </label>

              <input
                type="date"
                name="date"
                min={today}
                max={formattedMaxDate}
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full p-4 border outline-none rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Problem */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Describe Your Problem
              </label>

              <textarea
                rows="4"
                name="problem"
                value={formData.problem}
                onChange={handleChange}
                placeholder="Describe your symptoms or medical issue"
                required
                className="w-full p-4 border outline-none resize-none rounded-xl focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 text-lg font-semibold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:scale-105 hover:shadow-2xl"
            >
              Book Appointment
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
