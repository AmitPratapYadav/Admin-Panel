import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import CatalogTabs from '../components/CatalogTabs';
import CategoriesTable from '../components/CategoriesTable';
import {
  extractApiError,
  fetchAdminCategories,
  fetchAdminCategoriesTree,
  toggleAdminCategoryStatus,
} from '../services/catalog';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const CategoriesPage = () => {
  const { admin } = useAdminAuth();
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    live: 0,
    archived: 0,
    main_categories: 0,
    subcategories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [parentId, setParentId] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('products');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, type, parentId, rowsPerPage]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadCategoryTree = async () => {
      try {
        const data = await fetchAdminCategoriesTree();
        setCategoryTree(data?.categories || []);
      } catch (err) {
        console.error('Failed to load category tree', err);
      }
    };

    loadCategoryTree();
  }, [canView]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await fetchAdminCategories({
        page: currentPage,
        perPage: rowsPerPage,
        search,
        status,
        type,
        parentId,
      });

      setCategories(data?.data || []);
      setSummary(data?.summary || {
        total: 0,
        live: 0,
        archived: 0,
        main_categories: 0,
        subcategories: 0,
      });
      setTotalItems(data?.total || 0);
      setTotalPages(data?.last_page || 1);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load categories.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadCategories();
    } else {
      setLoading(false);
    }
  }, [canView, currentPage, rowsPerPage, search, status, type, parentId]);

  const summaryCards = useMemo(
    () => [
      { label: 'Total Categories', value: summary.total, accent: 'text-slate-900' },
      { label: 'Main Categories', value: summary.main_categories, accent: 'text-blue-600' },
      { label: 'Subcategories', value: summary.subcategories, accent: 'text-violet-600' },
      { label: 'Archived', value: summary.archived, accent: 'text-gray-600' },
    ],
    [summary]
  );

  const handleToggleStatus = async (category) => {
    try {
      setActionLoadingId(category.id);
      await toggleAdminCategoryStatus(category.id, !category.is_active);
      await loadCategories();
    } catch (err) {
      alert(extractApiError(err, 'Unable to update category status.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!canView) {
    return <PermissionNotice message="Your account does not have product access." />;
  }

  if (loading) {
    return (
      <div>
        <CatalogTabs />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Management</h1>
        <div className="bg-white rounded-xl border p-6">Loading categories...</div>
      </div>
    );
  }

  return (
    <div>
      <CatalogTabs />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 text-sm">
            Create main categories, subcategories, and reusable variant templates.
          </p>
        </div>

        <Link
          to="/products/categories/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9BCBBF] text-white transition-all duration-200 hover:opacity-90"
        >
          <Plus size={16} />
          Add Category
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-2 ${card.accent}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search category by name, slug..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
            />
          </div>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (e.target.value === 'main') {
                setParentId('root');
              } else if (e.target.value === 'sub' && parentId === 'root') {
                setParentId('');
              }
            }}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
          >
            <option value="all">All Types</option>
            <option value="main">Main Categories</option>
            <option value="sub">Subcategories</option>
          </select>

          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
          >
            <option value="">All Parents</option>
            <option value="root">Only Main Categories</option>
            {categoryTree.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
          >
            <option value="all">All Statuses</option>
            <option value="live">Live</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatus('all');
              setType('all');
              setParentId('');
            }}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-6">
          {error}
        </div>
      ) : null}

      <div className="hidden md:block">
        <CategoriesTable
          categories={categories}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          totalItems={totalItems}
          actionLoadingId={actionLoadingId}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <div className="md:hidden space-y-4">
        {categories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            No categories found.
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shrink-0">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.level === 'subcategory' ? 'Subcategory' : 'Main Category'}</p>
                  <p className="text-xs text-gray-500 mt-2">{category.parent_name || 'No parent category'}</p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {category.is_active ? 'Live' : 'Archived'}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link
                  to={`/products/categories/${category.id}`}
                  className="flex-1 text-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  View
                </Link>

                <button
                  onClick={() => handleToggleStatus(category)}
                  disabled={actionLoadingId === category.id}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white ${
                    category.is_active ? 'bg-slate-700' : 'bg-[#9BCBBF]'
                  } disabled:opacity-60`}
                >
                  {actionLoadingId === category.id
                    ? 'Saving...'
                    : category.is_active
                    ? 'Archive'
                    : 'Make Live'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
