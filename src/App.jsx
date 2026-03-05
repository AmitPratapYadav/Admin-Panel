import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AppProvider, useApp } from './context/AppContext';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import OrdersPage from './pages/OrdersPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import FilesPage from './pages/FilesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NewOrderPage from './pages/NewOrderPage';

import { Plus } from 'lucide-react';

const Layout = ({ children }) => {

  const { sidebarOpen, setSidebarOpen } = useApp();
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

  return (

    <div className="min-h-screen bg-gray-50">

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sidebar
          isMobile={true}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="md:ml-64 flex flex-col min-h-screen">

        <Topbar
          onMenuClick={handleMenuClick}
          showMenuButton={isMobile}
        />

        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>

      </div>

      {/* Floating Button Mobile */}
      <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#9BCBBF] rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition z-30">
        <Plus className="text-white" size={24} />
      </button>

    </div>

  );
};

const App = () => {

  return (

    <AppProvider>

      <Router>

        <Layout>

          <Routes>

            <Route path="/" element={<Navigate to="/orders" replace />} />

            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/orders" element={<OrdersPage />} />

            {/* ✅ NEW ORDER PAGE */}
            <Route path="/new-order" element={<NewOrderPage />} />

            <Route path="/products" element={<ProductsPage />} />

            <Route path="/customers" element={<CustomersPage />} />

            <Route path="/files" element={<FilesPage />} />

            <Route path="/reports" element={<ReportsPage />} />

            <Route path="/settings" element={<SettingsPage />} />

          </Routes>

        </Layout>

      </Router>

    </AppProvider>

  );
};

export default App;