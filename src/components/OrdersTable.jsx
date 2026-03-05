import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const statusColors = {
  shipped: 'bg-[#9BCBBF]/20 text-[#9BCBBF]',
  processing: 'bg-[#9BCBBF]/20 text-[#9BCBBF]',
  printed: 'bg-[#9BCBBF]/20 text-[#9BCBBF]',
  'on-hold': 'bg-[#9BCBBF]/20 text-[#9BCBBF]',
  cancelled: 'bg-[#9BCBBF]/20 text-[#9BCBBF]'
};

const formatStatus = (status) => {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const OrdersTable = () => {
  const { 
    paginatedOrders, 
    currentPage, 
    setCurrentPage, 
    rowsPerPage, 
    setRowsPerPage, 
    totalPages,
    filteredOrders
  } = useApp();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatAmount = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID / Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Received
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                
                <td className="px-4 py-4">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    {/* ✅ Order ID Green */}
                    <span className="text-sm font-medium text-[#9BCBBF]">
                      {order.id}
                    </span>
                    <span className="text-sm text-gray-600">
                      {order.customerName}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-gray-600">
                  {order.projectName}
                </td>

                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                    {formatStatus(order.status)}
                  </span>
                </td>

                <td className="px-4 py-4 text-sm text-gray-600">
                  {formatDate(order.dateReceived)}
                </td>

                <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                  {formatAmount(order.totalAmount)}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Rows per page:
          </span>

          {/* ✅ Focus Ring Green */}
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {(currentPage - 1) * rowsPerPage + 1}-
            {Math.min(currentPage * rowsPerPage, filteredOrders.length)} 
            of {filteredOrders.length}
          </span>

          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrdersTable;