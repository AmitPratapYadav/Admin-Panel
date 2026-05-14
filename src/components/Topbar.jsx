import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { extractApiError, fetchAdminNotifications, markAdminNotificationRead, searchAdminGlobal } from "../services/admin";

const Topbar = ({ onMenuClick, showMenuButton = false }) => {
  const {
    profileDropdownOpen,
    setProfileDropdownOpen,
  } = useApp();
  const { admin, logout } = useAdminAuth();

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const initials = useMemo(() => {
    const source = admin?.name || "Admin";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "AD";
  }, [admin?.name]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
        setSearchError("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setProfileDropdownOpen]);

  useEffect(() => {
    const trimmed = searchValue.trim();

    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");
        const data = await searchAdminGlobal(trimmed);
        setSearchResults(data?.results || []);
      } catch (error) {
        setSearchError(extractApiError(error, "Search failed."));
      } finally {
        setSearchLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        setNotificationLoading(true);
        const data = await fetchAdminNotifications();
        if (!mounted) return;
        setNotifications(data?.notifications || []);
        setNotificationUnreadCount(data?.unread_count || 0);
      } catch {
        if (!mounted) return;
        setNotifications([]);
        setNotificationUnreadCount(0);
      } finally {
        if (mounted) {
          setNotificationLoading(false);
        }
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markAdminNotificationRead(notification.id);
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, is_read: true } : item
        )));
        setNotificationUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {
      // ignore read failures during navigation
    }

    setNotificationOpen(false);
    if (notification.path) {
      navigate(notification.path);
    }
  };

  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-6 relative z-20">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button onClick={onMenuClick}>
            <Menu size={22} />
          </button>
        )}

        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 w-52 md:w-80 focus-within:ring-2 focus-within:ring-[#9BCBBF]">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search Orders, Customers..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {(searchLoading || searchError || searchResults.length > 0) && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              {searchLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
              ) : null}

              {!searchLoading && searchError ? (
                <div className="px-4 py-3 text-sm text-red-500">{searchError}</div>
              ) : null}

              {!searchLoading && !searchError && searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No matching records found.</div>
              ) : null}

              {!searchLoading && !searchError && searchResults.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        navigate(result.path);
                        setSearchResults([]);
                        setSearchValue("");
                      }}
                      className="w-full border-b border-gray-100 last:border-b-0 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{result.title}</p>
                          <p className="text-xs text-gray-500">{result.subtitle}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600">
                          {result.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 relative">
        <div
          ref={notificationRef}
          className="relative"
          onMouseEnter={() => setNotificationOpen(true)}
          onMouseLeave={() => setNotificationOpen(false)}
        >
          <button onClick={() => setNotificationOpen(!notificationOpen)} className="relative">
            <Bell size={20} className={notificationUnreadCount > 0 ? "text-red-500 animate-pulse" : ""} />
            {notificationUnreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            ) : null}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">{notificationUnreadCount} unread</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notificationLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Loading notifications...</div>
                ) : null}
                {!notificationLoading && notifications.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500">No new notifications.</div>
                ) : null}
                {!notificationLoading && notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 ${
                      notification.is_read ? "bg-white" : "bg-red-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{notification.message || "Open to view details."}</p>
                        <p className="mt-2 text-[11px] text-gray-400">
                          {notification.created_at ? new Date(notification.created_at).toLocaleString() : ""}
                        </p>
                      </div>
                      {!notification.is_read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-10 h-10 overflow-hidden bg-[#9BCBBF] text-white rounded-full flex items-center justify-center"
          >
            {admin?.avatar_url ? (
              <img src={admin.avatar_url} alt={admin.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{initials}</span>
            )}
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{admin?.name || "Admin"}</p>
                <p className="text-xs text-gray-500">{admin?.role_label || "Admin"}</p>
              </div>

              <button
                onClick={() => {
                  navigate("/settings");
                  setProfileDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
              >
                My Account
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-500"
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
