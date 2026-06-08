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
    window.addEventListener('rates-updated', fetchRates);
    return () => window.removeEventListener('rates-updated', fetchRates);
  }, []);

  if (loading) return <div className="text-center text-xs py-0.5 bg-gray-100 dark:bg-gray-800">Loading rates...</div>;
  if (error) return null;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs py-1 px-2">
      <div className="flex flex-wrap justify-center gap-3 overflow-x-auto">
        {Object.entries(rates).map(([category, data]) => {
          const change = data.change;
          const isPositive = change > 0;
          const isNegative = change < 0;
          const changeColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
          return (
            <div key={category} className="inline-flex items-center gap-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{category}</span>
              <span className="font-mono font-bold dark:text-white">₹{data.today ? data.today.toLocaleString() : '—'}</span>
              {data.change !== null && (
                <div className={`flex items-center gap-0.5 ${changeColor}`}>
                  {isPositive && <FiTrendingUp size={10} />}
                  {isNegative && <FiTrendingDown size={10} />}
                  <span className="text-[10px]">{isPositive ? '+' : ''}{Math.abs(change).toFixed(0)}</span>
                  <span className="text-[9px] opacity-70">({isPositive ? '+' : ''}{data.percentage?.toFixed(1)}%)</span>
                </div>
              )}
            </div>
          );
        })}
        <span className="text-[10px] text-gray-400 ml-1">(per 10g)</span>
      </div>
    </div>
  );
};

export default LiveRates;