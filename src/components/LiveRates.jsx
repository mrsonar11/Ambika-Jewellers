import { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosConfig';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const LiveRates = () => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  const fetchRates = async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    try {
      const res = await axios.get('/rates/today/comparison');
      if (isMounted.current) {
        setRates(res.data);
        setError(false);
      }
    } catch (err) {
      console.error('Failed to fetch rates', err);
      if (isMounted.current) setError(true);
    } finally {
      if (isMounted.current) setLoading(false);
      fetchInProgress.current = false;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchRates();

    const handleRatesUpdate = () => {
      fetchRates();
    };
    window.addEventListener('rates-updated', handleRatesUpdate);

    return () => {
      isMounted.current = false;
      window.removeEventListener('rates-updated', handleRatesUpdate);
    };
  }, []); // ✅ runs once

  if (loading) return <div className="text-center text-sm py-1">Loading rates...</div>;
  if (error) return null;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-1 px-4 text-xs">
      <div className="flex flex-wrap justify-start gap-4 overflow-x-auto">
        {Object.entries(rates).map(([category, data]) => {
          const change = data.change;
          const isPositive = change > 0;
          const isNegative = change < 0;
          const changeColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
          const bgColor = isPositive ? 'bg-green-50 dark:bg-green-900/20' : isNegative ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700';
          return (
            <div key={category} className={`flex items-center gap-2 px-3 py-1 rounded-full ${bgColor}`}>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{category}</span>
              <span className="font-mono font-bold dark:text-white">₹{data.today ? data.today.toLocaleString() : '—'}</span>
              {data.change !== null && (
                <div className={`flex items-center gap-1 text-xs ${changeColor}`}>
                  {isPositive && <FiTrendingUp size={12} />}
                  {isNegative && <FiTrendingDown size={12} />}
                  <span>{isPositive ? '+' : ''}{Math.abs(change).toFixed(0)}</span>
                  <span className="text-[10px] opacity-70">({isPositive ? '+' : ''}{data.percentage?.toFixed(1)}%)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center text-[10px] text-gray-400 mt-0.5">Rates per 10 grams</div>
    </div>
  );
};

export default LiveRates;