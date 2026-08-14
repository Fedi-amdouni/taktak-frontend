import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TableSessionProvider } from './context/TableSessionContext';
import { CartProvider } from './context/CartContext';
import { ClientApp } from './pages/client/ClientApp';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { KitchenDashboard } from './pages/kitchen/KitchenDashboard';
import { StaffPortal } from './pages/staff/StaffPortal';
import { AdminPortal } from './pages/admin/AdminPortal';
import { ProtectedRoute } from './components/common/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <Router>
      <TableSessionProvider>
        <CartProvider>
          <Routes>
            {/* Client Mobile App */}
            <Route path="/m/:cafeSlug/t/:tableId" element={<ClientApp />} />
            <Route path="/m/:cafeSlug" element={<ClientApp />} />

            {/* Kitchen KDS Bar & Kitchen Screen */}
            <Route path="/kitchen/:cafeSlug" element={<ProtectedRoute roles={['ADMIN', 'STAFF']} fallback="/staff"><KitchenDashboard /></ProtectedRoute>} />

            {/* Staff Tablet Portal & Dashboard */}
            <Route path="/staff/:cafeSlug" element={<ProtectedRoute roles={['STAFF']} fallback="/staff"><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff" element={<StaffPortal />} />

            {/* Admin Owner Portal & Dashboard */}
            <Route path="/admin/:cafeSlug" element={<ProtectedRoute roles={['ADMIN']} fallback="/admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminPortal />} />

            {/* Default Fallback to Demo Table */}
            <Route path="*" element={<Navigate to="/m/monastir-lounge/t/05" replace />} />
          </Routes>
        </CartProvider>
      </TableSessionProvider>
    </Router>
  );
};

export default App;
