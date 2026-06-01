import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useRates } from "../contexts/RateContext";
import {
  FiHome, FiPackage, FiUsers, FiFileText, FiBarChart2, FiBox,
  FiLogOut, FiSun, FiMoon, FiSettings
} from "react-icons/fi";

const Sidebar = () => {
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
  }

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 border-b border-gray-700">
        <img src="/logo.png" alt="Ambika Jewellers" className="h-8 w-8 object-contain" />
        <span className="text-xl font-bold">Ambika Jewellers</span>
      </div>

      {/* User info */}
      <div className="p-4 text-sm text-gray-400 border-b border-gray-700">
        Logged in as <span className="text-white font-semibold">{user.name}</span><br />
        Role: <span className="capitalize">{user.role}</span>
      </div>

      {/* Navigation – scrollable if needed */}
      <nav className="flex-1 overflow-y-auto mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition ${
              isActive(item.path) ? "bg-gray-800 text-white border-l-4 border-blue-500" : ""
            }`}
          >
            <item.icon className="mr-3" size={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom fixed section – no gaps */}
      <div className="border-t border-gray-700 mt-auto">
        {user?.role === "admin" && (
          <button
            onClick={openModal}
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition w-full text-left"
          >
            <FiSettings className="mr-3" size={20} />
            Set Today's Rates
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition w-full text-left"
        >
          {darkMode ? <FiSun className="mr-3" size={20} /> : <FiMoon className="mr-3" size={20} />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center px-6 py-4 text-gray-300 hover:bg-gray-800 hover:text-white transition w-full text-left"
        >
          <FiLogOut className="mr-3" size={20} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;