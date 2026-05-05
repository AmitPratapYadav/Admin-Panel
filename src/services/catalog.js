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

export const fetchAdminCategories = async ({
  page = 1,
  perPage = 10,
  search = '',
  status = 'all',
  type = 'all',
  parentId = '',
} = {}) => {
  const params = {
    page,
    per_page: perPage,
  };

  if (search) params.search = search;
  if (status && status !== 'all') params.status = status;
  if (type && type !== 'all') params.type = type;
  if (parentId !== '') params.parent_id = parentId;

  const response = await api.get('/admin/categories', { params });
  return response.data;
};

export const fetchAdminCategoriesTree = async () => {
  const response = await api.get('/admin/categories/tree');
  return response.data;
};

export const fetchAdminCategory = async (categoryId) => {
  const response = await api.get(`/admin/categories/${categoryId}`);
  return response.data;
};

export const createAdminCategory = async (payload) => {
  const response = await api.post('/admin/categories', payload);
  return response.data;
};

export const updateAdminCategory = async (categoryId, payload) => {
  const response = await api.put(`/admin/categories/${categoryId}`, payload);
  return response.data;
};

export const toggleAdminCategoryStatus = async (categoryId, isActive) => {
  const response = await api.post(`/admin/categories/${categoryId}/toggle-status`, {
    is_active: isActive,
  });

  return response.data;
};

export const fetchAdminProducts = async ({
  page = 1,
  perPage = 10,
  search = '',
  status = 'all',
  categoryId = '',
  subcategoryId = '',
} = {}) => {
  const params = {
    page,
    per_page: perPage,
  };

  if (search) params.search = search;
  if (status && status !== 'all') params.status = status;
  if (categoryId) params.category_id = categoryId;
  if (subcategoryId) params.subcategory_id = subcategoryId;

  const response = await api.get('/admin/products', { params });
  return response.data;
};

export const fetchAdminProduct = async (productId) => {
  const response = await api.get(`/admin/products/${productId}`);
  return response.data;
};

export const createAdminProduct = async (payload) => {
  const response = await api.post('/admin/products', payload);
  return response.data;
};

export const updateAdminProduct = async (productId, payload) => {
  const response = await api.put(`/admin/products/${productId}`, payload);
  return response.data;
};

export const toggleAdminProductStatus = async (productId, isActive) => {
  const response = await api.post(`/admin/products/${productId}/toggle-status`, {
    is_active: isActive,
  });

  return response.data;
};

export const fetchCategoryTemplateOptions = async (categoryId) => {
  const response = await api.get(`/admin/products/category-template/${categoryId}`);
  return response.data;
};

export const uploadAdminImage = async (file, folder = 'products') => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const response = await api.post('/admin/media/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
