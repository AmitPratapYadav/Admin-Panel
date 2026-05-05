import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return '-';

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const VendorsTable = ({
  vendors = [],
  currentPage = 1,
  setCurrentPage = () => {},
  rowsPerPage = 10,
  setRowsPerPage = () => {},
  totalPages = 1,
  totalItems = 0,
  actionLoadingId = null,
  onToggleOnline = () => {},
}) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zone / City
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Radius
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No vendors found.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#9BCBBF]">
                        {vendor.business_name}
                      </span>
                      <span className="text-xs text-gray-500">{vendor.vendor_code}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div>{vendor.contact_person_name || '-'}</div>
                    <div className="text-xs text-gray-500">{vendor.email}</div>
                    <div className="text-xs text-gray-500">{vendor.phone}</div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div>{vendor.zone_name || '-'}</div>
                    <div className="text-xs text-gray-500">{vendor.city_name || '-'}</div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    {Number(vendor.service_radius_km || 0).toFixed(1)} km
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex w-fit px-2 py-1 text-xs font-medium rounded-full ${
                          vendor.is_online
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {vendor.is_online ? 'Online' : 'Offline'}
                      </span>
                      <span
                        className={`inline-flex w-fit px-2 py-1 text-xs font-medium rounded-full ${
                          vendor.is_active
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    {formatDate(vendor.last_seen_at || vendor.created_at)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/vendors/${vendor.id}`}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </Link>

                      <button
                        onClick={() => onToggleOnline(vendor)}
                        disabled={actionLoadingId === vendor.id}
                        className={`rounded-lg px-3 py-2 text-xs font-medium text-white ${
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setCurrentPage(1);
              setRowsPerPage(Number(e.target.value));
            }}
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
            {start}-{end} of {totalItems}
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

export default VendorsTable;
