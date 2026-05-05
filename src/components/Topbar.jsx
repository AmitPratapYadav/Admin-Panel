import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { extractApiError, searchAdminGlobal } from "../services/admin";

const Topbar = ({ onMenuClick, showMenuButton = false }) => {
  const {
    profileDropdownOpen,
    setProfileDropdownOpen,
  } = useApp();
  const { admin, logout } = useAdminAuth();

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] = useState(false);
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
