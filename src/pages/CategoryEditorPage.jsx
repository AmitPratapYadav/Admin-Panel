import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CatalogTabs from '../components/CatalogTabs';
import OptionGroupsEditor from '../components/OptionGroupsEditor';
import {
  createAdminCategory,
  extractApiError,
  fetchAdminCategoriesTree,
  fetchAdminCategory,
  toggleAdminCategoryStatus,
  updateAdminCategory,
  uploadAdminImage,
} from '../services/catalog';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const initialForm = {
  parent_id: '',
  name: '',
  slug: '',
  description: '',
  image: '',
  sort_order: 0,
  is_active: true,
  template_option_groups: [],
};

const CategoryEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const isCreate = !id;

  const [form, setForm] = useState(initialForm);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('products');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      try {
        setLoading(true);
        setError('');

        const treeData = await fetchAdminCategoriesTree();
        setCategoryTree(treeData?.categories || []);

        if (isCreate) {
          setForm(initialForm);
          return;
        }

        const data = await fetchAdminCategory(id);
        const category = data?.category;

        if (!category) {
          throw new Error('Category not found.');
        }

        setForm({
          parent_id: category.parent_id || '',
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          image: category.image || '',
          sort_order: category.sort_order || 0,
          is_active: !!category.is_active,
          template_option_groups: category.template_option_groups || [],
        });
      } catch (err) {
        setError(extractApiError(err, 'Failed to load category.'));
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [canView, id, isCreate]);

  const parentOptions = useMemo(() => {
    return categoryTree.filter((category) => {
      if (!id) return true;
      return Number(category.id) !== Number(id);
    });
  }, [categoryTree, id]);

  const selectedParent = useMemo(
    () => categoryTree.find((category) => Number(category.id) === Number(form.parent_id)),
    [categoryTree, form.parent_id]
  );

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUploadImage = async (file) => {
    try {
      setUploadLoading(true);
      setError('');

      const data = await uploadAdminImage(file, 'categories');
      updateField('image', data?.image?.url || '');
    } catch (err) {
      setError(extractApiError(err, 'Unable to upload category image.'));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        name: form.name,
        slug: form.slug || null,
        description: form.description || null,
        image: form.image || null,
        sort_order: Number(form.sort_order || 0),
        is_active: !!form.is_active,
        template_option_groups: form.template_option_groups,
      };

      if (isCreate) {
        const data = await createAdminCategory(payload);
        setSuccess(data?.message || 'Category created successfully.');
        navigate(`/products/categories/${data?.category?.id}`);
        return;
      }

      const data = await updateAdminCategory(id, payload);
      setSuccess(data?.message || 'Category updated successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Unable to save category.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (isCreate) return;

    try {
      setToggleLoading(true);
      setError('');
      setSuccess('');

      const data = await toggleAdminCategoryStatus(id, !form.is_active);
      updateField('is_active', !!data?.category?.is_active);
      setSuccess(data?.message || 'Category status updated successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Unable to update category status.'));
    } finally {
      setToggleLoading(false);
    }
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have product access." />;
  }

  if (loading) {
    return (
      <div>
        <CatalogTabs />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isCreate ? 'Create Category' : 'Category Details'}
        </h1>
        <div className="bg-white rounded-xl border p-6">Loading category...</div>
      </div>
    );
  }

  return (
    <div>
      <CatalogTabs />

      <div className="mb-4">
        <Link to="/products/categories" className="text-sm font-medium text-[#9BCBBF] hover:underline">
          Back to Categories
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isCreate ? 'Create Category' : 'Category Details'}
          </h1>
          <p className="text-gray-600 text-sm">
            {isCreate
              ? 'Create a main category or subcategory and define its variant template.'
              : 'Update category structure, imagery, and reusable template options.'}
          </p>
        </div>

        {!isCreate ? (
          <button
            onClick={handleToggleStatus}
            disabled={toggleLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              form.is_active ? 'bg-slate-800' : 'bg-[#9BCBBF]'
            } disabled:opacity-60`}
          >
            {toggleLoading
              ? 'Updating...'
              : form.is_active
              ? 'Archive Category'
              : 'Make Category Live'}
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
            <h2 className="text-lg font-semibold text-gray-900">Catalog Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Use a parent category only when you want this record to behave as a subcategory.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                placeholder="Leave blank to auto-generate"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
              <select
                value={form.parent_id}
                onChange={(e) => updateField('parent_id', e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              >
                <option value="">No parent (main category)</option>
                {parentOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => updateField('sort_order', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Category Image</p>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a category card image or paste a direct URL.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {uploadLoading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUploadImage(file);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
              <div className="h-28 w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                {form.image ? (
                  <img src={form.image} alt={form.name || 'Category'} className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => updateField('image', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                />
              </div>
            </div>
          </div>

          <OptionGroupsEditor
            title="Variant Template"
            description={
              form.parent_id
                ? 'This template will preload into products inside this subcategory.'
                : 'Use this template for categories without subcategories, or as a starter template.'
            }
            groups={form.template_option_groups}
            onChange={(groups) => updateField('template_option_groups', groups)}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Category is live</span>
            </label>

            <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600">
              If this category has subcategories, define final variant templates on the subcategory level.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#9BCBBF] text-white px-5 py-3 font-medium disabled:opacity-60"
            >
              {saving ? 'Saving...' : isCreate ? 'Create Category' : 'Save Changes'}
            </button>

            <Link
              to="/products/categories"
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Category Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Level:</span> {form.parent_id ? 'Subcategory' : 'Main Category'}</p>
              <p><span className="font-medium text-gray-900">Parent:</span> {selectedParent?.name || 'None'}</p>
              <p><span className="font-medium text-gray-900">Template Groups:</span> {form.template_option_groups.length}</p>
              <p><span className="font-medium text-gray-900">Status:</span> {form.is_active ? 'Live' : 'Archived'}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Structure Notes</h2>
            <p className="text-sm text-gray-500 mt-2">
              Main categories organize the catalog. Subcategories are used when you want category-specific templates and a cleaner VistaPrint-style hierarchy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditorPage;
