import { useEffect, useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { deleteAdminCustomer, extractApiError, fetchAdminCustomers } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const CustomersPage = () => {
  const { admin } = useAdminAuth();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [month, setMonth] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState(null);

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('customers');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';
    setSearchInput(nextSearch);
    setSearch(nextSearch);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, month, rowsPerPage]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchAdminCustomers({
        page: currentPage,
        perPage: rowsPerPage,
        search,
        month,
      });
      setCustomers(response?.data || []);
      setTotalItems(response?.total || 0);
      setTotalPages(response?.last_page || 1);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load customers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadCustomers();
    } else {
      setLoading(false);
    }
  }, [canView, currentPage, rowsPerPage, search, month]);

  const handleDelete = async (customerId) => {
    const confirmed = window.confirm('Delete this customer and all related orders?');
    if (!confirmed) return;

    try {
      setActionId(customerId);
      await deleteAdminCustomer(customerId);
      await loadCustomers();
    } catch (err) {
      alert(extractApiError(err, 'Unable to delete customer.'));
    } finally {
      setActionId(null);
    }
  };

  const handleExport = async () => {
    try {
      const { utils, writeFile } = await import('xlsx');
      const response = await fetchAdminCustomers({
        page: 1,
        perPage: Math.max(totalItems, 100),
        search,
        month,
      });

      const rows = (response?.data || []).map((customer) => ({
        Name: customer.name || '',
        Email: customer.email || '',
        Phone: customer.mobile || '',
        'Orders Count': customer.orders_count || 0,
        'Registered At': customer.created_at || '',
      }));

      const worksheet = utils.json_to_sheet(rows);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Customers');
      writeFile(workbook, `zivaprint-customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert(extractApiError(err, 'Unable to export customers.'));
    }
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have customer access." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Review all platform customers and manage their records.</p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={16} />
          Export Excel
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.8fr_auto] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search customer by name, email or phone"
              className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
            />
          </div>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
          />

          <button
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setMonth('');
            }}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Loading customers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Phone</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Orders</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Joined</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-gray-500">No customers found.</td>
                  </tr>
                ) : customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {customer.avatar_url ? (
                          <img src={customer.avatar_url} alt={customer.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9BCBBF] text-white text-sm font-semibold">
                            {(customer.name || 'CU').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{customer.name || 'Customer'}</p>
                          <p className="text-sm text-gray-500">{customer.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{customer.mobile || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{customer.orders_count || 0}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDelete(customer.id)}
                        disabled={actionId === customer.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        {actionId === customer.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          {(totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1)}-{Math.min(currentPage * rowsPerPage, totalItems)} of {totalItems}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-2"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50" disabled={currentPage === 1}>Prev</button>
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50" disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
