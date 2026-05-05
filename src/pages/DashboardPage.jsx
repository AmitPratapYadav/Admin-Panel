import { useEffect, useMemo, useState } from 'react';
import { fetchAdminDashboard, extractApiError } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const piePalette = ['#facc15', '#60a5fa', '#34d399', '#a78bfa', '#f87171'];

const DashboardPage = () => {
  const { admin } = useAdminAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('dashboard');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetchAdminDashboard();
        setData(response);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load dashboard.'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [canView]);

  const totalPie = useMemo(
    () => (data?.order_status_pie || []).reduce((sum, item) => sum + item.count, 0),
    [data]
  );

  const pieBackground = useMemo(() => {
    if (!totalPie) return '#e5e7eb';

    let cursor = 0;

    const segments = (data?.order_status_pie || []).map((item, index) => {
      const start = cursor;
      const delta = (item.count / totalPie) * 360;
      cursor += delta;
      return `${piePalette[index % piePalette.length]} ${start}deg ${cursor}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }, [data, totalPie]);

  if (!canView) {
    return <PermissionNotice message="Your account does not have dashboard access." />;
  }

  if (loading) {
    return <div className="rounded-xl border bg-white p-6">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  const cards = [
    { label: 'Total Orders', value: data?.cards?.total_orders ?? 0 },
    { label: 'Pending Orders', value: data?.cards?.pending_orders ?? 0 },
    { label: 'Total Vendors', value: data?.cards?.total_vendors ?? 0 },
    { label: 'Total Customers', value: data?.cards?.total_customers ?? 0 },
    { label: 'Open Inquiries', value: data?.cards?.total_inquiries ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Track platform activity across orders, vendors, customers, and inquiries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Vendors By Zone</h2>
            <p className="text-sm text-gray-500 mt-1">Live vendor coverage across every operational zone.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.vendor_zone_cards || []).map((zone) => (
              <div key={zone.id} className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{zone.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{zone.online_vendors_count} online right now</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#9BCBBF]">{zone.vendors_count}</p>
                    <p className="text-xs text-gray-500">vendors</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Order Status Mix</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time breakdown of active order states.</p>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="h-52 w-52 rounded-full"
              style={{ background: pieBackground }}
            >
              <div className="mx-auto mt-10 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-inner">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Tracked</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPie}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 w-full space-y-3">
              {(data?.order_status_pie || []).map((item, index) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: piePalette[index % piePalette.length] }}
                    />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
