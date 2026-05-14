import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Share2 } from 'lucide-react';
import { extractApiError, fetchAdminVendorEnquiries } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const openWhatsAppShare = (text) => {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(text || '')}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
};

const VendorEnquiriesPage = () => {
  const { admin } = useAdminAuth();
  const [inquiries, setInquiries] = useState([]);
  const [summary, setSummary] = useState({ total: 0, this_month: 0, with_gst: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('vendors');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadVendorEnquiries = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetchAdminVendorEnquiries({
          page: 1,
          perPage: 100,
          search,
          month,
        });
        setInquiries(response?.data || []);
        setSummary(response?.summary || { total: 0, this_month: 0, with_gst: 0 });
      } catch (err) {
        setError(extractApiError(err, 'Failed to load vendor enquiries.'));
      } finally {
        setLoading(false);
      }
    };

    loadVendorEnquiries();
  }, [canView, search, month]);

  const summaryCards = useMemo(() => ([
    { label: 'Total Enquiries', value: summary.total },
    { label: 'This Month', value: summary.this_month },
    { label: 'With GST', value: summary.with_gst },
  ]), [summary]);

  if (!canView) {
    return <PermissionNotice message="Your account does not have vendor access." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/vendors" className="text-sm font-medium text-[#9BCBBF] hover:underline">
            Back to Vendors
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New Vendor Enquiries</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review website applications from businesses interested in joining the vendor network.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_0.8fr_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search business, contact, phone, email, type..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
            />
          </div>

          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
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
          <div className="p-6 text-gray-500">Loading vendor enquiries...</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Business</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Contact</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Type / City</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Categories</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Received</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inquiries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-gray-500">No vendor enquiries found.</td>
                    </tr>
                  ) : inquiries.map((inquiry) => (
                    <tr key={inquiry.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">{inquiry.business_name || 'Vendor Lead'}</p>
                        <p className="mt-1 text-xs text-gray-500">Monthly Capacity: {inquiry.monthly_capacity || '-'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-900">{inquiry.contact_person_name || '-'}</p>
                        <p>{inquiry.phone_number || '-'}</p>
                        <p>{inquiry.email || '-'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <p>{inquiry.vendor_type || '-'}</p>
                        <p className="mt-1 text-xs text-gray-500">{inquiry.city || '-'} {inquiry.pincode ? `- ${inquiry.pincode}` : ''}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-sm">{inquiry.primary_categories || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDateTime(inquiry.created_at)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openWhatsAppShare(inquiry.share_text)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Share2 size={15} />
                            Share
                          </button>
                          <Link
                            to={`/vendors/enquiries/${inquiry.id}`}
                            className="rounded-lg bg-[#9BCBBF] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 md:hidden">
              {inquiries.length === 0 ? (
                <div className="rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                  No vendor enquiries found.
                </div>
              ) : inquiries.map((inquiry) => (
                <div key={inquiry.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">{inquiry.business_name || 'Vendor Lead'}</p>
                  <p className="mt-1 text-xs text-gray-500">{inquiry.vendor_type || '-'} · {inquiry.city || '-'}</p>
                  <p className="mt-3 text-sm text-gray-700">{inquiry.contact_person_name || '-'}</p>
                  <p className="text-sm text-gray-500">{inquiry.phone_number || '-'}</p>
                  <p className="text-sm text-gray-500">{inquiry.email || '-'}</p>
                  <p className="mt-3 text-xs text-gray-500">{formatDateTime(inquiry.created_at)}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openWhatsAppShare(inquiry.share_text)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    >
                      Share
                    </button>
                    <Link
                      to={`/vendors/enquiries/${inquiry.id}`}
                      className="flex-1 rounded-lg bg-[#9BCBBF] px-3 py-2 text-center text-sm font-medium text-white"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorEnquiriesPage;
