import React from "react";
import { useTheme } from "../context/ThemeContext";
import { IoToggleSharp } from "react-icons/io5";
import { IoToggleOutline } from "react-icons/io5";
import { IoArrowBack, IoShieldCheckmark, IoSparkles } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show back button on profile, portfolio, and subscribers pages
  const showBackButton = ["/profile", "/portfolio", "/subscribers", "/upgrade-plan", "/compliance", "/market-chatter", "/defender-ai"].includes(location.pathname);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <nav className="
      fixed top-0 left-0 w-full z-50
      bg-[var(--bg)]
      border-b border-[var(--border)]
      backdrop-blur
    ">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <img
          onClick={() => navigate('/chatbot')}
          src="/logo/sagealpha-logo.png"
          alt="SageAlpha"
          className="h-8 w-auto"
        />

        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back Button - only on profile, portfolio, and subscribers pages */}
          {showBackButton && (
            <button
              onClick={handleGoBack}
              className="
                h-9 w-9 sm:h-10 sm:w-10 rounded-full
                flex items-center justify-center
                bg-[var(--hover)]
                hover:opacity-80
                transition
                text-[var(--text)]
              "
              aria-label="Go back to previous page"
            >
              <IoArrowBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Compliance and Market Chatter Buttons - Only on ChatBot page */}
          {location.pathname === "/chatbot" && (
            <>
              {/* Compliance Button */}
              <button
                onClick={() => navigate("/compliance")}
                className="
                  h-9 sm:h-10 px-3 sm:px-4 rounded-lg
                  flex items-center gap-2
                  bg-[var(--hover)]
                  hover:opacity-80
                  transition
                  text-[var(--text)]
                  text-sm font-medium
                "
                aria-label="Compliance"
              >
                <IoShieldCheckmark className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Compliance Ai</span>
              </button>

              {/* Market Chatter Button */}
              <button
                onClick={() => navigate("/market-chatter")}
                className="
                  h-9 sm:h-10 px-3 sm:px-4 rounded-lg
                  flex items-center gap-2
                  bg-[var(--hover)]
                  hover:opacity-80
                  transition
                  text-[var(--text)]
                  text-sm font-medium
                "
                aria-label="Market Chatter"
              >
                <IoSparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Market Chatter</span>
              </button>

              {/* Defender AI Button */}
              <button
                onClick={() => navigate("/defender-ai")}
                className="
                  h-9 sm:h-10 px-3 sm:px-4 rounded-lg
                  flex items-center gap-2
                  bg-[var(--hover)]
                  hover:opacity-80
                  transition
                  text-[var(--text)]
                  text-sm font-medium
                "
                aria-label="Defender AI"
              >
                <IoShieldCheckmark className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Defender AI</span>
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="
              h-9 w-9 sm:h-10 sm:w-10 rounded-full
              flex items-center justify-center
              bg-[var(--hover)]
              hover:opacity-80
              transition
            "
          >
            {theme === "dark" ? <IoToggleSharp className="w-4 h-4 sm:w-5 sm:h-5" /> : <IoToggleOutline className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
