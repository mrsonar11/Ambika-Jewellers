import { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import { getTodayRates, saveRates } from "../api/rateApi";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { FiDollarSign, FiTrendingUp, FiClock, FiUsers, FiPackage } from "react-icons/fi";
import LiveRates from '../components/LiveRates';
import { useRates } from '../contexts/RateContext';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rates, setRates] = useState({ Gold: '', Silver: '', Diamond: '', Platinum: '' });
  const [savingRates, setSavingRates] = useState(false);
  const { user } = useAuth(); // get current user role
  const { openModal } = useRates();

  // Fetch dashboard stats
  useEffect(() => {
    axios.get("/dashboard/stats")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const checkRates = async () => {
      const res = await getTodayRates();
      const missing = ['Gold', 'Silver', 'Diamond', 'Platinum'].some(cat => !res[cat]?.rate_per_10gm);
      if (missing) openModal();
    };
    checkRates();
  }, []);

  // Check today's rates (only admin should see this modal)
  useEffect(() => {
    if (user?.role !== 'admin') return; // staff doesn't need rate modal
    const fetchRates = async () => {
      try {
        const todayRates = await getTodayRates();
        const categories = ['Gold', 'Silver', 'Diamond', 'Platinum'];
        const missing = categories.some(cat => !todayRates[cat]);
        if (missing) {
          const existing = {};
          categories.forEach(cat => {
            existing[cat] = todayRates[cat]?.rate_per_10gm || '';
          });
          setRates(existing);
          setShowRateModal(true);
        }
      } catch (error) {
        console.error('Failed to fetch rates', error);
        setShowRateModal(true);
      }
    };
    fetchRates();
  }, [user]);

  if (!data) return <div className="p-6 dark:bg-gray-900 dark:text-white">Loading dashboard...</div>;

  // Define card visibility based on role
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

  const handleRateChange = (category, value) => {
    setRates(prev => ({ ...prev, [category]: value }));
  };

  const handleSaveRates = async () => {
    setSavingRates(true);
    const ratesArray = Object.entries(rates).map(([category, rate_per_10gm]) => ({
      category,
      rate_per_10gm: parseFloat(rate_per_10gm) || 0
    }));
    try {
      await saveRates(ratesArray);
      toast.success("Today's rates saved");
      setShowRateModal(false);
    } catch (error) {
      toast.error('Failed to save rates');
    } finally {
      setSavingRates(false);
    }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
        <LiveRates />
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${card.bg} rounded-xl shadow-lg p-5 transform transition hover:scale-105 duration-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white opacity-90">{card.title}</p>
                <p className="text-2xl font-bold mt-2 text-white">{card.value}</p>
              </div>
              <div className="p-3 rounded-full bg-white bg-opacity-20 text-white">
                <card.icon size={28} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Modal – only shown for admin */}
      {isAdmin && showRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Enter Today's Rates (per 10 grams)</h2>
            <div className="space-y-4">
              {['Gold', 'Silver', 'Diamond', 'Platinum'].map(cat => (
                <div key={cat}>
                  <label className="block text-sm font-medium dark:text-gray-300">{cat}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates[cat]}
                    onChange={e => handleRateChange(cat, e.target.value)}
                    placeholder="Rate per 10gm"
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveRates}
              disabled={savingRates}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {savingRates ? 'Saving...' : 'Save Rates'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;