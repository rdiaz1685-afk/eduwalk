import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Observations from './pages/Observations';
import Reports from './pages/Reports';
import TeamManagement from './pages/TeamManagement';
import TeacherManagement from './pages/TeacherManagement';
import WeeklyComplianceDashboard from './pages/WeeklyComplianceDashboard';
import Settings from './pages/Settings';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="observations" element={<Observations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="compliance" element={<WeeklyComplianceDashboard />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
