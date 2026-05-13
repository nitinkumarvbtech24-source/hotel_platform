import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import RoleSelect from './pages/Roleselect';
import HotelSelect from './pages/Hotelselect';
import Login from './pages/Login';
import RegisterHotel from './pages/Registerhotel';

import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import Bills from './pages/Bills';
import WaiterSection from './pages/Waitersection';
import ChefCorner from './pages/Chefcorner';
import OnlineOrders from './pages/Onlineorders';
import TTBBills from './pages/TTBbills';
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