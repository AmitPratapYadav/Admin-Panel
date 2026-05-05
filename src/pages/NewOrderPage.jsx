import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createAdminOrder, extractApiError, fetchAdminOrderCreateOptions } from '../services/admin';
import { fetchAdminProduct } from '../services/catalog';
import { fetchCities, fetchZones } from '../services/vendors';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const initialForm = {
  user_id: '',
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  address_line_1: '',
  address_line_2: '',
  city_id: '',
  address_city: '',
  address_state: '',
  pincode: '',
  latitude: '',
  longitude: '',
  product_id: '',
  quantity: '',
  selected_option_ids: [],
};

const NewOrderPage = () => {
  const { admin } = useAdminAuth();
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState({ customers: [], products: [] });
  const [zones, setZones] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('orders');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadOptions = async () => {
      try {
        setLoading(true);
        const [orderOptions, zoneData] = await Promise.all([
          fetchAdminOrderCreateOptions(),
          fetchZones(),
        ]);

        setOptions({
          customers: orderOptions?.customers || [],
          products: orderOptions?.products || [],
        });
        setZones(zoneData?.zones || []);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load order options.'));
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [canView]);

  useEffect(() => {
    if (!selectedZoneId) {
      setCities([]);
      setForm((prev) => ({ ...prev, city_id: '', address_city: '', address_state: '' }));
      return;
    }

    const loadCities = async () => {
      try {
        const response = await fetchCities(selectedZoneId);
        setCities(response?.cities || []);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load cities.'));
      }
    };

    loadCities();
  }, [selectedZoneId]);

  useEffect(() => {
    if (!form.product_id) {
      setProductDetails(null);
      setForm((prev) => ({ ...prev, quantity: '', selected_option_ids: [] }));
      return;
    }

    const loadProduct = async () => {
      try {
        const response = await fetchAdminProduct(form.product_id);
        setProductDetails(response?.product || null);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load product details.'));
      }
    };

    loadProduct();
  }, [form.product_id]);

  const handleCityChange = (cityId) => {
    const city = cities.find((item) => Number(item.id) === Number(cityId));
    setForm((prev) => ({
      ...prev,
      city_id: cityId,
      address_city: city?.name || '',
      address_state: city?.state_name || '',
    }));
  };

  const handleCustomerSelect = (customerId) => {
    const customer = options.customers.find((item) => Number(item.id) === Number(customerId));

    setForm((prev) => ({
      ...prev,
      user_id: customerId,
      customer_name: customer?.name || prev.customer_name,
      customer_phone: customer?.mobile || prev.customer_phone,
      customer_email: customer?.email || prev.customer_email,
    }));
  };

  const handleOptionChange = (groupId, valueId) => {
    const nextSelected = (form.selected_option_ids || []).filter((selectedId) => {
      const currentGroup = productDetails?.option_groups?.find((group) =>
        group.values.some((value) => Number(value.id) === Number(selectedId))
      );

      return currentGroup?.id !== groupId;
    });

    setForm((prev) => ({
      ...prev,
      selected_option_ids: [...nextSelected, valueId],
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
        user_id: form.user_id || undefined,
        city_id: Number(form.city_id),
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        selected_option_ids: form.selected_option_ids.map((id) => Number(id)),
      };

      const response = await createAdminOrder(payload);
      setSuccess(response?.message || 'Order created successfully.');
      setForm(initialForm);
      setSelectedZoneId('');
      setProductDetails(null);
    } catch (err) {
      setError(extractApiError(err, 'Unable to create order.'));
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have order creation access." />;
  }

  if (loading) {
    return <div className="rounded-xl border bg-white p-6">Loading order form...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <Link to="/orders" className="text-sm font-medium text-[#9BCBBF] hover:underline">Back to Orders</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
        <p className="mt-1 text-sm text-gray-500">Create an order manually from the admin panel and trigger vendor assignment with manual coordinates.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{success}</div> : null}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Customer & Address</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Registered Customer</label>
            <select value={form.user_id} onChange={(e) => handleCustomerSelect(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]">
              <option value="">Create / match automatically</option>
              {options.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.email ? `(${customer.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Customer Name</label>
              <input value={form.customer_name} onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
              <input value={form.customer_phone} onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" required />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={form.customer_email} onChange={(e) => setForm((prev) => ({ ...prev, customer_email: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Zone</label>
              <select value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]" required>
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
              <select value={form.city_id} onChange={(e) => handleCityChange(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]" required>
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Address Line 1</label>
              <input value={form.address_line_1} onChange={(e) => setForm((prev) => ({ ...prev, address_line_1: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Address Line 2</label>
              <input value={form.address_line_2} onChange={(e) => setForm((prev) => ({ ...prev, address_line_2: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Pincode</label>
              <input value={form.pincode} onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Latitude</label>
              <input type="number" step="0.0000001" value={form.latitude} onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Longitude</label>
              <input type="number" step="0.0000001" value={form.longitude} onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]" required />
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Selection</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Product</label>
            <select value={form.product_id} onChange={(e) => setForm((prev) => ({ ...prev, product_id: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]" required>
              <option value="">Select Product</option>
              {options.products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>

          {productDetails ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Quantity Bracket</label>
                <select value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]" required>
                  <option value="">Select Quantity</option>
                  {(productDetails.quantity_prices || []).map((price) => (
                    <option key={price.id} value={price.quantity}>{price.quantity} - Rs {Number(price.price || 0).toFixed(2)}</option>
                  ))}
                </select>
              </div>

              {(productDetails.option_groups || []).map((group) => (
                <div key={group.id}>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{group.name}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {(group.values || []).filter((value) => value.is_active).map((value) => {
                      const checked = form.selected_option_ids.includes(value.id);
                      return (
                        <label key={value.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${checked ? 'border-[#9BCBBF] bg-[#9BCBBF]/10' : 'border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`group-${group.id}`}
                              checked={checked}
                              onChange={() => handleOptionChange(group.id, value.id)}
                            />
                            <span>{value.label}</span>
                          </div>
                          <span className="text-gray-500">+ Rs {Number(value.price_modifier || 0).toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-5 text-sm text-gray-500">
              Product details will appear here after you choose a product.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-[#9BCBBF] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Order'}
            </button>
            <Link to="/orders" className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700">Cancel</Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewOrderPage;
