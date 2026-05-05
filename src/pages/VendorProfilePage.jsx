import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createAdminVendor,
  extractApiError,
  fetchAdminVendor,
  fetchCities,
  fetchZones,
  toggleAdminVendorOnline,
  updateAdminVendor,
} from '../services/vendors';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const initialForm = {
  business_name: '',
  contact_person_name: '',
  email: '',
  phone: '',
  password: '',
  zone_id: '',
  city_id: '',
  address_line_1: '',
  address_line_2: '',
  area_name: '',
  pincode: '',
  formatted_address: '',
  google_place_id: '',
  latitude: '',
  longitude: '',
  service_radius_km: 5,
  approval_status: 'approved',
  is_active: true,
  is_online: false,
};

const VendorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const isCreate = !id;

  const [form, setForm] = useState(initialForm);
  const [zones, setZones] = useState([]);
  const [cities, setCities] = useState([]);
  const [vendorCode, setVendorCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('vendors');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      try {
        setLoading(true);
        setError('');

        const zoneData = await fetchZones();
        setZones(zoneData?.zones || []);

        if (isCreate) {
          setForm(initialForm);
          setVendorCode('');
          return;
        }

        const vendorData = await fetchAdminVendor(id);
        const vendor = vendorData?.vendor;

        if (!vendor) {
          throw new Error('Vendor not found.');
        }

        const cityData = vendor.zone_id ? await fetchCities(vendor.zone_id) : { cities: [] };
        setCities(cityData?.cities || []);

        setVendorCode(vendor.vendor_code || '');
        setForm({
          business_name: vendor.business_name || '',
          contact_person_name: vendor.contact_person_name || '',
          email: vendor.email || '',
          phone: vendor.phone || '',
          password: '',
          zone_id: vendor.zone_id || '',
          city_id: vendor.city_id || '',
          address_line_1: vendor.address_line_1 || '',
          address_line_2: vendor.address_line_2 || '',
          area_name: vendor.area_name || '',
          pincode: vendor.pincode || '',
          formatted_address: vendor.formatted_address || '',
          google_place_id: vendor.google_place_id || '',
          latitude: vendor.latitude ?? '',
          longitude: vendor.longitude ?? '',
          service_radius_km: vendor.service_radius_km || 5,
          approval_status: vendor.approval_status || 'approved',
          is_active: !!vendor.is_active,
          is_online: !!vendor.is_online,
        });
      } catch (err) {
        setError(extractApiError(err, 'Failed to load vendor profile.'));
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [canView, id, isCreate]);

  const selectedZoneName = useMemo(
    () => zones.find((zone) => Number(zone.id) === Number(form.zone_id))?.name || '-',
    [zones, form.zone_id]
  );

  const selectedCityName = useMemo(
    () => cities.find((city) => Number(city.id) === Number(form.city_id))?.name || '-',
    [cities, form.city_id]
  );

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleZoneChange = async (event) => {
    const nextZoneId = event.target.value;

    updateField('zone_id', nextZoneId);
    updateField('city_id', '');
    setCities([]);

    if (!nextZoneId) {
      return;
    }

    try {
      const cityData = await fetchCities(nextZoneId);
      setCities(cityData?.cities || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load cities.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        business_name: form.business_name,
        contact_person_name: form.contact_person_name,
        email: form.email,
        phone: form.phone,
        password: form.password || undefined,
        city_id: form.city_id ? Number(form.city_id) : null,
        address_line_1: form.address_line_1,
        address_line_2: form.address_line_2,
        area_name: form.area_name,
        pincode: form.pincode,
        formatted_address: form.formatted_address,
        google_place_id: form.google_place_id,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        service_radius_km: Number(form.service_radius_km || 0),
        approval_status: form.approval_status,
        is_active: !!form.is_active,
        is_online: !!form.is_online,
      };

      if (!payload.password) {
        delete payload.password;
      }

      if (isCreate) {
        const data = await createAdminVendor(payload);
        setSuccess(data?.message || 'Vendor created successfully.');
        navigate(`/vendors/${data?.vendor?.id}`);
        return;
      }

      const data = await updateAdminVendor(id, payload);
      setVendorCode(data?.vendor?.vendor_code || vendorCode);
      setSuccess(data?.message || 'Vendor updated successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Unable to save vendor profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOnline = async () => {
    try {
      setToggleLoading(true);
      setError('');
      setSuccess('');

      const data = await toggleAdminVendorOnline(id, !form.is_online);
      updateField('is_online', !!data?.vendor?.is_online);
      setSuccess(data?.message || 'Vendor status updated successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Unable to update vendor availability.'));
    } finally {
      setToggleLoading(false);
    }
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setLocationLoading(true);
    setError('');
    setSuccess('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('latitude', position.coords.latitude.toFixed(7));
        updateField('longitude', position.coords.longitude.toFixed(7));
        setSuccess('Current coordinates captured successfully. Save changes to persist them.');
        setLocationLoading(false);
      },
      (geoError) => {
        let message = 'Unable to capture current location.';

        if (geoError.code === 1) message = 'Location permission was denied.';
        if (geoError.code === 2) message = 'Location information is unavailable.';
        if (geoError.code === 3) message = 'Location request timed out.';

        setError(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have vendor access." />;
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isCreate ? 'Create Vendor' : 'Vendor Profile'}
        </h1>
        <div className="bg-white rounded-xl border p-6">Loading vendor profile...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/vendors" className="text-sm font-medium text-[#9BCBBF] hover:underline">
          Back to Vendors
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isCreate ? 'Create Vendor' : 'Vendor Profile'}
          </h1>
          <p className="text-gray-600 text-sm">
            {isCreate
              ? 'Add a new vendor account with serviceability and login details.'
              : 'Update vendor business information and live status.'}
          </p>
        </div>

        {!isCreate ? (
          <button
            onClick={handleToggleOnline}
            disabled={toggleLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              form.is_online ? 'bg-slate-800' : 'bg-[#9BCBBF]'
            } disabled:opacity-60`}
          >
            {toggleLoading
              ? 'Updating...'
              : form.is_online
              ? 'Mark Offline'
              : 'Mark Online'}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Keep the vendor record aligned with service area and account status.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
              <input
                type="text"
                value={form.contact_person_name}
                onChange={(e) => updateField('contact_person_name', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isCreate ? 'Password' : 'Reset Password'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                placeholder={isCreate ? 'Enter vendor password' : 'Leave blank to keep current password'}
                required={isCreate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
              <select
                value={form.approval_status}
                onChange={(e) => updateField('approval_status', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
              <select
                value={form.zone_id}
                onChange={handleZoneChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <select
                value={form.city_id}
                onChange={(e) => updateField('city_id', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
              <input
                type="text"
                value={form.address_line_1}
                onChange={(e) => updateField('address_line_1', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
              <input
                type="text"
                value={form.address_line_2}
                onChange={(e) => updateField('address_line_2', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area Name</label>
              <input
                type="text"
                value={form.area_name}
                onChange={(e) => updateField('area_name', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => updateField('pincode', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Radius (KM)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.service_radius_km}
                onChange={(e) => updateField('service_radius_km', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formatted Address</label>
            <textarea
              rows={3}
              value={form.formatted_address}
              onChange={(e) => updateField('formatted_address', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Location Capture</p>
                <p className="text-xs text-gray-500 mt-1">
                  Use the browser location API to auto-fill vendor coordinates.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCaptureLocation}
                disabled={locationLoading}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {locationLoading ? 'Capturing...' : 'Use Current Location'}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                step="0.0000001"
                value={form.latitude}
                onChange={(e) => updateField('latitude', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="0.0000001"
                value={form.longitude}
                onChange={(e) => updateField('longitude', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Google Place ID</label>
              <input
                type="text"
                value={form.google_place_id}
                onChange={(e) => updateField('google_place_id', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
              <p className="mt-1 text-xs text-gray-500">
                If left blank, a manual place ID will be generated on save.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Vendor account active</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                checked={!!form.is_online}
                onChange={(e) => updateField('is_online', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Vendor currently online</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#9BCBBF] text-white px-5 py-3 font-medium disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : isCreate
                ? 'Create Vendor'
                : 'Save Changes'}
            </button>

            <Link
              to="/vendors"
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Vendor Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Vendor Code:</span> {vendorCode || 'Auto generated after create'}</p>
              <p><span className="font-medium text-gray-900">Zone:</span> {selectedZoneName}</p>
              <p><span className="font-medium text-gray-900">City:</span> {selectedCityName}</p>
              <p><span className="font-medium text-gray-900">Radius:</span> {Number(form.service_radius_km || 0).toFixed(1)} km</p>
              <p>
                <span className="font-medium text-gray-900">Live Status:</span>{' '}
                <span className={form.is_online ? 'text-emerald-600' : 'text-gray-600'}>
                  {form.is_online ? 'Online' : 'Offline'}
                </span>
              </p>
              <p>
                <span className="font-medium text-gray-900">Account:</span>{' '}
                {form.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Admin Notes</h2>
            <p className="text-sm text-gray-500 mt-2">
              Zone is used for filtering and city is used for actual serviceability matching.
              Manual online or offline changes here apply immediately to vendor availability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfilePage;
