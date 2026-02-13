import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { IoToggleSharp } from "react-icons/io5";
import { IoToggleOutline } from "react-icons/io5";
import { IoArrowBack, IoSparkles } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import AIAssistantsPanel from "./AIAssistantsPanel";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  // Check if we're on an assistant route
  const isAssistantRoute = location.pathname.startsWith("/assistant/");

  // Show back button on utility pages and specific assistant sub-pages
  const showBackButton = ["/profile", "/portfolio", "/subscribers", "/upgrade-plan"].includes(location.pathname);

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
          onClick={() => navigate('/assistant/sagealpha')}
          src="/logo/sagealpha-logo.png"
          alt="SageAlpha"
          className="h-8 w-auto cursor-pointer"
        />

        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back Button */}
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

          {/* AI Assistants Button — visible on all assistant routes */}
         
            <button
              onClick={() => setIsAIPanelOpen(true)}
              className="
                h-9 sm:h-10 px-3 sm:px-4 rounded-lg
                flex items-center gap-2
                bg-[var(--hover)]
                hover:opacity-80
                transition
                text-[var(--text)]
                text-xs sm:text-sm font-medium
              "
              aria-label="AI Assistants"
            >
              <IoSparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">AI Assistants</span>
            </button>
        

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

      {/* AI Assistants Panel */}
      <AIAssistantsPanel 
        isOpen={isAIPanelOpen} 
        onClose={() => setIsAIPanelOpen(false)} 
      />
    </nav>
  );
}

export default Navbar;
