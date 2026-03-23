import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import PracticeArena from './pages/PracticeArena';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/login';

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {showNavbar && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/arena" element={<ProtectedRoute><PracticeArena /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
