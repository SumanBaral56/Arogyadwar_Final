import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Arogyadwar from './components/Arogyadwar';
import AppointmentStatusPage from './pages/AppointmentStatusPage';
import BloodBankPage from './pages/BloodBankPage';
import DoctorAppointmentPage from './pages/DoctorAppointmentPage';

import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TelmedLoginPage from './pages/TelmedLoginPage';
import TelmedSignupPage from './pages/TelmedSignupPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Arogyadwar />} />
        <Route path="/login" element={<TelmedLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/signup" element={<TelmedSignupPage />} />

        <Route path="/blood-bank" element={<BloodBankPage />} />
        <Route path="/doctor-appointment" element={<DoctorAppointmentPage />} />
        <Route path="/appointment-status" element={<AppointmentStatusPage />} />
      </Routes>
    </Router>
  );
}

export default App;

