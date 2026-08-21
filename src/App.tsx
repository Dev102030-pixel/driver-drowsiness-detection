import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Login } from '@/pages/Login';
import { DriverDashboard } from '@/pages/DriverDashboard';
import { AdminReports } from '@/pages/AdminReports';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DriverDashboard />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
