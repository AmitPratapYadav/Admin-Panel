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

export const fetchAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const fetchAdminReports = async (params = {}) => {
  const response = await api.get('/admin/reports', { params });
  return response.data;
};

export const searchAdminGlobal = async (query) => {
  const response = await api.get('/admin/search', {
    params: { q: query },
  });
  return response.data;
};

export const fetchAdminCustomers = async ({
  page = 1,
  perPage = 10,
  search = '',
  month = '',
} = {}) => {
  const response = await api.get('/admin/customers', {
    params: {
      page,
      per_page: perPage,
      search: search || undefined,
      month: month || undefined,
    },
  });

  return response.data;
};

export const deleteAdminCustomer = async (customerId) => {
  const response = await api.delete(`/admin/customers/${customerId}`);
  return response.data;
};

export const fetchAdminInquiries = async ({
  page = 1,
  perPage = 10,
  search = '',
  type = '',
  month = '',
} = {}) => {
  const response = await api.get('/admin/inquiries', {
    params: {
      page,
      per_page: perPage,
      search: search || undefined,
      type: type || undefined,
      month: month || undefined,
    },
  });

  return response.data;
};

export const fetchAdminStaff = async ({
  page = 1,
  perPage = 10,
  search = '',
  role = '',
} = {}) => {
  const response = await api.get('/admin/staff', {
    params: {
      page,
      per_page: perPage,
      search: search || undefined,
      role: role || undefined,
    },
  });

  return response.data;
};

export const fetchAdminStaffMember = async (staffId) => {
  const response = await api.get(`/admin/staff/${staffId}`);
  return response.data;
};

export const createAdminStaff = async (payload) => {
  const response = await api.post('/admin/staff', payload);
  return response.data;
};

export const updateAdminStaff = async (staffId, payload) => {
  const response = await api.put(`/admin/staff/${staffId}`, payload);
  return response.data;
};

export const deleteAdminStaff = async (staffId) => {
  const response = await api.delete(`/admin/staff/${staffId}`);
  return response.data;
};

export const updateAdminSettings = async (formData) => {
  const response = await api.post('/admin/settings', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const fetchAdminOrderCreateOptions = async () => {
  const response = await api.get('/admin/orders/create-options');
  return response.data;
};

export const createAdminOrder = async (payload) => {
  const response = await api.post('/admin/orders', payload);
  return response.data;
};

export const fetchAdminOrder = async (orderId) => {
  const response = await api.get(`/admin/orders/${orderId}`);
  return response.data;
};

export const fetchAdminAssignableVendors = async (orderId, search = '') => {
  const response = await api.get(`/admin/orders/${orderId}/assignable-vendors`, {
    params: {
      search: search || undefined,
    },
  });
  return response.data;
};

export const assignAdminOrderVendor = async (orderId, vendorId) => {
  const response = await api.post(`/admin/orders/${orderId}/assign-vendor`, {
    vendor_id: vendorId,
  });
  return response.data;
};
