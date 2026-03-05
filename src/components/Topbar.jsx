import { useRef, useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const Topbar = ({ onMenuClick, showMenuButton = false }) => {
  const {
    searchQuery,
    setSearchQuery,
    profileDropdownOpen,
    setProfileDropdownOpen,
  } = useApp();

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setProfileDropdownOpen]);

  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-6 relative z-20">
      
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button onClick={onMenuClick}>
            <Menu size={22} />
          </button>
        )}

        {/* ✅ Search Input */}
        <input
          type="text"
          placeholder="Search Orders, Customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded-lg px-4 py-2 w-40 md:w-64 focus:outline-none focus:ring-2 focus:ring-[#9BCBBF]"
        />
      </div>

      <div className="flex items-center gap-6 relative">

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setNotificationOpen(!notificationOpen)}>
            <Bell size={20} />
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50 p-4">
              <p className="text-sm text-gray-600">
                No new notifications
              </p>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-10 h-10 bg-[#9BCBBF] text-white rounded-full flex items-center justify-center"
          >
            AK
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  navigate("/settings");
                  setProfileDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                My Account
              </button>

              <button
                onClick={() => {
                  alert("Signed Out Successfully");
                  navigate("/");
                  setProfileDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Topbar;