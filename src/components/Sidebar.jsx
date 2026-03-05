import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FolderOpen, 
  BarChart3, 
  Settings,
  X
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { NavLink, useNavigate } from 'react-router-dom';

const iconMap = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FolderOpen,
  BarChart3,
  Settings
};

const menuItems = [
  { name: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { name: 'Orders', icon: 'ShoppingCart', badge: 24, path: '/orders' },
  { name: 'Products', icon: 'Package', path: '/products' },
  { name: 'Customers', icon: 'Users', path: '/customers' },
  { name: 'Files', icon: 'FolderOpen', path: '/files' },
  { name: 'Reports', icon: 'BarChart3', path: '/reports' },
];

const Sidebar = ({ isMobile = false, onClose }) => {

  const { sidebarOpen, setSidebarOpen } = useApp();
  const navigate = useNavigate();

  const handleClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
      if (onClose) onClose();
    }
  };

  return (
    <>
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={handleClose}
        />
      )}

      <div
        className={`
        ${isMobile
          ? `fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'fixed left-0 top-0 h-screen w-64'
        }
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        flex flex-col
      `}
      >

        {isMobile && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white"
          >
            <X size={22} />
          </button>
        )}

        {/* Logo */}
        <div className="py-4 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Zivaprint Logo"
            className="h-10 object-contain"
          />
        </div>

        {/* ✅ NEW ORDER BUTTON */}
        <div className="px-6 pb-6">
          <button
            onClick={() => {
              navigate('/new-order');
              handleClose();
            }}
            className="w-full bg-[#9BCBBF] text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <span>+</span>
            <span>New Order</span>
          </button>
        </div>

        <nav className="flex-1 px-3">

          {menuItems.map((item) => {

            const Icon = iconMap[item.icon];

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={handleClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition
                  ${isActive
                    ? 'bg-[#9BCBBF] text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >

                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </div>

                {item.badge && (
                  <span className="bg-[#9BCBBF] text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}

              </NavLink>
            );

          })}

        </nav>

        <div className="p-3 border-t border-slate-700">

          <NavLink
            to="/settings"
            onClick={handleClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition
              ${isActive
                ? 'bg-[#9BCBBF] text-white'
                : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </NavLink>

        </div>

      </div>
    </>
  );
};

export default Sidebar;