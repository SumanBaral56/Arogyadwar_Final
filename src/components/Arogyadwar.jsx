import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { Bot, Droplet, HeartPulse } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ADD THIS IMPORT
import { auth } from "../firebase";
import Chatbot from "./Chatbot";
import Header from "./Header";
import HomeSection from "./HomeSection";
import { Button, Card, CardContent } from "./ui";
import { useTextAnimation, useViewportTextAnimation } from "./useTextAnimation";

const ANIMATION_CONSTANTS = {
  TYPING_DELAY: 100,
  SPACE_DELAY: 500,
  RESTART_DELAY: 2000,
  SCROLL_THRESHOLD: 50,
};

const TEXT_CONTENT = {
  WELCOME: "Welcome to Arogyadwar",
  ABOUT: "About Arogyadwar",
};

const COLORS = {
  HEADER_DEFAULT: "text-orange-500",
  HEADER_SCROLLED: "text-amber-500",
};

/**
 * Main Arogyadwar component - Digital health gateway application
 * @returns {JSX.Element} The main application component
 */
export default function Arogyadwar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerColor, setHeaderColor] = useState(COLORS.HEADER_DEFAULT);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate(); // ADD THIS HOOK

  const fullText = TEXT_CONTENT.WELCOME;
  const displayedText = useTextAnimation(fullText, {
    typingDelay: ANIMATION_CONSTANTS.TYPING_DELAY,
    spaceDelay: ANIMATION_CONSTANTS.SPACE_DELAY,
    restartDelay: ANIMATION_CONSTANTS.RESTART_DELAY,
  });

  const aboutFullText = TEXT_CONTENT.ABOUT;
  const [aboutInView, setAboutInView] = useState(false);
  const aboutDisplayedText = useViewportTextAnimation(
    aboutFullText,
    aboutInView,
    {
      typingDelay: ANIMATION_CONSTANTS.TYPING_DELAY,
      spaceDelay: ANIMATION_CONSTANTS.SPACE_DELAY,
    },
  );

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > ANIMATION_CONSTANTS.SCROLL_THRESHOLD) {
        setIsScrolled(true);
        setHeaderColor(COLORS.HEADER_SCROLLED);
      } else {
        setIsScrolled(false);
        setHeaderColor(COLORS.HEADER_DEFAULT);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 5-second redirect timer for unauthenticated users
  useEffect(() => {
    let timeout;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        timeout = setTimeout(() => {
          setShowLoginModal(true);
        }, 5000);
      } else {
        setShowLoginModal(false);
        if (timeout) clearTimeout(timeout);
      }
    });

    return () => {
      unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const scrollToSection = (id) => {
    // Special-case navigation to login route
    if (id === "login") {
      setMenuOpen(false);
      navigate("/login");
      return;
    }

    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header headerColor={headerColor} onScrollToSection={scrollToSection} />

      <main className="flex flex-col flex-1 p-10 space-y-32">
        <HomeSection
          welcomeText={fullText}
          animationConfig={{
            typingDelay: ANIMATION_CONSTANTS.TYPING_DELAY,
            spaceDelay: ANIMATION_CONSTANTS.SPACE_DELAY,
            restartDelay: ANIMATION_CONSTANTS.RESTART_DELAY,
          }}
        />

        {/* About Section */}
        <motion.section
          id="about"
          className="max-w-6xl pt-20 mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          onViewportEnter={() => setAboutInView(true)}
          onViewportLeave={() => setAboutInView(false)}
        >
          <h2 className="mb-8 text-3xl font-bold">{aboutDisplayedText}</h2>
          <p className="mb-12 text-lg text-gray-600">
            Arogyadwar is your digital health gateway providing convenient
            access to doctor appointments, blood bank services, and intelligent
            AI-powered medical assistance, all in one platform.
          </p>
          <div className="flex flex-col gap-8">
            <motion.div
              className="flex flex-row items-center p-6 bg-white rounded-lg shadow-lg"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex-1 pr-6">
                <h3 className="mb-2 text-xl font-semibold">
                  Doctor Appointments
                </h3>
                <p className="text-gray-600">
                  Schedule appointments with certified doctors from the comfort
                  of your home. Our platform connects you with healthcare
                  professionals across various specialties.
                </p>
              </div>
              <motion.img
                src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Doctor Appointment"
                className="object-cover w-48 h-48 rounded-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              />
            </motion.div>
            <motion.div
              className="flex flex-row-reverse items-center p-6 bg-white rounded-lg shadow-lg"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex-1 pl-6">
                <h3 className="mb-2 text-xl font-semibold">
                  Blood Bank Services
                </h3>
                <p className="text-gray-600">
                  Access our comprehensive blood bank network for donations and
                  emergencies. Find donors, schedule blood drives, and save
                  lives in your community.
                </p>
              </div>
              <motion.img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Blood Bank"
                className="object-cover w-48 h-48 rounded-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              />
            </motion.div>
            <motion.div
              className="flex flex-row items-center p-6 bg-white rounded-lg shadow-lg"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex-1 pr-6">
                <h3 className="mb-2 text-xl font-semibold">
                  AI-Powered Assistance
                </h3>
                <p className="text-gray-600">
                  Get instant medical advice and health information through our
                  advanced AI chatbot. Receive personalized recommendations and
                  health tips 24/7.
                </p>
              </div>
              <motion.img
                src="https://images.unsplash.com/photo-1555255707-c07966088b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="AI Chat Assistance"
                className="object-cover w-48 h-48 rounded-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section - UPDATED BLOOD BANK BUTTON */}
        <section
          id="features"
          className="grid w-full max-w-5xl grid-cols-1 gap-8 pt-20 mx-auto md:grid-cols-3"
        >
          <Card className="transition transform shadow-lg rounded-2xl animate-glow-blue hover:shadow-2xl hover:-translate-y-2">
            <CardContent className="flex flex-col items-center p-6 text-center group">
              <HeartPulse
                className="p-2 mb-3 text-blue-600 transition-transform duration-300 group-hover:scale-125 group-hover:bg-blue-100 group-hover:rounded-full"
                size={36}
              />
              <h2 className="mb-4 text-xl font-semibold">Doctor Appointment</h2>
              <p className="mb-6 text-gray-600">
                Book your appointment with trusted doctors easily.
              </p>
              <Button
                onClick={() => navigate("/doctor-appointment")}
                className="px-6 py-3 text-white transition duration-300 ease-in-out rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.7)]"
              >
                Book Now
              </Button>
            </CardContent>
          </Card>

          <Card className="transition transform shadow-lg rounded-2xl animate-glow-red hover:shadow-2xl hover:-translate-y-2">
            <CardContent className="flex flex-col items-center p-6 text-center group">
              <Droplet
                className="p-2 mb-3 text-red-600 transition-transform duration-300 group-hover:scale-125 group-hover:bg-red-100 group-hover:rounded-full"
                size={36}
              />
              <h2 className="mb-4 text-xl font-semibold">Blood Bank</h2>
              <p className="mb-6 text-gray-600">
                Find or donate blood to save lives quickly.
              </p>
              {/* UPDATED EXPLORE BUTTON - ADD onClick HANDLER */}
              <Button
                onClick={() => navigate("/blood-bank")}
                className="px-6 py-3 text-white transition duration-300 ease-in-out rounded-lg shadow-md bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 hover:shadow-lg hover:drop-shadow-[0_0_10px_rgba(220,38,38,0.7)]"
              >
                Explore
              </Button>
            </CardContent>
          </Card>

          <Card className="transition transform shadow-lg rounded-2xl animate-glow-green hover:shadow-2xl hover:-translate-y-2">
            <CardContent className="flex flex-col items-center p-6 text-center group">
              <Bot
                className="p-2 mb-3 text-green-600 transition-transform duration-300 group-hover:scale-125 group-hover:bg-green-100 group-hover:rounded-full"
                size={36}
              />
              <h2 className="mb-4 text-xl font-semibold">AI Chat Assistance</h2>
              <p className="mb-6 text-gray-600">
                Get instant medical help from our AI assistant.
              </p>
              <Button
                onClick={() => setIsChatbotOpen(true)}
                className="px-6 py-3 text-white transition duration-300 ease-in-out rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 hover:shadow-lg hover:drop-shadow-[0_0_10px_rgba(22,163,74,0.7)]"
              >
                Chat Now
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="py-4 text-sm text-center text-gray-600 bg-gray-100">
        © {new Date().getFullYear()} Arogyadwar. All rights reserved.
      </footer>

      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Auth Lock Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md p-8 text-center bg-white shadow-2xl rounded-3xl"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-blue-50">
                <HeartPulse size={48} className="text-blue-600 animate-pulse" />
              </div>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-gray-800">
              Session Locked
            </h2>
            <p className="mb-8 leading-relaxed text-gray-600">
              Welcome to Arogyadwar! Please sign in or create an account to
              continue accessing our health platform.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full py-4 font-bold text-white transition-all bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:shadow-lg hover:scale-[1.02]"
            >
              Login / Signup
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
