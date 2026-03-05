import { useApp } from '../context/AppContext';

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

const MobileOrderCard = ({ order }) => {
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-gray-900">
            {order.customerName}
          </h3>

          {/* ✅ Order ID Green */}
          <p className="text-sm text-[#9BCBBF]">
            {order.id}
          </p>
        </div>

        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
          {formatStatus(order.status)}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        {order.projectName}
      </p>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          {formatDate(order.dateReceived)}
        </span>

        <span className="font-semibold text-gray-900">
          {formatAmount(order.totalAmount)}
        </span>
      </div>
    </div>
  );
};

const MobileOrderList = () => {
  const { paginatedOrders } = useApp();

  return (
    <div className="md:hidden p-4">
      {paginatedOrders.map((order) => (
        <MobileOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
};

export default MobileOrderList;