import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, Search } from 'lucide-react';
import OrdersTable from '../components/OrdersTable';
import MobileOrderCard from '../components/MobileOrderCard';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const OrdersPage = () => {
  const { admin } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('orders');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, rowsPerPage]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await api.get('/admin/orders', {
          params: {
            page: currentPage,
            per_page: rowsPerPage,
            search: search || undefined,
            status: status || undefined,
          },
        });

        setOrders(res.data?.data || []);
        setTotalItems(res.data?.total || 0);
        setTotalPages(res.data?.last_page || 1);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(err?.response?.data?.message || 'Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [canView, currentPage, rowsPerPage, search, status]);

  const summary = useMemo(() => ({
    total: totalItems,
    pending: orders.filter((order) => order.status === 'pending').length,
    processing: orders.filter((order) => order.status === 'processing').length,
    dispatched: orders.filter((order) => order.status === 'dispatched').length,
  }), [orders, totalItems]);

  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Current Vendor',
      'Status',
      'Assignment Status',
      'Created At',
      'Total Amount',
    ];

    const rows = orders.map((order) => [
      order.order_number,
      order.customer_name,
      order.customer_email || '',
      order.current_vendor_name || '',
      order.status,
      order.vendor_assignment_status || '',
      order.created_at,
      order.grand_total,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map((e) => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have order access." />;
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Orders</h1>
        <div className="bg-white rounded-xl border p-6">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 text-sm">
            Review every order, open the dedicated manage screen, and reassign vendors when needed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Export CSV
          </button>

          <Link
            to="/new-order"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9BCBBF] text-white hover:opacity-90"
          >
            <Plus size={16} />
            New Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['Total Orders', summary.total],
          ['Pending', summary.pending],
          ['Processing', summary.processing],
          ['Dispatched', summary.dispatched],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr_auto] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order number, customer, email or phone..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="dispatched">Dispatched</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatus('');
            }}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
          {error}
        </div>
      ) : null}

      <div className="hidden md:block">
        <OrdersTable
          orders={orders}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          totalItems={totalItems}
        />
      </div>

      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <MobileOrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
