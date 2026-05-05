import { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { extractApiError, updateAdminSettings } from '../services/admin';
import PermissionNotice from '../components/PermissionNotice';

const SettingsPage = () => {
  const { admin, setAdmin } = useAdminAuth();
  const [form, setForm] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    mobile: admin?.mobile || '',
    designation: admin?.designation || '',
    avatar: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('settings');

  useEffect(() => {
    setForm({
      name: admin?.name || '',
      email: admin?.email || '',
      mobile: admin?.mobile || '',
      designation: admin?.designation || '',
      avatar: null,
    });
  }, [admin?.designation, admin?.email, admin?.mobile, admin?.name]);

  const initials = useMemo(() => {
    const source = admin?.name || 'Admin';
    return source.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }, [admin?.name]);

  if (!canView) {
    return <PermissionNotice message="Your account does not have settings access." />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('mobile', form.mobile);
      formData.append('designation', form.designation);
      if (form.avatar) {
        formData.append('avatar', form.avatar);
      }

      const response = await updateAdminSettings(formData);
      setAdmin(response?.admin);
      setSuccess(response?.message || 'Settings updated successfully.');
      setForm((prev) => ({ ...prev, avatar: null }));
    } catch (err) {
      setError(extractApiError(err, 'Unable to update settings.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account details and profile image.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{success}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-4">
            <label htmlFor="avatar" className="relative cursor-pointer">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-[#9BCBBF] flex items-center justify-center text-white text-2xl font-semibold">
                {admin?.avatar_url ? (
                  <img src={admin.avatar_url} alt={admin.name} className="h-full w-full object-cover" />
                ) : initials}
              </div>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.files?.[0] || null }))}
              />
            </label>
            <div>
              <p className="text-lg font-semibold text-gray-900">{admin?.name}</p>
              <p className="text-sm text-gray-500">{admin?.role_label}</p>
              <p className="text-xs text-gray-400 mt-1">{form.avatar ? `Selected: ${form.avatar.name}` : 'Click image to upload a new profile photo'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Mobile</label>
              <input value={form.mobile} onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Designation</label>
              <input value={form.designation} onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-xl bg-[#9BCBBF] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
          <div className="mt-5 space-y-4 text-sm text-gray-600">
            <p><span className="font-medium text-gray-900">Role:</span> {admin?.role_label}</p>
            <p><span className="font-medium text-gray-900">Status:</span> {admin?.status}</p>
            <p><span className="font-medium text-gray-900">Online:</span> {admin?.is_online ? 'Yes' : 'No'}</p>
            <p><span className="font-medium text-gray-900">Last Login:</span> {admin?.last_login_at ? new Date(admin.last_login_at).toLocaleString() : '-'}</p>
            <p><span className="font-medium text-gray-900">Last Active:</span> {admin?.last_active_at ? new Date(admin.last_active_at).toLocaleString() : '-'}</p>
            <div>
              <p className="font-medium text-gray-900 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {(admin?.permissions || []).map((permission) => (
                  <span key={permission} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
