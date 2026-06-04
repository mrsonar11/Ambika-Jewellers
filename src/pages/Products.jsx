import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import { getTodayRates } from '../api/rateApi';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [todayRates, setTodayRates] = useState({});
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: 1,
    design_name: '',
    hsn_code: '',
    purity: '',
    weight: '',
    making_charges_per_gram: '',
    stone_charges_per_gram: '',
    making_charges: 0,
    stone_charges: 0,
    gst_percent: 5,
    purchase_price: '',
    selling_price: '',
    stock_quantity: '',
    barcode_sku: '',
    product_image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const isAdmin = user?.role === 'admin';

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/products', { params: { page, search, category } });
      setProducts(res.data.data);
      setTotalPages(Math.ceil(res.data.total / 10));
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, category]);

  // Fetch today's rates (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    const fetchRates = async () => {
      try {
        const rates = await getTodayRates();
        setTodayRates(rates);
      } catch (error) {
        console.error('Failed to fetch rates');
      }
    };
    fetchRates();
  }, [isAdmin]);

  // Auto-calculate selling price (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    const categoryMap = { 1: 'Gold', 2: 'Silver', 3: 'Diamond', 4: 'Platinum' };
    const categoryName = categoryMap[formData.category_id];
    const ratePer10gm = todayRates[categoryName]?.rate_per_10gm || 0;
    const weight = parseFloat(formData.weight) || 0;
    const makingPerGram = parseFloat(formData.making_charges_per_gram) || 0;
    const stonePerGram = parseFloat(formData.stone_charges_per_gram) || 0;
    const basePrice = (ratePer10gm / 10) * weight;
    const makingTotal = makingPerGram * weight;
    const stoneTotal = stonePerGram * weight;
    const calculatedSelling = basePrice + makingTotal + stoneTotal;
    if (!isNaN(calculatedSelling) && calculatedSelling >= 0) {
      setFormData(prev => ({ ...prev, selling_price: calculatedSelling.toFixed(2) }));
    }
  }, [formData.category_id, formData.weight, formData.making_charges_per_gram, formData.stone_charges_per_gram, todayRates, isAdmin]);

  // Delete product (admin only)
  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('You are not authorized to delete products');
      return;
    }
    if (window.confirm('Delete product?')) {
      try {
        await axios.delete(`/products/${id}`);
        toast.success('Deleted');
        fetchProducts();
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Unauthorized: Only admin can delete products');
        } else {
          toast.error('Delete failed');
        }
      }
    }
  };

  // Open modal (admin only)
  const openModal = (product = null) => {
    if (!isAdmin) {
      toast.error('You are not authorized to add or edit products');
      return;
    }
    if (product) {
      const weight = product.weight || 0;
      const perGramMaking = weight > 0 ? product.making_charges / weight : 0;
      const perGramStone = weight > 0 ? product.stone_charges / weight : 0;
      setEditingProduct(product);
      setFormData({
        product_name: product.product_name,
        category_id: product.category_id,
        design_name: product.design_name || '',
        hsn_code: product.hsn_code || '',
        purity: product.purity || '',
        weight: product.weight,
        making_charges_per_gram: perGramMaking > 0 ? perGramMaking : '',
        stone_charges_per_gram: perGramStone > 0 ? perGramStone : '',
        making_charges: product.making_charges,
        stone_charges: product.stone_charges,
        gst_percent: product.gst_percent,
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        stock_quantity: product.stock_quantity,
        barcode_sku: product.barcode_sku || '',
        product_image: null
      });
      setImagePreview(product.product_image ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${product.product_image}` : null);
    } else {
      setEditingProduct(null);
      setFormData({
        product_name: '',
        category_id: 1,
        design_name: '',
        hsn_code: '',
        purity: '',
        weight: '',
        making_charges_per_gram: '',
        stone_charges_per_gram: '',
        making_charges: 0,
        stone_charges: 0,
        gst_percent: 5,
        purchase_price: '',
        selling_price: '',
        stock_quantity: '',
        barcode_sku: '',
        product_image: null
      });
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'making_charges_per_gram' || name === 'stone_charges_per_gram') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, product_image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('You are not authorized to save products');
      setShowModal(false);
      return;
    }
    setSubmitting(true);
    const weight = parseFloat(formData.weight) || 0;
    const makingPerGram = parseFloat(formData.making_charges_per_gram) || 0;
    const stonePerGram = parseFloat(formData.stone_charges_per_gram) || 0;
    const totalMaking = weight * makingPerGram;
    const totalStone = weight * stonePerGram;

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'product_image' && formData[key] instanceof File) {
        data.append(key, formData[key]);
      } else if (key !== 'product_image' && key !== 'making_charges_per_gram' && key !== 'stone_charges_per_gram') {
        data.append(key, formData[key]);
      }
    });
    data.append('making_charges', totalMaking);
    data.append('stone_charges', totalStone);

    try {
      if (editingProduct) {
        data.append('_method', 'PUT');
        await axios.post(`/products/${editingProduct.id}`, data);
        toast.success('Product updated');
      } else {
        await axios.post('/products', data);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Unauthorized: Only admin can modify products');
      } else {
        toast.error(error.response?.data?.errors || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Inline styles for modal
  const modalBg = darkMode ? '#1f2937' : '#ffffff';
  const modalText = darkMode ? '#f3f4f6' : '#111827';
  const inputBg = darkMode ? '#374151' : '#ffffff';
  const labelColor = darkMode ? '#d1d5db' : '#374151';
  const borderColor = darkMode ? '#4b5563' : '#d1d5db';
  const hintColor = darkMode ? '#9ca3af' : '#6b7280';

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Products</h1>
        {isAdmin && (
          <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
            <FiPlus /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Name or SKU" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2">
            <option value="">All</option>
            <option value="Gold">Gold</option><option value="Silver">Silver</option><option value="Diamond">Diamond</option><option value="Platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4 dark:text-gray-300">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4 dark:text-gray-300">No products found</td></tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{product.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.product_image ? (
                      <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${product.product_image}`} className="h-10 w-10 object-cover rounded" alt="" />
                    ) : <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-xs">No img</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{product.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-200">{product.category?.name || product.category_name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-200">₹{product.selling_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={product.stock_quantity <= 5 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-gray-200'}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {isAdmin ? (
                      <>
                        <button onClick={() => openModal(product)} className="text-blue-600 dark:text-blue-400"><FiEdit2 size={18} /></button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 dark:text-red-400"><FiTrash2 size={18} /></button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">View only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:text-gray-300">Prev</button>
          <span className="px-3 py-1 dark:text-gray-300">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:text-gray-300">Next</button>
        </div>
      )}

      {/* Modal (only for admin) */}
      {isAdmin && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div style={{ backgroundColor: modalBg, color: modalText }} className="rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: modalText }}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} style={{ color: modalText }} className="text-2xl leading-5 hover:opacity-70">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="product_name" value={formData.product_name} onChange={handleInputChange} placeholder="Product Name*"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" required />
                <select name="category_id" value={formData.category_id} onChange={handleInputChange}
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2">
                  <option value="1">Gold</option><option value="2">Silver</option><option value="3">Diamond</option><option value="4">Platinum</option>
                </select>
                <input name="design_name" value={formData.design_name} onChange={handleInputChange} placeholder="Design Name"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" />
                <input name="hsn_code" value={formData.hsn_code} onChange={handleInputChange} placeholder="HSN Code"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" />
                <input name="purity" value={formData.purity} onChange={handleInputChange} placeholder="Purity (22K,24K)"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" />
                <input name="weight" type="number" step="0.001" value={formData.weight} onChange={handleInputChange} placeholder="Weight (grams)*"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" required />

                {/* Making Charges per gram */}
                <div>
                  <label style={{ color: labelColor }} className="block text-sm font-medium mb-1">Making Charges (₹/gram)</label>
                  <div className="relative">
                    <input type="number" step="0.01" name="making_charges_per_gram" value={formData.making_charges_per_gram === '' ? '' : formData.making_charges_per_gram} onChange={handleInputChange}
                      placeholder="e.g., 300"
                      style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="w-full rounded p-2 [appearance:textfield]" />
                    {formData.weight && formData.making_charges_per_gram > 0 && (
                      <span style={{ color: hintColor }} className="text-xs absolute right-2 bottom-2">
                        Total: ₹{(formData.weight * formData.making_charges_per_gram).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stone Charges per gram */}
                <div>
                  <label style={{ color: labelColor }} className="block text-sm font-medium mb-1">Stone Charges (₹/gram)</label>
                  <div className="relative">
                    <input type="number" step="0.01" name="stone_charges_per_gram" value={formData.stone_charges_per_gram === '' ? '' : formData.stone_charges_per_gram} onChange={handleInputChange}
                      placeholder="e.g., 250"
                      style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="w-full rounded p-2 [appearance:textfield]" />
                    {formData.weight && formData.stone_charges_per_gram > 0 && (
                      <span style={{ color: hintColor }} className="text-xs absolute right-2 bottom-2">
                        Total: ₹{(formData.weight * formData.stone_charges_per_gram).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <input name="gst_percent" type="number" step="0.01" value={formData.gst_percent} onChange={handleInputChange} placeholder="GST %"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" />
                <input name="purchase_price" type="number" value={formData.purchase_price} onChange={handleInputChange} placeholder="Purchase Price*"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" required />
                
                {/* Selling Price (auto) */}
                <div>
                  <label style={{ color: labelColor }} className="block text-sm font-medium mb-1">Selling Price (auto)*</label>
                  <input name="selling_price" type="number" value={formData.selling_price} readOnly
                    style={{ backgroundColor: darkMode ? '#4b5563' : '#f3f4f6', color: modalText, border: `1px solid ${borderColor}` }} className="w-full rounded p-2" />
                </div>

                <input name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleInputChange} placeholder="Stock Quantity*"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" required />
                <input name="barcode_sku" value={formData.barcode_sku} onChange={handleInputChange} placeholder="Barcode/SKU"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2" />
                <div className="col-span-2">
                  <label style={{ color: labelColor }} className="block text-sm font-medium mb-1">Product Image</label>
                  <input type="file" accept="image/*" onChange={handleFileChange}
                    style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${borderColor}` }} className="rounded p-2 w-full" />
                  {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-20 w-20 object-cover" />}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded"
                  style={{ backgroundColor: inputBg, color: modalText, borderColor }}>Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;