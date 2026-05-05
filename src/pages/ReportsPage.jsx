import { useEffect, useMemo, useState } from 'react';
import { fetchAdminReports, extractApiError } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import { fetchZones } from '../services/vendors';
import PermissionNotice from '../components/PermissionNotice';

const barColors = ['#9BCBBF', '#60a5fa', '#a78bfa', '#f59e0b', '#f87171'];

const ReportsPage = () => {
  const { admin } = useAdminAuth();
  const [report, setReport] = useState(null);
  const [zones, setZones] = useState([]);
  const [range, setRange] = useState('month');
  const [zoneId, setZoneId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('reports');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadZones = async () => {
      try {
        const response = await fetchZones();
        setZones(response?.zones || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadZones();
  }, [canView]);

  useEffect(() => {
    if (!canView) return;

    const loadReports = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetchAdminReports({
          range,
          zone_id: zoneId || undefined,
        });
        setReport(response);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load reports.'));
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [canView, range, zoneId]);

  const maxOrders = useMemo(
    () => Math.max(...(report?.orders_trend || []).map((item) => item.count), 1),
    [report]
  );

  if (!canView) {
    return <PermissionNotice message="Your account does not have reports access." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Review performance trends across orders, vendors, and inquiries.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>

          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white"
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-xl border bg-white p-6">Loading reports...</div>
      ) : (
        <div className="grid gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Orders Received</h2>
            <p className="mt-1 text-sm text-gray-500">Order volume by selected time range.</p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4 items-end h-72">
              {(report?.orders_trend || []).map((item, index) => (
                <div key={item.label} className="flex flex-col items-center justify-end h-full">
                  <div className="text-xs text-gray-600 mb-2">{item.count}</div>
                  <div
                    className="w-full max-w-[72px] rounded-t-xl"
                    style={{
                      height: `${Math.max((item.count / maxOrders) * 180, item.count ? 20 : 8)}px`,
                      backgroundColor: barColors[index % barColors.length],
                    }}
                  />
                  <div className="mt-3 text-xs text-center text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Registered Vendors By Zone</h2>
              <div className="mt-5 space-y-4">
                {(report?.vendors_zone_pie || []).map((item, index) => (
                  <div key={item.zone}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">{item.zone}</span>
                      <span className="text-gray-500">{item.count}</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(item.count * 12, 100)}%`,
                          backgroundColor: barColors[index % barColors.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Bulk vs Corporate Inquiries</h2>
              <div className="mt-5 space-y-4">
                {(report?.inquiries_trend || []).map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Bulk: {item.bulk}</span>
                        <span>Corporate: {item.corporate}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full bg-[#9BCBBF]" style={{ width: `${(item.bulk / Math.max(item.bulk + item.corporate, 1)) * 100}%` }} />
                      <div className="h-full bg-[#60a5fa]" style={{ width: `${(item.corporate / Math.max(item.bulk + item.corporate, 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
