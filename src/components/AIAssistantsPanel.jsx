import React, { useEffect, useRef } from "react";
import { IoClose, IoChevronForward, IoShieldCheckmark, IoShield, IoStatsChart } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";

// AI Tools configuration
const aiTools = [
  {
    id: "sagealpha",
    name: "SageAlpha AI",
    sub: "General AI assistant",
    path: "/assistant/sagealpha",
    // Custom render for the icon
    icon: (
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-white font-bold text-lg sm:text-xl">SA</span>
      </div>
    )
  },
  {
    id: "compliance",
    name: "Compliance AI",
    sub: "Regulatory and policy expert",
    path: "/assistant/compliance",
    icon: (
      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
        <IoShieldCheckmark className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
      </div>
    )
  },
  {
    id: "market-chatter",
    name: "Market Chatter AI",
    sub: "Financial market insights",
    path: "/assistant/market-chatter",
    icon: (
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
        <IoStatsChart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      </div>
    )
  },
  {
    id: "defender",
    name: "Defender AI",
    sub: "Cybersecurity monitoring",
    path: "/assistant/defender",
    icon: (
      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
        <IoShield className="w-9 h-9 sm:w-11 sm:h-11 text-gray-400/80" />
      </div>
    )
  }
];

function AIAssistantsPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleToolSelect = (tool) => {
    navigate(tool.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:top-20 sm:right-6 sm:translate-y-0 z-50 w-auto sm:w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[calc(100vh-6rem)] overflow-hidden"
        style={{
          animation: 'slideDown 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            SageAlpha AI Assistants
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            aria-label="Close panel"
          >
            <IoClose className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* AI Tools List */}
        <div className="flex flex-col py-2 overflow-y-auto flex-1">
          {aiTools.map((tool, index) => {
            return (
              <div key={tool.id} className="relative group">
                <button
                  onClick={() => handleToolSelect(tool)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 text-left transition-colors hover:bg-slate-50"
                >
                  {/* Icon */}
                  <div className="shrink-0">
                    {tool.icon}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-0.5">
                      {tool.name}
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium">
                      {tool.sub}
                    </p>
                  </div>

                  {/* Chevron */}
                  <IoChevronForward className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
                </button>

                {/* Separator - only if not the last item */}
                {index < aiTools.length - 1 && (
                  <div className="mx-4 sm:mx-6 h-px bg-slate-100" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 text-center flex-shrink-0">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            For unrestricted usage — visit <a href="https://sagealpha.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">sagealpha.ai</a>.
          </p>
        </div>
      </div>
    </>
  );
}

export default AIAssistantsPanel;
