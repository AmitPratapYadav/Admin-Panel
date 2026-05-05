import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import CatalogTabs from '../components/CatalogTabs';
import ImageListEditor from '../components/ImageListEditor';
import OptionGroupsEditor from '../components/OptionGroupsEditor';
import {
  createAdminProduct,
  extractApiError,
  fetchAdminCategoriesTree,
  fetchAdminProduct,
  fetchCategoryTemplateOptions,
  toggleAdminProductStatus,
  updateAdminProduct,
  uploadAdminImage,
} from '../services/catalog';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const initialForm = {
  category_id: '',
  subcategory_id: '',
  name: '',
  slug: '',
  short_description: '',
  description: '',
  base_price: 0,
  requires_design_upload: false,
  is_featured: false,
  is_trending: false,
  is_active: true,
  sort_order: 0,
  images: [],
  option_groups: [],
  quantity_prices: [
    {
      quantity: 100,
      price: 0,
      compare_price: '',
      is_active: true,
    },
  ],
};

const ProductEditorPage = () => {
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
  const [templateLoading, setTemplateLoading] = useState(false);
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

        const data = await fetchAdminProduct(id);
        const product = data?.product;

        if (!product) {
          throw new Error('Product not found.');
        }

        setForm({
          category_id: product.category_id || '',
          subcategory_id: product.subcategory_id || '',
          name: product.name || '',
          slug: product.slug || '',
          short_description: product.short_description || '',
          description: product.description || '',
          base_price: product.base_price || 0,
          requires_design_upload: !!product.requires_design_upload,
          is_featured: !!product.is_featured,
          is_trending: !!product.is_trending,
          is_active: !!product.is_active,
          sort_order: product.sort_order || 0,
          images: product.images || [],
          option_groups: product.option_groups || [],
          quantity_prices: product.quantity_prices?.length
            ? product.quantity_prices.map((price) => ({
                quantity: price.quantity,
                price: price.price,
                compare_price: price.compare_price ?? '',
                is_active: price.is_active,
              }))
            : initialForm.quantity_prices,
        });
      } catch (err) {
        setError(extractApiError(err, 'Failed to load product.'));
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [canView, id, isCreate]);

  const selectedCategory = useMemo(
    () => categoryTree.find((category) => Number(category.id) === Number(form.category_id)),
    [categoryTree, form.category_id]
  );

  const selectedSubcategory = useMemo(
    () => selectedCategory?.children?.find((child) => Number(child.id) === Number(form.subcategory_id)),
    [selectedCategory, form.subcategory_id]
  );

  const defaultOptionExtra = useMemo(() => {
    return form.option_groups.reduce((total, group) => {
      const defaultValue = (group.values || []).find((value) => value.is_default);
      return total + Number(defaultValue?.price_modifier || 0);
    }, 0);
  }, [form.option_groups]);

  const startingPrice = useMemo(() => {
    const activePrices = form.quantity_prices
      .filter((price) => price.is_active)
      .map((price) => Number(price.price || 0))
      .filter((price) => !Number.isNaN(price));

    return activePrices.length ? Math.min(...activePrices) : Number(form.base_price || 0);
  }, [form.quantity_prices, form.base_price]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateQuantityPrice = (index, field, value) => {
    updateField(
      'quantity_prices',
      form.quantity_prices.map((price, currentIndex) =>
        currentIndex === index
          ? {
              ...price,
              [field]: value,
            }
          : price
      )
    );
  };

  const addQuantityPrice = () => {
    updateField('quantity_prices', [
      ...form.quantity_prices,
      {
        quantity: '',
        price: '',
        compare_price: '',
        is_active: true,
      },
    ]);
  };

  const removeQuantityPrice = (index) => {
    updateField(
      'quantity_prices',
      form.quantity_prices.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const handleLoadTemplate = async () => {
    const templateCategoryId = form.subcategory_id || form.category_id;

    if (!templateCategoryId) {
      setError('Select a category or subcategory first.');
      return;
    }

    try {
      setTemplateLoading(true);
      setError('');

      const data = await fetchCategoryTemplateOptions(templateCategoryId);
      updateField('option_groups', data?.template_option_groups || []);
      setSuccess('Category template loaded into the product options.');
    } catch (err) {
      setError(extractApiError(err, 'Unable to load category template.'));
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleUploadImage = async (file) => {
    try {
      setUploadLoading(true);
      setError('');

      const data = await uploadAdminImage(file, 'products');
      updateField('images', [
        ...form.images,
        {
          image_url: data?.image?.url || '',
          cloudinary_public_id: data?.image?.public_id || '',
          alt_text: file.name,
          is_primary: form.images.length === 0,
          sort_order: form.images.length,
        },
      ]);
    } catch (err) {
      setError(extractApiError(err, 'Unable to upload product image.'));
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
        category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        name: form.name,
        slug: form.slug || null,
        short_description: form.short_description || null,
        description: form.description || null,
        base_price: Number(form.base_price || 0),
        requires_design_upload: !!form.requires_design_upload,
        is_featured: !!form.is_featured,
        is_trending: !!form.is_trending,
        is_active: !!form.is_active,
        sort_order: Number(form.sort_order || 0),
        images: form.images.map((image, index) => ({
          image_url: image.image_url,
          cloudinary_public_id: image.cloudinary_public_id || null,
          alt_text: image.alt_text || null,
          is_primary: !!image.is_primary,
          sort_order: Number(image.sort_order ?? index),
        })),
        option_groups: form.option_groups.map((group, groupIndex) => ({
          name: group.name,
          code: group.code || null,
          display_type: group.display_type,
          is_required: !!group.is_required,
          sort_order: Number(group.sort_order ?? groupIndex),
          values: (group.values || []).map((value, valueIndex) => ({
            label: value.label,
            value: value.value || null,
            price_modifier: Number(value.price_modifier || 0),
            is_default: !!value.is_default,
            is_active: value.is_active ?? true,
            sort_order: Number(value.sort_order ?? valueIndex),
          })),
        })),
        quantity_prices: form.quantity_prices.map((price) => ({
          quantity: Number(price.quantity),
          price: Number(price.price),
          compare_price: price.compare_price === '' ? null : Number(price.compare_price),
          is_active: price.is_active ?? true,
        })),
      };

      if (isCreate) {
        const data = await createAdminProduct(payload);
        setSuccess(data?.message || 'Product created successfully.');
        navigate(`/products/${data?.product?.id}`);
        return;
      }

      const data = await updateAdminProduct(id, payload);
      setSuccess(data?.message || 'Product updated successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Unable to save product.'));
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

      const data = await toggleAdminProductStatus(id, !form.is_active);
      updateField('is_active', !!data?.product?.is_active);
      setSuccess(data?.message || 'Product status updated successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Unable to update product status.'));
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
          {isCreate ? 'Create Product' : 'Product Details'}
        </h1>
        <div className="bg-white rounded-xl border p-6">Loading product...</div>
      </div>
    );
  }

  return (
    <div>
      <CatalogTabs />

      <div className="mb-4">
        <Link to="/products" className="text-sm font-medium text-[#9BCBBF] hover:underline">
          Back to Products
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isCreate ? 'Create Product' : 'Product Details'}
          </h1>
          <p className="text-gray-600 text-sm">
            Configure sellable pricing, imagery, quantity brackets, and final option modifiers.
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
              ? 'Archive Product'
              : 'Make Product Live'}
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
            <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Products stay as the final pricing layer. Category templates only preload variant groups.
            </p>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <h3 className="text-sm font-semibold text-sky-900">How Pricing Works</h3>
            <p className="mt-2 text-sm text-sky-800">
              Quantity brackets are total base selling prices for that run size, such as 100 cards or 500 cards.
            </p>
            <p className="mt-2 text-sm text-sky-800">
              Variant option prices are extra charges added on top of the selected quantity bracket. The system does not multiply option values by quantity.
            </p>
            <p className="mt-2 text-sm font-medium text-sky-900">
              Final price = selected quantity bracket base price + selected option extra charges
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Main Category</label>
              <select
                value={form.category_id}
                onChange={(e) => {
                  updateField('category_id', e.target.value);
                  updateField('subcategory_id', '');
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                required
              >
                <option value="">Select Category</option>
                {categoryTree.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                value={form.subcategory_id}
                onChange={(e) => updateField('subcategory_id', e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                disabled={!selectedCategory}
              >
                <option value="">No subcategory</option>
                {(selectedCategory?.children || []).map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
              <input
                type="text"
                value={form.short_description}
                onChange={(e) => updateField('short_description', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
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
              rows={5}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
            />
          </div>

          <ImageListEditor
            images={form.images}
            onChange={(images) => updateField('images', images)}
            onUpload={handleUploadImage}
            uploadLoading={uploadLoading}
          />

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quantity Brackets</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add one bracket per quantity like 100, 250, 500, 1000. Each price here is the full base price for that quantity bracket.
                </p>
              </div>

              <button
                type="button"
                onClick={addQuantityPrice}
                className="inline-flex items-center gap-2 rounded-xl bg-[#9BCBBF] px-4 py-2 text-sm font-medium text-white"
              >
                <Plus size={16} />
                Add Quantity
              </button>
            </div>

            <div className="space-y-3">
              {form.quantity_prices.map((price, index) => (
                <div key={`quantity-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={price.quantity}
                        onChange={(e) => updateQuantityPrice(index, 'quantity', e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Base Price For This Quantity</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price.price}
                        onChange={(e) => updateQuantityPrice(index, 'price', e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Example: if 250 units sell for Rs. 450 before any option add-ons, enter 450 here.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Compare Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price.compare_price}
                        onChange={(e) => updateQuantityPrice(index, 'compare_price', e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                      />
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={price.is_active ?? true}
                          onChange={(e) => updateQuantityPrice(index, 'is_active', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        Active
                      </label>

                      <button
                        type="button"
                        onClick={() => removeQuantityPrice(index)}
                        className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <OptionGroupsEditor
            title="Product Variant Options"
            description="These values are extra charges added on top of the selected quantity bracket and then stored in cart and order snapshots."
            priceLabel="Extra Charge"
            priceHelpText="Enter only the extra amount to add on top of the selected quantity bracket."
            groups={form.option_groups}
            onChange={(groups) => updateField('option_groups', groups)}
            onLoadTemplate={handleLoadTemplate}
            loadingTemplate={templateLoading}
          />

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                checked={!!form.requires_design_upload}
                onChange={(e) => updateField('requires_design_upload', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Requires design upload</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                checked={!!form.is_featured}
                onChange={(e) => updateField('is_featured', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Featured product</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                checked={!!form.is_trending}
                onChange={(e) => updateField('is_trending', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Trending product</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Product is live</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#9BCBBF] text-white px-5 py-3 font-medium disabled:opacity-60"
            >
              {saving ? 'Saving...' : isCreate ? 'Create Product' : 'Save Changes'}
            </button>

            <Link
              to="/products"
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Product Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Category:</span> {selectedCategory?.name || '-'}</p>
              <p><span className="font-medium text-gray-900">Subcategory:</span> {selectedSubcategory?.name || 'None'}</p>
              <p><span className="font-medium text-gray-900">Lowest Base Quantity Price:</span> Rs. {Number(startingPrice || 0).toFixed(2)}</p>
              <p><span className="font-medium text-gray-900">Default Option Extra:</span> Rs. {Number(defaultOptionExtra || 0).toFixed(2)}</p>
              <p><span className="font-medium text-gray-900">Example Starting Total:</span> Rs. {Number((startingPrice || 0) + (defaultOptionExtra || 0)).toFixed(2)}</p>
              <p><span className="font-medium text-gray-900">Images:</span> {form.images.length}</p>
              <p><span className="font-medium text-gray-900">Variant Groups:</span> {form.option_groups.length}</p>
              <p><span className="font-medium text-gray-900">Quantity Brackets:</span> {form.quantity_prices.length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Pricing Notes</h2>
            <p className="text-sm text-gray-500 mt-2">
              The lowest active quantity bracket price becomes the storefront starting price. Option values are not separate quantity prices. They are extra charges added on top of the chosen bracket and then preserved in order snapshots.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEditorPage;
