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

    const handleRatesUpdate = () => fetchRates();
    window.addEventListener('rates-updated', handleRatesUpdate);

    return () => {
      isMounted.current = false;
      window.removeEventListener('rates-updated', handleRatesUpdate);
    };
  }, []);

  if (loading) return <div className="text-center text-xs py-1 bg-gray-100 dark:bg-gray-800">Loading rates...</div>;
  if (error) return null;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-1 px-2  overflow-x-auto">
      <div className="flex justify-center items-center gap-4 whitespace-nowrap">
        <span className="text-gray-500 dark:text-gray-400 font-size:12px">Rates per 10g:</span>
        {Object.entries(rates).map(([category, data]) => {
          const change = data.change;
          const isPositive = change > 0;
          const isNegative = change < 0;
          const changeColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
          return (
            <div key={category} className="inline-flex items-center gap-1">
              <span className="font-semibold text-gray-700 dark:text-gray-200">{category}</span>
              <span className="font-mono font-bold dark:text-white">₹{data.today ? data.today.toLocaleString() : '—'}</span>
              {data.change !== null && (
                <div className={`inline-flex items-center gap-0.5 text-xs ${changeColor}`}>
                  {isPositive && <FiTrendingUp size={10} />}
                  {isNegative && <FiTrendingDown size={10} />}
                  <span>{isPositive ? '+' : ''}{Math.abs(change).toFixed(0)}</span>
                  <span className="text-[9px] opacity-70">({isPositive ? '+' : ''}{data.percentage?.toFixed(1)}%)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveRates;