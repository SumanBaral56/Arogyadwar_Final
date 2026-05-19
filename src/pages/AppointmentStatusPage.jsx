import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AppointmentStatusPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/appointments", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            (data && data.message) || `Request failed (${response.status})`,
          );
        }
        setAppointments((data && data.appointments) || []);
      } catch (error) {
        console.log(error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div className="min-h-screen px-6 py-12 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-5xl font-extrabold text-center text-gray-800"
      >
        Appointment Status
      </motion.h1>

      {loading ? (
        <div className="text-2xl font-semibold text-center text-blue-600">
          Loading Appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-2xl font-semibold text-center text-red-500">
          No Appointments Found
        </div>
      ) : (
        <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2">
          {appointments.map((appointment) => (
            <motion.div
              key={appointment._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-white border shadow-2xl rounded-3xl"
            >
              <h2 className="mb-4 text-3xl font-bold text-blue-700">
                {appointment.name}
              </h2>

              <div className="space-y-3 text-lg">
                <p>
                  <span className="font-semibold">Doctor:</span>{" "}
                  {appointment.doctor}
                </p>

                <p>
                  <span className="font-semibold">Age:</span> {appointment.age}
                </p>

                <p>
                  <span className="font-semibold">Gender:</span>{" "}
                  {appointment.gender}
                </p>

                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {appointment.phone}
                </p>

                <p>
                  <span className="font-semibold">Appointment Date:</span>{" "}
                  {appointment.date}
                </p>

                <p>
                  <span className="font-semibold">Problem:</span>{" "}
                  {appointment.problem}
                </p>

                <div className="pt-4">
                  <span className="px-4 py-2 font-semibold text-green-700 bg-green-100 rounded-full">
                    Appointment Confirmed
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
