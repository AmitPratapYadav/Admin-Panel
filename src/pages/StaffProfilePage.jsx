import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createAdminStaff, extractApiError, fetchAdminStaffMember, updateAdminStaff } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const permissionOptions = ['dashboard', 'orders', 'vendors', 'products', 'customers', 'reports', 'inquiries', 'settings'];

const initialForm = {
  name: '',
  email: '',
  mobile: '',
  designation: '',
  password: '',
  status: 'active',
  permissions: ['dashboard', 'orders'],
};

const StaffProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const isCreate = !id;
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = admin?.role === 'admin';

  useEffect(() => {
    if (!canManage || isCreate) {
      setLoading(false);
      return;
    }

    const loadStaffMember = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetchAdminStaffMember(id);
        const staff = response?.staff;
        setForm({
          name: staff?.name || '',
          email: staff?.email || '',
          mobile: staff?.mobile || '',
          designation: staff?.designation || '',
          password: '',
          status: staff?.status || 'active',
          permissions: staff?.permissions || [],
        });
      } catch (err) {
        setError(extractApiError(err, 'Failed to load staff profile.'));
      } finally {
        setLoading(false);
      }
    };

    loadStaffMember();
  }, [canManage, id, isCreate]);

  if (!canManage) {
    return <PermissionNotice message="Only super admins can manage staff accounts." />;
  }

  const togglePermission = (permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        ...form,
        password: form.password || undefined,
      };

      if (isCreate) {
        const response = await createAdminStaff(payload);
        setSuccess(response?.message || 'Staff created successfully.');
        navigate(`/staff/${response?.staff?.id}`);
        return;
      }

      const response = await updateAdminStaff(id, payload);
      setSuccess(response?.message || 'Staff updated successfully.');
      setForm((prev) => ({
        ...prev,
        password: '',
        permissions: response?.staff?.permissions || prev.permissions,
      }));
    } catch (err) {
      setError(extractApiError(err, 'Unable to save staff profile.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to="/staff" className="text-sm font-medium text-[#9BCBBF] hover:underline">Back to Staff</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isCreate ? 'Create Staff' : 'Manage Staff'}</h1>
        <p className="mt-1 text-sm text-gray-500">Define credentials, designation, status, and section-level access.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{success}</div> : null}

      {loading ? (
        <div className="rounded-xl border bg-white p-6">Loading staff profile...</div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mobile</label>
              <input value={form.mobile} onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Designation</label>
              <input value={form.designation} onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{isCreate ? 'Password' : 'Reset Password'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" placeholder={isCreate ? 'Enter password' : 'Leave blank to keep current password'} required={isCreate} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">Permissions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissionOptions.map((permission) => (
                <label key={permission} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <input type="checkbox" checked={form.permissions.includes(permission)} onChange={() => togglePermission(permission)} className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm font-medium text-gray-700 capitalize">{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-[#9BCBBF] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Saving...' : isCreate ? 'Create Staff' : 'Save Changes'}
            </button>
            <Link to="/staff" className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700">Cancel</Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default StaffProfilePage;
