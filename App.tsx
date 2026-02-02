import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import LandingPage from './components/LandingPage';
import AuthCallback from './app/auth/callback/page';
import Dashboard from './components/Dashboard';
import Resumes from './components/Resumes';
import Settings from './components/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resumes" element={<Resumes />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* Admin Route - Protected by AdminRoute component */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
