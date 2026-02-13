import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Profile from "./components/Profile";
import Portfolio from "./components/Portfolio";
import Subscribers from "./components/Subscribers";
import AppLayout from "./Layouts/AppLayout";
import UpgradePlan from "./components/UpgradePlan";
import Plans from "./components/Plans";
import SharedChatView from "./components/SharedChatView";

// Pages
import HomePage from "./pages/HomePage";
import SageAlphaAssistant from "./pages/SageAlphaAssistant";
import ComplianceAssistant from "./pages/ComplianceAssistant";
import MarketChatterAssistant from "./pages/MarketChatterAssistant";
import DefenderAssistant from "./pages/DefenderAssistant";

export default function App() {
  return (
    <AppLayout>
      <Toaster position="top-center" richColors offset="35px" />
      <Routes>
        {/* Home page — welcome + report generation only */}
        <Route path="/" element={<HomePage />} />

        {/* Public share route */}
        <Route path="/share/:shareId" element={<SharedChatView />} />

        {/* Assistant routes — dedicated pages */}
        <Route path="/assistant/sagealpha" element={<SageAlphaAssistant />} />
        <Route path="/assistant/compliance" element={<ComplianceAssistant />} />
        <Route path="/assistant/market-chatter" element={<MarketChatterAssistant />} />
        <Route path="/assistant/defender" element={<DefenderAssistant />} />

        {/* Legacy redirects for backward compatibility */}
        <Route path="/chatbot" element={<Navigate to="/assistant/sagealpha" replace />} />
        <Route path="/compliance" element={<Navigate to="/assistant/compliance" replace />} />
        <Route path="/market-chatter" element={<Navigate to="/assistant/market-chatter" replace />} />
        <Route path="/defender-ai" element={<Navigate to="/assistant/defender" replace />} />

        {/* Utility routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/subscribers" element={<Subscribers />} />
        <Route path="/upgrade-plan" element={<UpgradePlan />} />
        <Route path="/plans" element={<Plans />} />
      </Routes>
    </AppLayout>
  );
}
