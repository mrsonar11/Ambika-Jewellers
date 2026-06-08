// import Dashboard from './pages/Dashboard';

// function App() {
//   return <Dashboard />;
// }
// export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Billing from './pages/Billing';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Users from './pages/Users';
import Mortgage from './pages/Mortgage';

function App() {
  const { loading, user } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Protected routes - only accessible if user exists */}
        {user ? (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/users" element={<Users />} />
            <Route path="/mortgage" element={<Mortgage />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;