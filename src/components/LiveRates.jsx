import { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosConfig';

const LiveRates = () => {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  // Desired display order
  const categoryOrder = ['Gold', 'Silver', 'Diamond', 'Platinum'];

  const fetchRates = async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    try {
      const res = await axios.get('/rates/today');
      if (isMounted.current) {
        // Store rates in an object keyed by category
        const ratesObj = {};
        Object.entries(res.data).forEach(([category, data]) => {
          ratesObj[category] = data?.rate_per_10gm || null;
        });
        setRates(ratesObj);
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
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-1 px-2 text-xs overflow-x-auto">
      <div className="flex justify-center items-center gap-4 whitespace-nowrap">
        <span className="text-gray-500 dark:text-gray-400 font-medium">Rates per 10g:</span>
        {categoryOrder.map((category) => {
          const rate = rates[category];
          return (
            <div key={category} className="inline-flex items-center gap-1">
              <span className="font-semibold text-gray-700 dark:text-gray-200">{category}</span>
              <span className="font-mono font-bold dark:text-white">
                ₹{rate !== null && rate !== undefined ? rate.toLocaleString() : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveRates;