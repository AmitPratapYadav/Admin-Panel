import { NavLink } from 'react-router-dom';

const tabClassName = ({ isActive }) =>
  `inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-[#9BCBBF] text-white'
      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
  }`;

const CatalogTabs = () => {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <NavLink to="/products" end className={tabClassName}>
        Products
      </NavLink>
      <NavLink to="/products/categories" className={tabClassName}>
        Categories
      </NavLink>
    </div>
  );
};

export default CatalogTabs;
