import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, Plus } from 'lucide-react';
import VendorsTable from '../components/VendorsTable';
import {
  extractApiError,
  fetchAdminVendors,
  fetchZones,
  toggleAdminVendorOnline,
} from '../services/vendors';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const VendorsPage = () => {
  const { admin } = useAdminAuth();
  const [vendors, setVendors] = useState([]);
  const [zones, setZones] = useState([]);
  const [summary, setSummary] = useState({ total: 0, online: 0, offline: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [onlineStatus, setOnlineStatus] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('vendors');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, zoneId, onlineStatus, rowsPerPage]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadZones = async () => {
      try {
        const data = await fetchZones();
        setZones(data?.zones || []);
      } catch (err) {
        console.error('Failed to load zones:', err);
      }
    };

    loadZones();
  }, [canView]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await fetchAdminVendors({
        page: currentPage,
        perPage: rowsPerPage,
        search,
        zoneId,
        onlineStatus,
      });

      setVendors(data?.data || []);
      setSummary(data?.summary || { total: 0, online: 0, offline: 0 });
      setTotalItems(data?.total || 0);
      setTotalPages(data?.last_page || 1);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load vendors.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadVendors();
    } else {
      setLoading(false);
    }
  }, [canView, currentPage, rowsPerPage, search, zoneId, onlineStatus]);

  const summaryCards = useMemo(() => ([
    { label: 'Total Vendors', value: summary.total, accent: 'text-slate-900' },
    { label: 'Online Vendors', value: summary.online, accent: 'text-emerald-600' },
    { label: 'Offline Vendors', value: summary.offline, accent: 'text-gray-600' },
  ]), [summary]);

  const handleToggleOnline = async (vendor) => {
    try {
      setActionLoadingId(vendor.id);
      await toggleAdminVendorOnline(vendor.id, !vendor.is_online);
      await loadVendors();
    } catch (err) {
      alert(extractApiError(err, 'Unable to update vendor status.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const { utils, writeFile } = await import('xlsx');

      const data = await fetchAdminVendors({
        page: 1,
        perPage: Math.max(totalItems, 100),
        search,
        zoneId,
        onlineStatus,
      });

      const exportRows = (data?.data || []).map((vendor) => ({
        'Vendor Code': vendor.vendor_code,
        'Business Name': vendor.business_name,
        'Contact Person': vendor.contact_person_name || '',
        Email: vendor.email,
        Phone: vendor.phone,
        Zone: vendor.zone_name || '',
        City: vendor.city_name || '',
        'Service Radius (KM)': Number(vendor.service_radius_km || 0).toFixed(2),
        'Online Status': vendor.is_online ? 'Online' : 'Offline',
        'Account Status': vendor.is_active ? 'Active' : 'Inactive',
        'Approval Status': vendor.approval_status,
        'Last Seen': vendor.last_seen_at || '',
        'Created At': vendor.created_at || '',
      }));

      const worksheet = utils.json_to_sheet(exportRows);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Vendors');
      writeFile(workbook, `zivaprint-vendors-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert(extractApiError(err, 'Unable to export vendor data.'));
    } finally {
      setExportLoading(false);
    }
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have vendor access." />;
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Management</h1>
        <div className="bg-white rounded-xl border p-6">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 text-sm">
            Create vendors, manage profiles, and control live availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 transition-all duration-200 hover:bg-primary-dark hover:text-white hover:border-primary disabled:opacity-60"
          >
            <Download size={16} />
            {exportLoading ? 'Exporting...' : 'Export Excel'}
          </button>

          <Link
            to="/vendors/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9BCBBF] text-white transition-all duration-200 hover:opacity-90"
          >
            <Plus size={16} />
            Add Vendor
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-2 ${card.accent}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr_auto] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search vendor by name, code, email, phone..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
            />
          </div>

          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>

          <select
            value={onlineStatus}
            onChange={(e) => setOnlineStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          <button
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setZoneId('');
              setOnlineStatus('all');
            }}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-6">
          {error}
        </div>
      ) : null}

      <div className="hidden md:block">
        <VendorsTable
          vendors={vendors}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          totalItems={totalItems}
          actionLoadingId={actionLoadingId}
          onToggleOnline={handleToggleOnline}
        />
      </div>

      <div className="md:hidden space-y-4">
        {vendors.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            No vendors found.
          </div>
        ) : (
          vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{vendor.business_name}</p>
                  <p className="text-xs text-[#9BCBBF]">{vendor.vendor_code}</p>
                  <p className="text-xs text-gray-500 mt-2">{vendor.email}</p>
                  <p className="text-xs text-gray-500">{vendor.phone}</p>
                </div>

                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    vendor.is_online
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {vendor.is_online ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p>{vendor.zone_name || '-'} / {vendor.city_name || '-'}</p>
                <p>Radius: {Number(vendor.service_radius_km || 0).toFixed(1)} km</p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link
                  to={`/vendors/${vendor.id}`}
                  className="flex-1 text-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  View
                </Link>

                <button
                  onClick={() => handleToggleOnline(vendor)}
                  disabled={actionLoadingId === vendor.id}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white ${
                    vendor.is_online ? 'bg-slate-700' : 'bg-[#9BCBBF]'
                  } disabled:opacity-60`}
                >
                  {actionLoadingId === vendor.id
                    ? 'Saving...'
                    : vendor.is_online
                    ? 'Go Offline'
                    : 'Go Online'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorsPage;
