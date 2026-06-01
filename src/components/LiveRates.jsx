import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const LiveRates = () => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRates = async () => {
    try {
      const res = await axios.get('/rates/today/comparison');
      setRates(res.data);
      setError(false);
    } catch (err) {
      console.error('Failed to fetch rates', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="bg-gray-100 dark:bg-gray-800 p-2 text-center text-sm rounded-lg mb-4">Loading rates...</div>;
  if (error) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-6 overflow-x-auto">
      <div className="flex flex-nowrap gap-6 justify-around min-w-max">
        {Object.entries(rates).map(([category, data]) => {
          const change = data.change;
          const isPositive = change > 0;
          const isNegative = change < 0;
          const changeColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
          const bgColor = isPositive ? 'bg-green-50 dark:bg-green-900/30' : isNegative ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-700';
          
          return (
            <div key={category} className={`flex flex-col items-center px-4 py-2 rounded-lg ${bgColor} min-w-[100px]`}>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{category}</span>
              <span className="text-xl font-bold dark:text-white">
                ₹{data.today ? data.today.toLocaleString() : '—'}
              </span>
              {data.change !== null && (
                <div className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
                  {isPositive && <FiTrendingUp size={14} />}
                  {isNegative && <FiTrendingDown size={14} />}
                  <span>{isPositive ? '+' : ''}{Math.abs(change).toFixed(2)}</span>
                  {data.percentage && (
                    <span className="text-xs opacity-75">
                      ({isPositive ? '+' : ''}{data.percentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center text-xs text-gray-400 mt-2">Rates per 10 grams • Auto‑refresh every minute</div>
    </div>
  );
};

export default LiveRates;