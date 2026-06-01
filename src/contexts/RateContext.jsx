import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTodayRates, saveRates } from '../api/rateApi';
import toast from 'react-hot-toast';

const RateContext = createContext();

export const useRates = () => useContext(RateContext);

export const RateProvider = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [rates, setRates] = useState({ Gold: '', Silver: '', Diamond: '', Platinum: '' });
  const [saving, setSaving] = useState(false);

  const fetchRates = async () => {
    try {
      const data = await getTodayRates();
      const existing = {
        Gold: data.Gold?.rate_per_10gm || '',
        Silver: data.Silver?.rate_per_10gm || '',
        Diamond: data.Diamond?.rate_per_10gm || '',
        Platinum: data.Platinum?.rate_per_10gm || ''
      };
      setRates(existing);
    } catch (error) {
      console.error('Failed to fetch rates', error);
    }
  };

  const openModal = () => {
    fetchRates();
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (category, value) => {
    setRates(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const ratesArray = Object.entries(rates).map(([category, rate]) => ({
      category,
      rate_per_10gm: parseFloat(rate) || 0
    }));
    try {
      await saveRates(ratesArray);
      toast.success("Today's rates saved");
      closeModal();
    } catch (error) {
      toast.error('Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RateContext.Provider value={{ openModal, closeModal }}>
      {children}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Enter Today's Rates</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-2xl leading-5">&times;</button>
            </div>
            <div className="space-y-4">
              {['Gold', 'Silver', 'Diamond', 'Platinum'].map(cat => (
                <div key={cat}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{cat}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates[cat]}
                    onChange={e => handleChange(cat, e.target.value)}
                    placeholder="Rate per 10 grams"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:text-gray-300">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Rates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RateContext.Provider>
  );
};