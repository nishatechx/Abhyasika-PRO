
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Store } from './services/store';
import { Layout } from './components/Layout';
import { Landing, Login, Onboarding } from './pages/Public';
import { Dashboard } from './pages/Dashboard';
import { SeatManager } from './pages/SeatManager';
import { Students, Finance, Enquiries, Settings, AttendanceHistory } from './pages/Operations';
import { SuperAdmin } from './pages/SuperAdmin';
import { Scanner } from './pages/Scanner';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const u = Store.getUser();
      setUser(u);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-orange-600">Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <Landing /> : <Navigate to={user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'} />} />
        <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to={user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'} />} />
        
        {/* Super Admin Route */}
        <Route path="/admin" element={
            user && user.role === 'SUPER_ADMIN' ? <SuperAdmin setUser={setUser} /> : <Navigate to="/login" />
        } />

        {/* Library Admin Protected Routes */}
        <Route path="/onboarding" element={user && user.role !== 'SUPER_ADMIN' ? <Onboarding /> : <Navigate to="/login" />} />
        
        {/* Dedicated Scanner Route (Kiosk Mode) */}
        <Route path="/scanner" element={
           user ? <Scanner /> : <Navigate to="/login" />
        } />
        
        <Route path="/dashboard" element={
          user && user.role !== 'SUPER_ADMIN' ? <Layout user={user} setUser={setUser}><Dashboard /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/attendance" element={
          user && user.role !== 'SUPER_ADMIN' ? <Layout user={user} setUser={setUser}><AttendanceHistory /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/seats" element={
          user && user.role !== 'SUPER_ADMIN' ? <Layout user={user} setUser={setUser}><SeatManager /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/students" element={
          user && user.role !== 'SUPER_ADMIN' ? <Layout user={user} setUser={setUser}><Students /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/finance" element={
          user && user.role !== 'SUPER_ADMIN' ? <Layout user={user} setUser={setUser}><Finance /></Layout> : <Navigate to="/login" />
        } />
         <Route path="/enquiries" element={
          user && user.role !== 'SUPER_ADMIN' ? <Layout user={user} setUser={setUser}><Enquiries /></Layout> : <Navigate to="/login" />
        } />
         <Route path="/settings" element={
          user && user.role !== 'SUPER_ADMIN' ? <Layout user={user} setUser={setUser}><Settings /></Layout> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
