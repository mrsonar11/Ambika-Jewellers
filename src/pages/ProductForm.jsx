import { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import toast from 'react-hot-toast';

const ProductForm = ({ product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: 1,
    design_name: '',
    hsn_code: '',
    purity: '',
    weight: '',
    making_charges: 0,
    stone_charges: 0,
    gst_percent: 5,
    purchase_price: '',
    selling_price: '',
    stock_quantity: '',
    barcode_sku: '',
    product_image: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        category_id: product.category_id,
        product_image: null
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, product_image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'product_image' && formData[key]) data.append(key, formData[key]);
      else if (formData[key] !== null && key !== 'product_image') data.append(key, formData[key]);
    });
    if (product) data.append('_method', 'PUT');
    
    try {
      if (product) {
        await axios.post(`/products/${product.id}`, data);
        toast.success('Product updated');
      } else {
        await axios.post('/products', data);
        toast.success('Product created');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.errors || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{product ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="product_name" value={formData.product_name} onChange={handleChange} placeholder="Product Name" className="border p-2 rounded" required />
            <select name="category_id" value={formData.category_id} onChange={handleChange} className="border p-2 rounded">
              <option value="1">Gold</option><option value="2">Silver</option><option value="3">Diamond</option><option value="4">Platinum</option>
            </select>
            <input name="design_name" value={formData.design_name} onChange={handleChange} placeholder="Design Name" className="border p-2 rounded" />
            <input name="hsn_code" value={formData.hsn_code} onChange={handleChange} placeholder="HSN Code" className="border p-2 rounded" />
            <input name="purity" value={formData.purity} onChange={handleChange} placeholder="Purity (22K,24K)" className="border p-2 rounded" />
            <input name="weight" type="number" step="0.001" value={formData.weight} onChange={handleChange} placeholder="Weight (grams)" className="border p-2 rounded" required />
            <input name="making_charges" type="number" value={formData.making_charges} onChange={handleChange} placeholder="Making Charges" className="border p-2 rounded" />
            <input name="stone_charges" type="number" value={formData.stone_charges} onChange={handleChange} placeholder="Stone Charges" className="border p-2 rounded" />
            <input name="gst_percent" type="number" step="0.01" value={formData.gst_percent} onChange={handleChange} placeholder="GST %" className="border p-2 rounded" />
            <input name="purchase_price" type="number" value={formData.purchase_price} onChange={handleChange} placeholder="Purchase Price" className="border p-2 rounded" required />
            <input name="selling_price" type="number" value={formData.selling_price} onChange={handleChange} placeholder="Selling Price" className="border p-2 rounded" required />
            <input name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleChange} placeholder="Stock Quantity" className="border p-2 rounded" required />
            <input name="barcode_sku" value={formData.barcode_sku} onChange={handleChange} placeholder="Barcode/SKU" className="border p-2 rounded" />
            <input type="file" accept="image/*" onChange={handleFileChange} className="border p-2 rounded" />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProductForm;