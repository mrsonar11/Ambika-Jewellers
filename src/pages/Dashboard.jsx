import { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import { useAuth } from "../contexts/AuthContext";
import { useRates } from "../contexts/RateContext";
import { getTodayRates } from "../api/rateApi";
import { FiDollarSign, FiTrendingUp, FiClock, FiUsers, FiPackage } from "react-icons/fi";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const { openModal } = useRates();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    axios.get("/dashboard/stats")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    if (hasChecked) return;      // prevent running more than once
    const checkRates = async () => {
      try {
        const rates = await getTodayRates();
        const categories = ['Gold', 'Silver', 'Diamond', 'Platinum'];
        const missing = categories.some(cat => !rates[cat]?.rate_per_10gm);
        if (missing) {
          openModal();
        }
      } catch (error) {
        console.error("Failed to check rates", error);
        openModal();   // if API fails, open modal anyway
      } finally {
        setHasChecked(true);
      }
    };
    checkRates();
  }, [user, openModal, hasChecked]); // runs only once

  if (!data) return <div className="p-6 dark:bg-gray-900 dark:text-white">Loading dashboard...</div>;

  const isAdmin = user?.role === 'admin';

  const adminCards = [
    { title: "Today's Sales", value: `₹${data.today_sales?.toLocaleString()}`, icon: FiDollarSign, bg: "from-green-400 to-green-600" },
    { title: "Today's Profit", value: `₹${data.today_profit?.toLocaleString()}`, icon: FiTrendingUp, bg: "from-teal-400 to-teal-600" },
    { title: "Today's Pending", value: `₹${data.today_due?.toLocaleString()}`, icon: FiClock, bg: "from-orange-400 to-orange-600" },
    { title: "Monthly Sales", value: `₹${data.monthly_sales?.toLocaleString()}`, icon: FiDollarSign, bg: "from-blue-400 to-blue-600" },
    { title: "Monthly Profit", value: `₹${data.monthly_profit?.toLocaleString()}`, icon: FiTrendingUp, bg: "from-cyan-400 to-cyan-600" },
    { title: "Monthly Pending", value: `₹${data.monthly_due?.toLocaleString()}`, icon: FiClock, bg: "from-orange-500 to-orange-700" },
    { title: "Yearly Sales", value: `₹${data.yearly_sales?.toLocaleString()}`, icon: FiDollarSign, bg: "from-indigo-400 to-indigo-700" },
    { title: "Yearly Profit", value: `₹${data.yearly_profit?.toLocaleString()}`, icon: FiTrendingUp, bg: "from-purple-400 to-purple-700" },
    { title: "Yearly Pending", value: `₹${data.yearly_due?.toLocaleString()}`, icon: FiClock, bg: "from-red-400 to-red-700" },
    { title: "Total Customers", value: data.total_customers, icon: FiUsers, bg: "from-yellow-400 to-yellow-600" },
    { title: "Total Products", value: data.total_products, icon: FiPackage, bg: "from-pink-400 to-pink-600" },
  ];

  const staffCards = [
    { title: "Today's Sales", value: `₹${data.today_sales?.toLocaleString()}`, icon: FiDollarSign, bg: "from-green-400 to-green-600" },
    { title: "Monthly Sales", value: `₹${data.monthly_sales?.toLocaleString()}`, icon: FiDollarSign, bg: "from-blue-400 to-blue-600" },
    { title: "Yearly Sales", value: `₹${data.yearly_sales?.toLocaleString()}`, icon: FiDollarSign, bg: "from-indigo-400 to-indigo-700" },
    { title: "Total Customers", value: data.total_customers, icon: FiUsers, bg: "from-yellow-400 to-yellow-600" },
    { title: "Total Products", value: data.total_products, icon: FiPackage, bg: "from-pink-400 to-pink-600" },
  ];

  const cards = isAdmin ? adminCards : staffCards;

  return (
    <div className="p-2 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
      <div className="flex flex-wrap gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${card.bg} rounded-xl shadow-lg p-2 transition hover:scale-105 duration-200 overflow-hidden flex-1 min-w-[250px] max-w-[350px]`}
            style={{ flex: '1 1 280px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white opacity-90 break-words">{card.title}</p>
                <p className="text-2xl font-bold mt-2 text-white break-words">{card.value}</p>
              </div>
              <div className="p-3 rounded-full bg-white bg-opacity-20 text-white flex-shrink-0 ml-3">
                <card.icon size={28} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;