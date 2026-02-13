import React, { useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";

// AI Tools configuration
const aiTools = [
  {
    id: "sagealpha",
    name: "SageAlpha AI",
    path: "/assistant/sagealpha",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "compliance",
    name: "Compliance AI",
    path: "/assistant/compliance",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "market-chatter",
    name: "Market Chatter AI",
    path: "/assistant/market-chatter",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "defender",
    name: "Defender AI",
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
        <div className="flex-shrink-0 overflow-y-auto">
          {aiTools.map((tool, index) => {
            const isSelected = selectedToolId === tool.id;
            
            // Gradient text classes for each assistant
            let gradientTextClass = "";
            if (tool.id === "sagealpha") {
              gradientTextClass = "bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent";
            } else if (tool.id === "compliance") {
              gradientTextClass = "bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent";
            } else if (tool.id === "market-chatter") {
              gradientTextClass = "bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent";
            } else {
              gradientTextClass = "bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent";
            }
            
            return (
              <React.Fragment key={tool.id}>
                <button
                  onClick={() => handleToolSelect(tool)}
                  className={`
                    w-full px-4 py-3 text-left
                    transition-all duration-200
                    border-l-4
                    ${isSelected 
                      ? 'bg-[var(--accent)]/5 border-[var(--accent)]' 
                      : 'bg-transparent border-transparent hover:bg-[var(--hover)]/50'
                    }
                  `}
                >
                  <span className={`font-medium text-sm ${gradientTextClass}`}>
                    {tool.name}
                  </span>
                </button>
                {index < aiTools.length - 1 && (
                  <div className="border-t border-[var(--border)]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default AIAssistantsPanel;
