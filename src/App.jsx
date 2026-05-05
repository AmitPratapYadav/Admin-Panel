import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { AppProvider, useApp } from './context/AppContext';
import { useAdminAuth } from './context/AdminAuthContext';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';

import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import VendorsPage from './pages/VendorsPage';
import VendorProfilePage from './pages/VendorProfilePage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductEditorPage from './pages/ProductEditorPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryEditorPage from './pages/CategoryEditorPage';
import CustomersPage from './pages/CustomersPage';
import FilesPage from './pages/FilesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NewOrderPage from './pages/NewOrderPage';
import LoginPage from './pages/LoginPage';
import StaffPage from './pages/StaffPage';
import StaffProfilePage from './pages/StaffProfilePage';
import InquiriesPage from './pages/InquiriesPage';

const Layout = ({ children }) => {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const canCreateOrders = admin && (admin.role === 'admin' || (admin.permissions || []).includes('orders'));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="md:hidden">
        <Sidebar
          isMobile={true}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="md:ml-64 flex flex-col min-h-screen">
        <Topbar
          onMenuClick={handleMenuClick}
          showMenuButton={isMobile}
        />

        <div className="px-6 pt-4">
          <div className="text-sm text-gray-500">
            {admin ? `Logged in as ${admin.name}` : ''}
          </div>
        </div>

        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>

      {canCreateOrders ? (
        <button
          onClick={() => navigate('/new-order')}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#9BCBBF] rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition z-30"
        >
          <Plus className="text-white" size={24} />
        </button>
      ) : null}
    </div>
  );
};

const ProtectedLayout = () => {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/new" element={<VendorProfilePage />} />
          <Route path="/vendors/:id" element={<VendorProfilePage />} />
          <Route path="/new-order" element={<NewOrderPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/categories" element={<CategoriesPage />} />
          <Route path="/products/categories/new" element={<CategoryEditorPage />} />
          <Route path="/products/categories/:id" element={<CategoryEditorPage />} />
          <Route path="/products/new" element={<ProductEditorPage />} />
          <Route path="/products/:id" element={<ProductEditorPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/staff/new" element={<StaffProfilePage />} />
          <Route path="/staff/:id" element={<StaffProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={(
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </Router>
  );
};

export default App;
