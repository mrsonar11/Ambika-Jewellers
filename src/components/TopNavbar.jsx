import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRates } from "../contexts/RateContext";
import {
  FiHome, FiPackage, FiUsers, FiFileText, FiBarChart2, FiBox,
  FiLogOut, FiSun, FiMoon, FiSettings, FiBriefcase
} from "react-icons/fi";

const TopNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { openModal } = useRates();

  if (!user) return null;

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: FiHome },
    { path: "/products", label: "Products", icon: FiPackage },
    { path: "/customers", label: "Customers", icon: FiUsers },
    { path: "/billing", label: "Billing", icon: FiFileText },
    { path: "/invoices", label: "Invoices", icon: FiFileText },
    { path: "/reports", label: "Reports", icon: FiBarChart2 },
    { path: "/inventory", label: "Inventory", icon: FiBox },
  ];

  if (user?.role === "admin") {
    menuItems.push({ path: "/users", label: "Users", icon: FiUsers });
    menuItems.push({ path: "/mortgage", label: "Mortgage", icon: FiBriefcase });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="px-4 flex items-center justify-between h-12 min-h-[48px]">
        {/* Left side - empty spacer */}
        <div className="flex items-center gap-2 flex-shrink-0">
        <img src="/logo.png" alt="Ambika Jewellers" className="h-20 w-28 -ml-4 mb-7" />
        <span className="font-bold text-gray-1000 dark:text-yellow-300 text-lg hidden sm:inline">Ambika <br/> Jewellers</span>
        </div>

        {/* Navigation links - horizontal scroll on overflow, no wrap */}
        <div className="flex-1 flex justify-center overflow-x-auto">
          <div className="flex items-center gap-1 whitespace-nowrap">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-2 py-1 rounded-md text-sm font-medium transition ${
                  isActive(item.path)
                    ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="mr-1" size={16} />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right side: user info, rate button, theme toggle, logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden md:block text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold">{user.name}</span>
            <br/>
            <span className="mx-1">•</span>
            <span className="capitalize">{user.role}</span>
          </div>

          {user?.role === "admin" && (
            <button
              onClick={openModal}
              className="p-1 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Set Today's Rates"
            >
              <FiSettings size={16} />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-1 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;