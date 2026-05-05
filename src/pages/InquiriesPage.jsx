import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { extractApiError, fetchAdminInquiries } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const InquiriesPage = () => {
  const { admin } = useAdminAuth();
  const [inquiries, setInquiries] = useState([]);
  const [summary, setSummary] = useState({ total: 0, bulk: 0, corporate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [month, setMonth] = useState('');

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('inquiries');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadInquiries = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetchAdminInquiries({
          page: 1,
          perPage: 100,
          search,
          type,
          month,
        });
        setInquiries(response?.data || []);
        setSummary(response?.summary || { total: 0, bulk: 0, corporate: 0 });
      } catch (err) {
        setError(extractApiError(err, 'Failed to load inquiries.'));
      } finally {
        setLoading(false);
      }
    };

    loadInquiries();
  }, [canView, search, type, month]);

  if (!canView) {
    return <PermissionNotice message="Your account does not have inquiry access." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk & Corporate Inquiries</h1>
        <p className="mt-1 text-sm text-gray-500">Track website form submissions from bulk order and corporate order pages.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Total Inquiries', summary.total],
          ['Bulk Orders', summary.bulk],
          ['Corporate Leads', summary.corporate],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, company, phone, product..." className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
          </div>

          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white">
            <option value="">All Types</option>
            <option value="bulk">Bulk</option>
            <option value="corporate">Corporate</option>
          </select>

          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm" />

          <button onClick={() => { setSearchInput(''); setSearch(''); setType(''); setMonth(''); }} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Reset</button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Loading inquiries...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Lead</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Product / Industry</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Requirements</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-gray-500">No inquiries found.</td>
                  </tr>
                ) : inquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${inquiry.inquiry_type === 'bulk' ? 'bg-[#9BCBBF]/20 text-[#537c72]' : 'bg-blue-100 text-blue-700'}`}>
                        {inquiry.inquiry_type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{inquiry.full_name || inquiry.contact_person_name || inquiry.company_name || 'Lead'}</p>
                      <p className="text-sm text-gray-500">{inquiry.phone_number}</p>
                      <p className="text-sm text-gray-500">{inquiry.email || '-'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <p>{inquiry.product_name || inquiry.industry_type || '-'}</p>
                      <p className="text-xs text-gray-500 mt-1">{inquiry.company_name || inquiry.estimated_quantity || '-'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-md">
                      {inquiry.requirements || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {inquiry.created_at ? new Date(inquiry.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiriesPage;
