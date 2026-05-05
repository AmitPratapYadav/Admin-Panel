import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { assignAdminOrderVendor, extractApiError, fetchAdminAssignableVendors, fetchAdminOrder } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const { admin } = useAdminAuth();
  const [order, setOrder] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('orders');

  const loadOrder = async () => {
    const response = await fetchAdminOrder(id);
    setOrder(response);
  };

  const loadVendors = async (query = '') => {
    const response = await fetchAdminAssignableVendors(id, query);
    setVendors(response?.vendors || []);
  };

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      try {
        setLoading(true);
        setError('');
        await Promise.all([loadOrder(), loadVendors()]);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load order details.'));
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [canView, id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (canView) {
        loadVendors(vendorSearch).catch((err) => setError(extractApiError(err, 'Failed to search vendors.')));
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [canView, vendorSearch, id]);

  const handleAssign = async () => {
    if (!selectedVendorId) return;

    try {
      setAssignLoading(true);
      setError('');
      setSuccess('');
      const response = await assignAdminOrderVendor(id, Number(selectedVendorId));
      setOrder(response?.order);
      setSuccess(response?.message || 'Order reassigned successfully.');
      await loadVendors(vendorSearch);
    } catch (err) {
      setError(extractApiError(err, 'Unable to reassign vendor.'));
    } finally {
      setAssignLoading(false);
    }
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have order access." />;
  }

  if (loading) {
    return <div className="rounded-xl border bg-white p-6">Loading order details...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/orders" className="text-sm font-medium text-[#9BCBBF] hover:underline">Back to Orders</Link>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{success}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{order?.order_number}</h1>
                <p className="mt-1 text-sm text-gray-500">{order?.customer_name} | {order?.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{order?.status}</p>
                <p className="mt-1 text-xs text-gray-500">Assignment: {order?.vendor_assignment_status || 'unassigned'}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
              <div>
                <p className="font-medium text-gray-900">Address</p>
                <p className="mt-1">{order?.address_line_1}</p>
                <p>{order?.address_line_2 || '-'}</p>
                <p>{order?.city}, {order?.state} {order?.pincode}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Coordinates</p>
                <p className="mt-1">Lat: {order?.latitude ?? '-'}</p>
                <p>Lng: {order?.longitude ?? '-'}</p>
                <p className="mt-2"><span className="font-medium text-gray-900">Zone:</span> {order?.zone_name || '-'}</p>
                <p><span className="font-medium text-gray-900">City:</span> {order?.city_name || '-'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
            <div className="mt-5 space-y-5">
              {(order?.items || []).map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{item.product_name_snapshot}</p>
                      <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>Base: Rs {Number(item.base_quantity_price || 0).toFixed(2)}</p>
                      <p>Options: Rs {Number(item.option_modifier_total || 0).toFixed(2)}</p>
                      <p className="mt-1 font-semibold text-gray-900">Total: Rs {Number(item.line_total || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {(item.selected_options || []).length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.selected_options.map((option) => (
                        <span key={option.id} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                          {option.group_name_snapshot}: {option.value_label_snapshot}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Assignment Timeline</h2>
            <div className="mt-5 space-y-4">
              {(order?.vendor_assignments || []).map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{assignment.vendor_name || 'Vendor'}</p>
                      <p className="text-sm text-gray-500">{assignment.vendor_code || '-'}</p>
                    </div>
                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                      {assignment.assignment_type} / {assignment.assignment_status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>Assigned At: {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString() : '-'}</p>
                    <p>Admin: {assignment.admin_name || '-'}</p>
                    <p>Distance: {assignment.distance_km ?? '-'} km</p>
                    {assignment.rejection_reason ? <p>Reason: {assignment.rejection_reason}</p> : null}
                    {assignment.notes ? <p>Notes: {assignment.notes}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Current Vendor</h2>
            {order?.current_vendor ? (
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><span className="font-medium text-gray-900">Name:</span> {order.current_vendor.business_name}</p>
                <p><span className="font-medium text-gray-900">Code:</span> {order.current_vendor.vendor_code}</p>
                <p><span className="font-medium text-gray-900">Phone:</span> {order.current_vendor.phone}</p>
                <p><span className="font-medium text-gray-900">Email:</span> {order.current_vendor.email}</p>
                <p><span className="font-medium text-gray-900">Online:</span> {order.current_vendor.is_online ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No vendor assigned yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Manual Reassignment</h2>
            <p className="mt-1 text-sm text-gray-500">Allowed when order is pending or processing. Reassignment resets the order status to pending.</p>

            <div className="mt-5 space-y-4">
              <input value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} placeholder="Search vendor by code, name or email" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />

              <select value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]">
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.business_name} {vendor.distance_km !== null ? `(${vendor.distance_km} km)` : ''}
                  </option>
                ))}
              </select>

              <button onClick={handleAssign} disabled={assignLoading || !selectedVendorId} className="w-full rounded-xl bg-[#9BCBBF] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
                {assignLoading ? 'Assigning...' : 'Assign Vendor'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Financials</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Subtotal:</span> Rs {Number(order?.subtotal || 0).toFixed(2)}</p>
              <p><span className="font-medium text-gray-900">Tax:</span> Rs {Number(order?.tax_amount || 0).toFixed(2)}</p>
              <p><span className="font-medium text-gray-900">Shipping:</span> Rs {Number(order?.shipping_amount || 0).toFixed(2)}</p>
              <p className="pt-2 text-base font-semibold text-gray-900">Grand Total: Rs {Number(order?.grand_total || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
