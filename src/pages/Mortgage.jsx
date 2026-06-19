import { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiX, FiEye, FiDollarSign, FiCheckCircle, FiPrinter } from 'react-icons/fi';

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

  // Release modal state
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [releasing, setReleasing] = useState(false);

  // --- Debounce for main search ---
  const debounceTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  // --- Debounce for customer search inside modal ---
  const customerDebounceTimer = useRef(null);
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');

  useEffect(() => {
    if (customerDebounceTimer.current) clearTimeout(customerDebounceTimer.current);
    customerDebounceTimer.current = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 500);
    return () => clearTimeout(customerDebounceTimer.current);
  }, [customerSearch]);

  // --- Fetch mortgages ---
  const fetchMortgages = async () => {
    setLoading(true);
    try {
      const params = { page, search: debouncedSearch };
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
  }, [page, debouncedSearch, statusFilter]);

  // --- Fetch customers for dropdown (debounced) ---
  useEffect(() => {
    if (debouncedCustomerSearch.length > 1) {
      axios.get('/customers', { params: { search: debouncedCustomerSearch } })
        .then(res => setCustomers(res.data.data))
        .catch(err => console.error(err));
    } else {
      setCustomers([]);
    }
  }, [debouncedCustomerSearch]);

  // --- Modal handlers ---
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
      fetchMortgages();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Release handlers ---
  const openReleaseModal = (mortgage) => {
    if (mortgage.remaining_amount > 0) {
      toast.error('Cannot release – loan not fully repaid');
      return;
    }
    setReleaseTarget(mortgage);
    setShowReleaseModal(true);
  };

  const handleRelease = async () => {
    if (!releaseTarget) return;
    setReleasing(true);
    try {
      await axios.post(`/mortgages/${releaseTarget.id}/release`);
      toast.success('Item released successfully');
      setShowReleaseModal(false);
      fetchMortgages();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Release failed');
    } finally {
      setReleasing(false);
    }
  };

  // --- Print receipt ---
  const printMortgage = (mortgage) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    // Prepare payment rows: show actual payments first, then blank rows to reach total of 5 rows
    const maxRows = 5;
    const payments = mortgage.payments || [];
    const paymentCount = payments.length;
    const blankRowsNeeded = Math.max(0, maxRows - paymentCount);

    let paymentRows = '';
    // Actual payments
    payments.forEach(p => {
      paymentRows += `
        <tr>
          <td>${new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
          <td class="text-right">₹${Number(p.amount).toLocaleString()}</td>
          <td>${p.remarks || '—'}</td>
        </tr>
      `;
    });

    // Blank rows for manual entry
    for (let i = 0; i < blankRowsNeeded; i++) {
      paymentRows += `
        <tr>
          <td>&nbsp;</td>
          <td class="text-right">&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      `;
    }

    // If no payments at all, we already have blank rows, but we need to show "No payments yet" only if there are truly none?
    // We'll keep the blank rows anyway.

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mortgage Receipt - ${mortgage.id}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 10px; font-size: 12px; }
          .container { max-width: 550px; margin: 0 auto; border: 1px solid #ddd; padding: 15px; }
          .header { text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 8px; margin-bottom: 10px; }
          .shop-name { font-size: 18px; font-weight: bold; color: #8B4513; }
          .title { font-size: 14px; font-weight: bold; margin-top: 3px; }
          .header-sub { font-size: 11px; color: #555; display: flex; justify-content: space-between; }
          .detail-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #eee; font-size: 12px; }
          .label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .footer { margin-top: 15px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 8px; }
          .status-badge { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; }
          .status-active { background: #fef08a; color: #854d0e; }
          .status-repaid { background: #bbf7d0; color: #14532d; }
          .status-released { background: #bfdbfe; color: #1e3a8a; }
          .extra-note { font-size: 10px; color: #555; margin-top: 5px; }
          @media print {
            body { padding: 0; }
            .container { border: none; padding: 10px; }
            .status-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="shop-name">💎 AMBIKA JEWELLERS</div>
            <div class="title">PLEDGE RECEIPT</div>
            <div class="header-sub">
              <span>Receipt #: ${mortgage.id}</span>
              <span>Date: ${new Date(mortgage.created_at).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          <div class="detail-row"><span class="label">Customer:</span><span>${mortgage.customer?.name}</span></div>
          <div class="detail-row"><span class="label">Mobile:</span><span>${mortgage.customer?.mobile}</span></div>
          <div class="detail-row"><span class="label">Item:</span><span>${mortgage.item_description}</span></div>
          <div class="detail-row"><span class="label">Weight:</span><span>${mortgage.weight} g</span></div>
          <div class="detail-row"><span class="label">Loan Amount:</span><span>₹${Number(mortgage.loan_amount).toLocaleString()}</span></div>
          <div class="detail-row"><span class="label">Interest Rate:</span><span>${mortgage.interest_rate}% per month</span></div>
          <div class="detail-row"><span class="label">Pledge Date:</span><span>${new Date(mortgage.pledge_date).toLocaleDateString('en-IN')}</span></div>
          <div class="detail-row"><span class="label">Due Date:</span><span>${new Date(mortgage.due_date).toLocaleDateString('en-IN')}</span></div>
          <div class="detail-row"><span class="label">Status:</span><span class="status-badge status-${mortgage.status}">${mortgage.status.toUpperCase()}</span></div>
          <div class="detail-row"><span class="label">Total Interest:</span><span>₹${Number(mortgage.interest_amount).toLocaleString()}</span></div>
          <div class="detail-row"><span class="label">Total Payable:</span><span>₹${Number(mortgage.total_payable).toLocaleString()}</span></div>
          <div class="detail-row"><span class="label">Paid So Far:</span><span>₹${Number(mortgage.paid_amount).toLocaleString()}</span></div>
          <div class="detail-row"><span class="label">Remaining:</span><span>₹${Number(mortgage.remaining_amount).toLocaleString()}</span></div>

          <h3 style="font-size:13px; margin-top:10px; margin-bottom:5px;">Payment History</h3>
          <table>
            <thead><tr><th>Date</th><th class="text-right">Amount</th><th>Remarks</th></tr></thead>
            <tbody>${paymentRows}</tbody>
          </table>
          <div style="font-size:9px; color:#888; margin-top: 2px; text-align: right;">(Blank rows for manual entry)</div>

          <div class="footer">
            <p>This is a computer generated receipt. Thank you for your business!</p>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
            <input
              type="text"
              placeholder="Customer Name, Mobile or item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full border rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white">
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
                    {m.status !== 'released' && (
                      <button
                        onClick={() => openReleaseModal(m)}
                        className="text-indigo-600 dark:text-indigo-400 hover:opacity-75"
                        title="Release Item"
                      >
                        <FiCheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => printMortgage(m)}
                      className="text-gray-600 dark:text-gray-400 hover:opacity-75"
                      title="Print Receipt"
                    >
                      <FiPrinter size={18} />
                    </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                    <input
                      type="text"
                      placeholder="Search customer"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
                      required
                    />
                    {showCustomerDropdown && customerSearch.length > 1 && (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto mt-1">
                        {customers.map(c => (
                          <div
                            key={c.id}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer dark:text-white"
                            onClick={() => {
                              setFormData({ ...formData, customer_id: c.id });
                              setCustomerSearch(c.name);
                              setShowCustomerDropdown(false);
                            }}
                          >
                            {c.name} - {c.mobile}
                          </div>
                        ))}
                        {customers.length === 0 && (
                          <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No customers found</div>
                        )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold dark:text-white">Record Payment for {selectedMortgage.item_description}</h2>
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

      {/* Release Confirmation Modal */}
      {showReleaseModal && releaseTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold dark:text-white">Confirm Release</h2>
            <p className="mt-2 dark:text-gray-300">
              Are you sure you want to release the item <strong className="dark:text-white">{releaseTarget.item_description}</strong> for customer <strong className="dark:text-white">{releaseTarget.customer?.name}</strong>?
            </p>
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              This action will mark the item as <strong>Released</strong>. The loan is fully repaid (remaining amount: ₹0).
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowReleaseModal(false)} className="px-4 py-2 border rounded dark:text-gray-300">Cancel</button>
              <button onClick={handleRelease} disabled={releasing} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">
                {releasing ? 'Releasing...' : 'Yes, Release'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal with Print Button */}
      {viewingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-white">Mortgage Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => printMortgage(viewingDetails)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                >
                  <FiPrinter size={16} /> Print
                </button>
                <button onClick={() => setViewingDetails(null)} className="text-gray-500 dark:text-gray-400">
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="space-y-2 dark:text-gray-300">
              <p className="dark:text-gray-200"><strong className="dark:text-white">Customer:</strong> {viewingDetails.customer?.name} ({viewingDetails.customer?.mobile})</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Item:</strong> {viewingDetails.item_description}</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Weight:</strong> {viewingDetails.weight} g</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Loan Amount:</strong> ₹{Number(viewingDetails.loan_amount).toLocaleString()}</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Interest Rate:</strong> {viewingDetails.interest_rate}% per month</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Pledge Date:</strong> {new Date(viewingDetails.pledge_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Due Date:</strong> {new Date(viewingDetails.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Status:</strong> <span className="capitalize dark:text-white">{viewingDetails.status}</span></p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Notes:</strong> {viewingDetails.notes || '—'}</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Total Interest:</strong> ₹{Number(viewingDetails.interest_amount).toLocaleString()}</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Total Payable:</strong> ₹{Number(viewingDetails.total_payable).toLocaleString()}</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Paid So Far:</strong> ₹{Number(viewingDetails.paid_amount).toLocaleString()}</p>
              <p className="dark:text-gray-200"><strong className="dark:text-white">Remaining:</strong> ₹{Number(viewingDetails.remaining_amount).toLocaleString()}</p>
              <h3 className="font-bold mt-4 dark:text-white">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Date</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingDetails.payments?.map(p => (
                      <tr key={p.id} className="dark:text-gray-200">
                        <td className="px-4 py-2">{new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-2 text-right">₹{p.amount}</td>
                        <td className="px-4 py-2">{p.remarks || '—'}</td>
                      </tr>
                    ))}
                    {(!viewingDetails.payments || viewingDetails.payments.length === 0) && (
                      <tr><td colSpan="3" className="text-center py-2 dark:text-gray-400">No payments yet</td></tr>
                    )}
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