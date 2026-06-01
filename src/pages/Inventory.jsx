import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockInQty, setStockInQty] = useState(1);
  const [reference, setReference] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchLowStock();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProducts(res.data.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchLowStock = async () => {
    try {
      const res = await axios.get('/stock/low-stock');
      setLowStock(res.data);
    } catch (error) {}
  };

  const handleStockIn = async () => {
    if (!selectedProduct) return;
    try {
      await axios.post('/stock/in', {
        product_id: selectedProduct,
        quantity: stockInQty,
        reference: reference || 'Manual addition'
      });
      toast.success('Stock added');
      setSelectedProduct(null);
      setStockInQty(1);
      setReference('');
      fetchProducts();
      fetchLowStock();
    } catch (error) {
      toast.error('Failed to add stock');
    }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Inventory Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock In Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Stock In / Purchase Entry</h2>
          <select
            value={selectedProduct || ''}
            onChange={e => setSelectedProduct(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2 mb-4"
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.product_name} (Current: {p.stock_quantity})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={stockInQty}
            onChange={e => setStockInQty(parseInt(e.target.value))}
            placeholder="Quantity"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2 mb-4"
          />
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="Reference (PO #, Supplier)"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2 mb-4"
          />
          <button
            onClick={handleStockIn}
            disabled={!selectedProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50 transition"
          >
            Add Stock
          </button>
        </div>

        {/* Low Stock Alerts Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">⚠ Low Stock Alerts (≤5)</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">All products have sufficient stock.</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map(p => (
                <li key={p.id} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="text-gray-800 dark:text-gray-200">{p.product_name}</span>
                  <span className="font-bold text-red-600 dark:text-red-400">Stock: {p.stock_quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;