import { useState } from 'react';
import { useApp } from '../context/AppContext';
import OrdersTable from '../components/OrdersTable';
import MobileOrderCard from '../components/MobileOrderCard';

const OrdersPage = () => {
  const {
    filteredOrders,
    paginatedOrders,
    activeTab,
    setActiveTab
  } = useApp();

  // ✅ Toggle state for Filters
  const [showFilters, setShowFilters] = useState(true);

  // ✅ Export CSV Function
  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Customer Name',
      'Project Name',
      'Status',
      'Date Received',
      'Total Amount'
    ];

    const rows = filteredOrders.map(order => [
      order.id,
      order.customerName,
      order.projectName,
      order.status,
      order.dateReceived,
      order.totalAmount
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

        {/* RIGHT SIDE BUTTONS */}
        <div className="flex items-center gap-3">

          {/* ✅ Export Button */}
          
            <button
                onClick={handleExportCSV}
                   className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 transition-all duration-200 hover:bg-primary-dark hover:text-white hover:border-primary"
                      >
                        Export CSV
                  </button>

          {/* ✅ Filters Toggle Button */}
          <button
  onClick={() => setShowFilters(!showFilters)}
  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 transition-all duration-200 hover:bg-[#9BCBBF] hover:text-white hover:border-[#9BCBBF]"
            >
  Filters
            </button>

        </div>
      </div>

      {/* ✅ STATUS FILTER TABS (Toggleable) */}
      {showFilters && (
        <div className="flex gap-2 mb-6 flex-wrap">
         {['all', 'processing', 'printed', 'shipped'].map(status => (
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
        <OrdersTable />
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