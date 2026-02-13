import React, { useEffect, useRef } from "react";
import { IoClose, IoShieldCheckmark, IoSparkles, IoChatbubbleEllipses } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";

// AI Tools configuration
const aiTools = [
  {
    id: "sagealpha",
    name: "SageAlpha AI",
    icon: IoChatbubbleEllipses,
    path: "/assistant/sagealpha",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "compliance",
    name: "Compliance AI",
    icon: IoShieldCheckmark,
    path: "/assistant/compliance",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "market-chatter",
    name: "Market Chatter AI",
    icon: IoSparkles,
    path: "/assistant/market-chatter",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "defender",
    name: "Defender AI",
    icon: IoShieldCheckmark,
    path: "/assistant/defender",
    gradient: "from-slate-700 to-slate-900",
  }
];

function AIAssistantsPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef(null);

  // Determine selected tool based on current path
  const selectedToolId = aiTools.find(tool => tool.path === location.pathname)?.id || null;

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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-16 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden"
        style={{
          animation: 'slideDown 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="text-lg font-bold text-[var(--text)]">
            SageAlpha AI Assistants
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Close panel"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* AI Tools List */}
        <div className="p-4 space-y-3 flex-shrink-0 overflow-y-auto">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedToolId === tool.id;
            
            // Gradient classes for each assistant
            let gradientClasses = "";
            if (tool.id === "sagealpha") {
              gradientClasses = "bg-gradient-to-br from-emerald-500 to-teal-600";
            } else if (tool.id === "compliance") {
              gradientClasses = "bg-gradient-to-br from-blue-500 to-blue-600";
            } else if (tool.id === "market-chatter") {
              gradientClasses = "bg-gradient-to-br from-indigo-500 to-purple-600";
            } else {
              gradientClasses = "bg-gradient-to-br from-slate-700 to-slate-900";
            }
            
            return (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool)}
                className={`
                  w-full p-4 rounded-xl transition-all duration-200
                  text-left relative overflow-hidden
                  ${gradientClasses}
                  ${isSelected 
                    ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--card-bg)] shadow-lg opacity-100' 
                    : 'opacity-90 hover:opacity-100'
                  }
                  hover:scale-[1.02] active:scale-[0.98]
                `}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white">
                      {tool.name}
                    </h3>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default AIAssistantsPanel;
