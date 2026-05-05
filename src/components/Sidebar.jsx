import { useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Store,
  Users,
  UserCog,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAdminAuth } from '../context/AdminAuthContext';

const baseMenuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'orders', label: 'Orders', icon: ShoppingCart, path: '/orders' },
  { key: 'vendors', label: 'Vendors', icon: Store, path: '/vendors' },
  { key: 'products', label: 'Products', icon: Package, path: '/products' },
  { key: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { key: 'inquiries', label: 'Inquiries', icon: FileText, path: '/inquiries' },
  { key: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
  { key: 'staff', label: 'Staff', icon: UserCog, path: '/staff' },
];

const Sidebar = ({ isMobile = false, onClose }) => {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const { admin } = useAdminAuth();

  const isSuperAdmin = admin?.role === 'admin';
  const permissions = admin?.permissions || [];

  const menuItems = useMemo(
    () =>
      baseMenuItems.filter((item) => {
        if (isSuperAdmin) return true;
        return permissions.includes(item.key);
      }),
    [isSuperAdmin, permissions]
  );

  const canCreateOrders = isSuperAdmin || permissions.includes('orders');
  const canAccessSettings = Boolean(admin);
  const shouldShowMobile = isMobile && sidebarOpen;

  const closeSidebar = () => {
    setSidebarOpen(false);
    onClose?.();
  };

  const sidebarContent = (
    <aside className="flex h-full flex-col overflow-y-auto bg-[#1b2435] text-white">
      <div className="flex items-center justify-between px-6 pt-6">
        <Link to="/dashboard" className="block" onClick={isMobile ? closeSidebar : undefined}>
          <img src="/logo.png" alt="Ziva Print" className="h-12 w-auto" />
        </Link>

        {isMobile ? (
          <button onClick={closeSidebar} className="rounded-full p-2 text-white/80 hover:bg-white/10">
            <X size={20} />
          </button>
        ) : null}
      </div>

      {canCreateOrders ? (
        <div className="px-5 pt-6">
          <Link
            to="/new-order"
            onClick={isMobile ? closeSidebar : undefined}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#9BCBBF] px-4 py-4 text-lg font-medium text-white transition hover:opacity-90"
          >
            <Plus size={18} />
            New Order
          </Link>
        </div>
      ) : null}

      <nav className="mt-8 flex-1 space-y-1 px-3 pb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={isMobile ? closeSidebar : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-medium transition ${
                  isActive
                  ? 'bg-[#9BCBBF] text-white'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {canAccessSettings ? (
        <div className="border-t border-white/10 px-3 py-5">
          <NavLink
            to="/settings"
            onClick={isMobile ? closeSidebar : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-medium transition ${
                isActive
                  ? 'bg-[#9BCBBF] text-white'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </div>
      ) : null}
    </aside>
  );

  if (!isMobile) {
    return <div className="fixed inset-y-0 left-0 z-30 w-64 overflow-hidden">{sidebarContent}</div>;
  }

  return shouldShowMobile ? (
    <div className="fixed inset-0 z-40 md:hidden">
      <button className="absolute inset-0 bg-slate-900/50" onClick={closeSidebar} aria-label="Close sidebar" />
      <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">{sidebarContent}</div>
    </div>
  ) : null;
};

export default Sidebar;
