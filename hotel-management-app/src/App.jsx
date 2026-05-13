import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import RoleSelect from './pages/RoleSelect';
import HotelSelect from './pages/HotelSelect';
import Login from './pages/Login';
import RegisterHotel from './pages/RegisterHotel';

import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import Bills from './pages/Bills';
import WaiterSection from './pages/WaiterSection';
import ChefCorner from './pages/ChefCorner';
import OnlineOrders from './pages/OnlineOrders';
import TTBBills from './pages/TTBBills';
import Settings from './pages/Settings';

import ManagementLayout from './components/ManagementLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/role-select" replace />} />

        {/* AUTH ROUTES */}
        <Route path="/role-select" element={<RoleSelect />} />
        <Route path="/hotel-select" element={<HotelSelect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-hotel" element={<RegisterHotel />} />

        {/* MANAGEMENT ROUTES (WITH SIDEBAR) */}
        <Route element={<ManagementLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu-management" element={<MenuManagement />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/waiter-section" element={<WaiterSection />} />
          <Route path="/chef-corner" element={<ChefCorner />} />
          <Route path="/online-orders" element={<OnlineOrders />} />
          <Route path="/ttb-bills" element={<TTBBills />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;