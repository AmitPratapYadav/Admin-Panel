import api from './api';

export const extractApiError = (error, fallbackMessage) => {
  const responseData = error?.response?.data;
  const validationErrors = responseData?.errors;

  if (validationErrors && typeof validationErrors === 'object') {
    const firstError = Object.values(validationErrors)[0];

    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0];
    }
  }

  return responseData?.message || fallbackMessage;
};

export const fetchAdminVendors = async ({
  page = 1,
  perPage = 10,
  search = '',
  zoneId = '',
  onlineStatus = 'all',
} = {}) => {
  const params = {
    page,
    per_page: perPage,
  };

  if (search) {
    params.search = search;
  }

  if (zoneId) {
    params.zone_id = zoneId;
  }

  if (onlineStatus && onlineStatus !== 'all') {
    params.online_status = onlineStatus;
  }

  const response = await api.get('/admin/vendors', { params });
  return response.data;
};

export const fetchAdminVendor = async (vendorId) => {
  const response = await api.get(`/admin/vendors/${vendorId}`);
  return response.data;
};

export const createAdminVendor = async (payload) => {
  const response = await api.post('/admin/vendors', payload);
  return response.data;
};

export const updateAdminVendor = async (vendorId, payload) => {
  const response = await api.put(`/admin/vendors/${vendorId}`, payload);
  return response.data;
};

export const toggleAdminVendorOnline = async (vendorId, isOnline) => {
  const response = await api.post(`/admin/vendors/${vendorId}/toggle-online`, {
    is_online: isOnline,
  });

  return response.data;
};

export const fetchZones = async () => {
  const response = await api.get('/geo/zones');
  return response.data;
};

export const fetchCities = async (zoneId = '') => {
  const response = await api.get('/geo/cities', {
    params: zoneId ? { zone_id: zoneId } : {},
  });

  return response.data;
};
