import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiX, FiEye } from 'react-icons/fi';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    email: '',
    gst_number: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/customers', { params: { page, search } });
      setCustomers(res.data.data);
      setTotalPages(Math.ceil(res.data.total / 10));
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`/customers/${id}`);
        toast.success('Customer deleted');
        fetchCustomers();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address || '',
        email: customer.email || '',
        gst_number: customer.gst_number || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        mobile: '',
        address: '',
        email: '',
        gst_number: ''
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await axios.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Customer updated');
      } else {
        await axios.post('/customers', formData);
        toast.success('Customer added');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.errors || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const viewPurchaseHistory = async (customer) => {
    try {
      const res = await axios.get(`/customers/${customer.id}/history`);
      setViewingHistory(res.data);
    } catch (error) {
      toast.error('Failed to load purchase history');
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setPaying(true);
    try {
      await axios.post(`/invoices/${selectedInvoice.id}/pay`, { amount: parseFloat(paymentAmount) });
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      // Refresh the purchase history
      if (viewingHistory) {
        const refreshed = await axios.get(`/customers/${viewingHistory.customer.id}/history`);
        setViewingHistory(refreshed.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Customers</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <FiPlus /> Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Customer</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Name or Mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Spent</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GST Number</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan="8" className="text-center py-4 dark:text-gray-300">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-4 dark:text-gray-300">No customers found</td></tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{customer.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{customer.mobile}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{customer.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                    ₹{customer.total_spent ? Number(customer.total_spent).toLocaleString() : '0'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${
                    customer.total_due && customer.total_due > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    ₹{customer.total_due ? Number(customer.total_due).toLocaleString() : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{customer.gst_number || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onClick={() => viewPurchaseHistory(customer)} className="text-green-600 hover:text-green-900 dark:text-green-400" title="View History">
                      <FiEye size={18} />
                    </button>
                    <button onClick={() => openModal(customer)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400" title="Edit">
                      <FiEdit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 dark:text-red-400" title="Delete">
                      <FiTrash2 size={18} />
                    </button>
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
          <button
            onClick={() => setPage(p => Math.max(1, p-1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:text-gray-300"
          >Prev</button>
          <span className="px-3 py-1 dark:text-gray-300">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p+1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:text-gray-300"
          >Next</button>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Name *" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2" required />
                <input name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="Mobile Number *" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2" required />
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2" />
                <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" rows="2" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2"></textarea>
                <input name="gst_number" value={formData.gst_number} onChange={handleInputChange} placeholder="GST Number (optional)" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {viewingHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Purchase History: {viewingHistory.customer.name}</h2>
              <button onClick={() => setViewingHistory(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <FiX size={24} />
              </button>
            </div>
            {viewingHistory.purchases.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No purchases yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Invoice #</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Date</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Total</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Due</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Status</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {viewingHistory.purchases.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{inv.invoice_number}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{inv.invoice_date}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-200">₹{inv.grand_total}</td>
                        <td className="px-4 py-2 text-sm text-right text-red-600 dark:text-red-400 font-semibold">₹{inv.due_amount}</td>
                        <td className="px-4 py-2 text-sm capitalize">{inv.payment_status}</td>
                        <td className="px-4 py-2 text-center">
                          {inv.due_amount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentAmount('');
                                setShowPaymentModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 dark:text-gray-400 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Invoice #</label>
                <input type="text" value={selectedInvoice?.invoice_number || ''} disabled className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Due Amount</label>
                <input type="text" value={`₹${selectedInvoice?.due_amount || 0}`} disabled className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Payment Amount</label>
                <input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Enter amount" className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" required />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded dark:text-gray-300">Cancel</button>
              <button onClick={handlePayment} disabled={paying} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                {paying ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;