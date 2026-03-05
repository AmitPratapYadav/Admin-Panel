import { createContext, useContext, useState } from 'react';
import { orders as initialOrders } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

  return (
    <AppContext.Provider value={{
  orders,
  filteredOrders,
  paginatedOrders,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  showFilterDropdown,
  setShowFilterDropdown,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  sidebarOpen,
  setSidebarOpen,
  profileDropdownOpen,
  setProfileDropdownOpen
}}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
