import { useEffect, useMemo, useState } from 'react';
import OrdersTable from '../components/OrdersTable';
import MobileOrderCard from '../components/MobileOrderCard';
import api from '../services/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await api.get('/admin/orders');
        setOrders(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter(order => order.status === activeTab);
  }, [orders, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, rowsPerPage]);

  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Status',
      'Created At',
      'Total Amount',
    ];

    const rows = filteredOrders.map(order => [
      order.id,
      order.order_number,
      order.customer_name,
      order.customer_email || '',
      order.status,
      order.created_at,
      order.grand_total,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Recent Orders</h1>
        <div className="bg-white rounded-xl border p-6">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Recent Orders</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recent Orders</h1>
          <p className="text-gray-600 text-sm">
            Manage and track all your orders in one place
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 transition-all duration-200 hover:bg-primary-dark hover:text-white hover:border-primary"
          >
            Export CSV
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 transition-all duration-200 hover:bg-[#9BCBBF] hover:text-white hover:border-[#9BCBBF]"
          >
            Filters
          </button>
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      {showFilters && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-primary-dark hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        <OrdersTable
          orders={paginatedOrders}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
        />
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden p-4 space-y-4">
        {paginatedOrders.map(order => (
          <MobileOrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;