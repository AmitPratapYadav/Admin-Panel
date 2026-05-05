import { useEffect, useState } from 'react';
import { Download, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { deleteAdminStaff, extractApiError, fetchAdminStaff } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const StaffPage = () => {
  const { admin } = useAdminAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [actionId, setActionId] = useState(null);

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('staff');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchAdminStaff({
        page: 1,
        perPage: 200,
        search,
        role,
      });
      setStaff(response?.data || []);
      setTotalItems(response?.total || 0);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load staff.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadStaff();
    } else {
      setLoading(false);
    }
  }, [canView, search, role]);

  const handleDelete = async (staffMember) => {
    if (staffMember.role === 'admin') return;

    const confirmed = window.confirm(`Delete ${staffMember.name}?`);
    if (!confirmed) return;

    try {
      setActionId(staffMember.id);
      await deleteAdminStaff(staffMember.id);
      await loadStaff();
    } catch (err) {
      alert(extractApiError(err, 'Unable to delete staff member.'));
    } finally {
      setActionId(null);
    }
  };

  const handleExport = async () => {
    const { utils, writeFile } = await import('xlsx');
    const rows = staff.map((member) => ({
      Name: member.name,
      Email: member.email,
      Mobile: member.mobile || '',
      Role: member.role_label,
      Designation: member.designation || '',
      Status: member.status,
      Online: member.is_online ? 'Yes' : 'No',
      Permissions: (member.permissions || []).join(', '),
    }));
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Staff');
    writeFile(workbook, `zivaprint-staff-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have staff management access." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-1 text-sm text-gray-500">Create staff accounts, control access, and monitor online presence.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download size={16} />
            Export Excel
          </button>
          {admin?.role === 'admin' ? (
            <Link to="/staff/new" className="inline-flex items-center gap-2 rounded-lg bg-[#9BCBBF] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              <Plus size={16} />
              Add Staff
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Staff</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Online Now</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600">{staff.filter((item) => item.is_online).length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Super Admins</p>
          <p className="mt-3 text-3xl font-bold text-blue-600">{staff.filter((item) => item.role === 'admin').length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Staff Users</p>
          <p className="mt-3 text-3xl font-bold text-[#9BCBBF]">{staff.filter((item) => item.role === 'staff').length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_auto] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search staff by name, email, designation..." className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white">
            <option value="">All Roles</option>
            <option value="admin">Super Admin</option>
            <option value="staff">Staff</option>
          </select>
          <button onClick={() => { setSearchInput(''); setSearch(''); setRole(''); }} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Reset</button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Loading staff...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Staff</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Permissions</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Online</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-gray-500">No staff found.</td>
                  </tr>
                ) : staff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9BCBBF] text-white text-sm font-semibold">
                            {(member.name || 'ST').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <p>{member.role_label}</p>
                      <p className="text-xs text-gray-500">{member.designation || '-'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-md flex-wrap gap-2">
                        {(member.permissions || []).map((permission) => (
                          <span key={permission} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${member.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {member.is_online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link to={`/staff/${member.id}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Manage</Link>
                        {admin?.role === 'admin' && member.role !== 'admin' ? (
                          <button onClick={() => handleDelete(member)} disabled={actionId === member.id} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-60">
                            <Trash2 size={14} />
                            {actionId === member.id ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : null}
                      </div>
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

export default StaffPage;
