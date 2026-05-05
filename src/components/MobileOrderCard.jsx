import { Link } from 'react-router-dom';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  printed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-green-100 text-green-700',
  dispatched: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  'on-hold': 'bg-gray-100 text-gray-700',
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';

  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatAmount = (amount) => {
  const numericAmount = Number(amount || 0);
  return `Rs ${numericAmount.toFixed(2)}`;
};

const MobileOrderCard = ({ order }) => {
  return (
    <Link to={`/orders/${order.id}`} className="block bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-gray-900">
            {order.customer_name}
          </h3>

          <p className="text-sm text-[#9BCBBF]">
            {order.order_number}
          </p>
        </div>

        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[order.status] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {formatStatus(order.status)}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        Items: {order.items_count ?? 0}
      </p>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          {formatDate(order.created_at)}
        </span>

        <span className="font-semibold text-gray-900">
          {formatAmount(order.grand_total)}
        </span>
      </div>
    </Link>
  );
};

export default MobileOrderCard;
