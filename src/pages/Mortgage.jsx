import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiX, FiEye, FiDollarSign } from 'react-icons/fi';

const Mortgage = () => {
  const [mortgages, setMortgages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMortgage, setEditingMortgage] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMortgage, setSelectedMortgage] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    customer_id: '',
    item_description: '',
    weight: '',
    loan_amount: '',
    interest_rate: '',
    pledge_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const fetchMortgages = async () => {
    setLoading(true);
    try {
      const params = { page, search };
      if (statusFilter) params.status = statusFilter;
      const res = await axios.get('/mortgages', { params });
      setMortgages(res.data.data);
      setTotalPages(Math.ceil(res.data.total / 15));
    } catch (error) {
      toast.error('Failed to fetch mortgages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMortgages();
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (customerSearch.length > 1) {
      axios.get('/customers', { params: { search: customerSearch } })
        .then(res => setCustomers(res.data.data))
        .catch(err => console.error(err));
    }
  }, [customerSearch]);

  const openModal = (mortgage = null) => {
    if (mortgage) {
      setEditingMortgage(mortgage);
      setFormData({
        customer_id: mortgage.customer_id,
        item_description: mortgage.item_description,
        weight: mortgage.weight,
        loan_amount: mortgage.loan_amount,
        interest_rate: mortgage.interest_rate,
        pledge_date: mortgage.pledge_date,
        due_date: mortgage.due_date,
        notes: mortgage.notes || '',
      });
      setCustomerSearch(mortgage.customer?.name || '');
    } else {
      setEditingMortgage(null);
      setFormData({
        customer_id: '',
        item_description: '',
        weight: '',
        loan_amount: '',
        interest_rate: '',
        pledge_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: '',
      });
      setCustomerSearch('');
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    setSubmitting(true);
    try {
      if (editingMortgage) {
        await axios.put(`/mortgages/${editingMortgage.id}`, formData);
        toast.success('Mortgage updated');
      } else {
        await axios.post('/mortgages', formData);
        toast.success('Mortgage created');
      }
      setShowModal(false);
      fetchMortgages();
    } catch (error) {
      toast.error(error.response?.data?.errors || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this mortgage record?')) {
      try {
        await axios.delete(`/mortgages/${id}`);
        toast.success('Deleted');
        fetchMortgages();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const viewDetails = async (id) => {
    try {
      const res = await axios.get(`/mortgages/${id}`);
      setViewingDetails(res.data);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const openPaymentModal = (mortgage) => {
    setSelectedMortgage(mortgage);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRemarks('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Enter valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/mortgages/${selectedMortgage.id}/payments`, {
        amount: parseFloat(paymentAmount),
        payment_date: paymentDate,
        remarks: paymentRemarks,
      });
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      fetchMortgages(); // refresh list
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Mortgage / Pledge</h1>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <FiPlus /> Add Mortgage
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Customer or item" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-full border rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full border rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="repaid">Repaid</option>
            <option value="released">Released</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Weight(g)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loan Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interest</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remaining</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="text-center py-4 dark:text-gray-300">Loading...</td></tr>
            ) : mortgages.length === 0 ? (
              <tr><td colSpan="10" className="text-center py-4 dark:text-gray-300">No mortgage records found</td></tr>
            ) : (
              mortgages.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-200">{m.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">{m.customer?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-200">{m.item_description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm dark:text-gray-200">{m.weight}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm dark:text-gray-200">₹{Number(m.loan_amount).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm dark:text-gray-200">₹{Number(m.interest_amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 dark:text-green-400">₹{Number(m.paid_amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600 dark:text-red-400">₹{Number(m.remaining_amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    <span className={`px-2 py-1 rounded text-xs ${
                      m.status === 'active' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      m.status === 'repaid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>{m.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => viewDetails(m.id)} className="text-blue-600 dark:text-blue-400" title="View"><FiEye size={18} /></button>
                    <button onClick={() => openModal(m)} className="text-green-600 dark:text-green-400" title="Edit"><FiEdit2 size={18} /></button>
                    <button onClick={() => openPaymentModal(m)} className="text-purple-600 dark:text-purple-400" title="Record Payment"><FiDollarSign size={18} /></button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600 dark:text-red-400" title="Delete"><FiTrash2 size={18} /></button>
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
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50 dark:text-gray-300">Prev</button>
          <span className="px-3 py-1 dark:text-gray-300">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50 dark:text-gray-300">Next</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-white">{editingMortgage ? 'Edit Mortgage' : 'Add Mortgage'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 dark:text-gray-400"><FiX size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Customer *</label>
                  <div className="relative">
                    <input type="text" placeholder="Search customer" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} onFocus={() => setShowCustomerDropdown(true)} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" required />
                    {showCustomerDropdown && customerSearch.length > 1 && (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-800 dark:text-white border rounded shadow-lg max-h-60 overflow-y-auto mt-1">
                        {customers.map(c => (
                          <div key={c.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => {
                            setFormData({ ...formData, customer_id: c.id });
                            setCustomerSearch(c.name);
                            setShowCustomerDropdown(false);
                          }}>{c.name} - {c.mobile}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Item Description *</label>
                  <input name="item_description" value={formData.item_description} onChange={handleInputChange} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Weight (g)</label>
                    <input type="number" step="0.001" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Loan Amount (₹) *</label>
                    <input type="number" step="0.01" name="loan_amount" value={formData.loan_amount} onChange={handleInputChange} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Interest Rate (% per month)</label>
                    <input type="number" step="0.01" name="interest_rate" value={formData.interest_rate} onChange={handleInputChange} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Due Date *</label>
                    <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Notes</label>
                  <textarea name="notes" rows="2" value={formData.notes} onChange={handleInputChange} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedMortgage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Record Payment for {selectedMortgage.item_description}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Amount (₹)</label>
                <input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Payment Date</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Remarks</label>
                <input type="text" value={paymentRemarks} onChange={e => setPaymentRemarks(e.target.value)} className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded dark:text-gray-300">Cancel</button>
              <button onClick={handlePaymentSubmit} disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">{submitting ? 'Processing...' : 'Record Payment'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-white">Mortgage Details</h2>
              <button onClick={() => setViewingDetails(null)} className="text-gray-500 dark:text-gray-400"><FiX size={24} /></button>
            </div>
            <div className="space-y-2">
              <p><strong>Customer:</strong> {viewingDetails.customer?.name} ({viewingDetails.customer?.mobile})</p>
              <p><strong>Item:</strong> {viewingDetails.item_description}</p>
              <p><strong>Weight:</strong> {viewingDetails.weight} g</p>
              <p><strong>Loan Amount:</strong> ₹{Number(viewingDetails.loan_amount).toLocaleString()}</p>
              <p><strong>Interest Rate:</strong> {viewingDetails.interest_rate}% per month</p>
              <p><strong>Pledge Date:</strong> {viewingDetails.pledge_date}</p>
              <p><strong>Due Date:</strong> {viewingDetails.due_date}</p>
              <p><strong>Status:</strong> <span className="capitalize">{viewingDetails.status}</span></p>
              <p><strong>Notes:</strong> {viewingDetails.notes || '—'}</p>
              <p><strong>Total Interest:</strong> ₹{Number(viewingDetails.interest_amount).toLocaleString()}</p>
              <p><strong>Total Payable:</strong> ₹{Number(viewingDetails.total_payable).toLocaleString()}</p>
              <p><strong>Paid So Far:</strong> ₹{Number(viewingDetails.paid_amount).toLocaleString()}</p>
              <p><strong>Remaining:</strong> ₹{Number(viewingDetails.remaining_amount).toLocaleString()}</p>
              <h3 className="font-bold mt-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Amount</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {viewingDetails.payments?.map(p => (
                      <tr key={p.id}><td className="px-4 py-2">{p.payment_date}</td><td className="px-4 py-2 text-right">₹{p.amount}</td><td className="px-4 py-2">{p.remarks || '—'}</td></tr>
                    ))}
                    {(!viewingDetails.payments || viewingDetails.payments.length === 0) && <tr><td colSpan="3" className="text-center py-2">No payments yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mortgage;