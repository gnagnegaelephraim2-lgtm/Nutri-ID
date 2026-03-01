import { useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import HealthId from '@/pages/HealthId';
import Nutrition from '@/pages/Nutrition';
import Records from '@/pages/Records';
import Vaccines from '@/pages/Vaccines';
import Teleconsult from '@/pages/Teleconsult';
import Cmu from '@/pages/Cmu';
import Fasting from '@/pages/Fasting';
import FindCare from '@/pages/FindCare';
import Settings from '@/pages/Settings';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-ci-dark">
      {/* Decorative background orbs */}
      <div className="glow-1 pointer-events-none" />
      <div className="glow-2 pointer-events-none" />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes — all wrapped in AppShell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/health-id" element={<HealthId />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/records" element={<Records />} />
        <Route path="/vaccines" element={<Vaccines />} />
        <Route path="/teleconsult" element={<Teleconsult />} />
        <Route path="/cmu" element={<Cmu />} />
        <Route path="/fasting" element={<Fasting />} />
        <Route path="/find-care" element={<FindCare />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
