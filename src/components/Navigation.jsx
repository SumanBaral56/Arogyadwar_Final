import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

/**
 * Navigation component for the Arogyadwar application
 * @param {Object} props - Component props
 * @param {Function} props.onNavClick - Function to handle navigation clicks
 * @param {boolean} props.menuOpen - Whether the mobile menu is open
 * @param {Function} props.onMenuToggle - Function to toggle mobile menu
 * @returns {JSX.Element} Navigation component
 */
export default function Navigation({ onNavClick, menuOpen, onMenuToggle }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "features", label: "Features" },
    { id: "login", label: "Login / Signup" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload(); // Refresh the page to reset all states
  };

  return (
    <>
      {/* Navigation */}
      <nav className="relative flex gap-6 font-medium text-gray-700">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavClick(item.id)}
            className="cursor-pointer hover:text-blue-600 bg-transparent border-none p-0 text-gray-700"
          >
            {item.label}
          </button>
        ))}
        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer text-red-600 hover:text-red-800 bg-transparent border-none p-0 font-bold"
          >
            Logout
          </button>
        )}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="text-gray-700 md:hidden hover:text-blue-600"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
      >
        <Menu size={28} />
      </button>

      {/* Mobile Navigation Menu */}
      {menuOpen && (
        <div className="sticky z-40 flex flex-col gap-4 px-6 py-4 font-medium text-gray-700 bg-white shadow-md md:hidden top-16">
          {navItems.map((item) => (
            <span
              key={item.id}
              onClick={() => onNavClick(item.id)}
              className="cursor-pointer hover:text-blue-600"
            >
              {item.label}
            </span>
          ))}
          {user && (
            <span
              onClick={handleLogout}
              className="cursor-pointer text-red-600 hover:text-red-800 font-bold"
            >
              Logout
            </span>
          )}
        </div>
      )}
    </>
  );
}
