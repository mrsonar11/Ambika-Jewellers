import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { FiEye, FiPrinter, FiX, FiSearch } from 'react-icons/fi';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = { page, search, from_date: fromDate, to_date: toDate, status };
      const res = await axios.get('/invoices', { params });
      setInvoices(res.data.data);
      setTotalPages(Math.ceil(res.data.total / 15));
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search, fromDate, toDate, status]);

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setStatus('');
    setPage(1);
  };

  const viewInvoice = async (id) => {
    try {
      const res = await axios.get(`/invoices/${id}`);
      setSelectedInvoice(res.data);
    } catch (error) {
      toast.error('Failed to load invoice details');
    }
  };

  const printInvoice = async (invoice) => {
    try {
      const fullInvoiceRes = await axios.get(`/invoices/${invoice.id}`);
      const fullInvoice = fullInvoiceRes.data;
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Pop-up blocked. Please allow pop-ups for this site.');
        return;
      }

      // Build rates HTML
      let ratesHtml = '';
      if (fullInvoice.rates_snapshot) {
        try {
          const rates = JSON.parse(fullInvoice.rates_snapshot);
          ratesHtml = `<div class="rates-section" style="background-color: #d8d8d8; padding: 8px; margin-top: 10px; font-size: 10px; text-align: center; border-radius: 4px;">
            <strong>Today's Rates (per 10g):</strong><br/>
            ${Object.entries(rates).map(([cat, rate]) => `${cat}: ₹${rate || '—'}`).join(' &nbsp;&nbsp; ')}
          </div>`;
        } catch(e) {}
      }

      const itemsRows = fullInvoice.items.map((item, idx) => {
        const weight = item.weight || item.product?.weight || 0;
        const ratePerGram = weight > 0 ? (item.unit_price / weight).toFixed(2) : '—';
        const productName = item.product_name || item.product?.product_name || 'Manual Item';
        const category = item.category_name || item.product?.category?.name || '—';
        return `
          <tr>
            <td class="text-right">${idx + 1}</td>
            <td>${productName}</td>
            <td>${category}</td>
            <td class="text-right">${weight}</td>
            <td class="text-right">${ratePerGram}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">₹${Number(item.unit_price).toLocaleString()}</td>
            <td class="text-right">₹${Number(item.total).toLocaleString()}</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Invoice ${fullInvoice.invoice_number}</title>
        <style>
          @page { size: A5; margin: 1cm; }
          thead { display: table-header-group; }
          *{box-sizing:border-box} body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:20px;font-size:14px}
          .invoice-container{max-width:800px;margin:0 auto;background:#fff;padding:20px;border:1px solid #ddd}
          .header{text-align:center;border-bottom:2px solid #8B4513}
          .shop-name{font-size:32px;font-weight:bold;color:#8B4513}
          .tagline{font-size:12px;color:#555}
          .address{font-size:12px;color:#555;margin-top:5px}
          .invoice-title{font-size:18px;font-weight:bold;margin-top:5px}
          .customer-info{margin:15px 0;padding:10px;background:#e3f5fd;border-radius:4px}
          .rates-section{margin:15px 0;padding:10px;background:#d8d8d8;text-align:center;border-radius:4px}
          table{width:100%;border-collapse:collapse;margin:20px 0}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          .text-right{text-align:right}
          .totals{text-align:right;margin-top:20px;border-top:1px solid #ddd;padding-top:10px}
          .grand-total{font-size:18px;font-weight:bold;margin-top:10px}
          .footer{text-align:center;margin-top:10px;font-size:12px;color:#777}
          .note-bg{background-color:#eef2f5;padding:8px;font-size:12px;text-align:center;border-radius:4px}
          @media print {
            body { margin: 0; padding: 0; }
            .invoice-container { border: none; padding: 0; }
            .note-bg, .customer-info, .rates-section { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="shop-name">💎 AMBIKA JEWELLERS</div>
              <div class="tagline">Since 1985 | Trust & Quality</div>
              <div class="address">Saraswati nagar, Near Rasbihari Int. School, Meri Link Road, Panchavati, Nashik-422003.</div>
              <div class="invoice-title">TAX INVOICE</div>
              <div style="display:flex;justify-content:space-between;width:100%">
                <span>Invoice #: ${fullInvoice.invoice_number}</span>
                <span>Date: ${fullInvoice.invoice_date}</span>
              </div>
            </div>
            <div class="customer-info">
              <div style="font-size:14px;"><strong>Customer:</strong> ${fullInvoice.customer.name}<br><strong>Mobile:</strong> ${fullInvoice.customer.mobile}</div>
              <div style="font-size:10px;color:#555;margin-top:5px;">
                ${fullInvoice.customer.address ? `<strong>Address:</strong> ${fullInvoice.customer.address}<br>` : ''}
                ${fullInvoice.customer.gst_number ? `<strong>GST:</strong> ${fullInvoice.customer.gst_number}` : ''}
              </div>
            </div>
            ${ratesHtml}
            <table>
              <thead><tr><th>#</th><th>Item</th><th>Category</th><th class="text-right">Weight(g)</th><th class="text-right">Rate(₹/g)</th><th class="text-right">Qty</th><th class="text-right">Price(₹)</th><th class="text-right">Total(₹)</th></tr></thead>
              <tbody>${itemsRows}</tbody>
            </table>
            <div class="totals">
              <div>Subtotal: ₹${Number(fullInvoice.subtotal).toLocaleString()}</div>
              <div>Making Charges: ₹${Number(fullInvoice.making_charges_total).toLocaleString()}</div>
              <div>Stone Charges: ₹${Number(fullInvoice.stone_charges_total).toLocaleString()}</div>
              <div>CGST: ₹${Number(fullInvoice.cgst_amount).toLocaleString()} | SGST: ₹${Number(fullInvoice.sgst_amount).toLocaleString()}</div>
              <div>Discount: ₹${Number(fullInvoice.discount_amount).toLocaleString()}</div>
              <div class="grand-total">Grand Total: ₹${Number(fullInvoice.grand_total).toLocaleString()}</div>
              <div>Paid: ₹${Number(fullInvoice.paid_amount).toLocaleString()}</div>
              <div>Due: ₹${Number(fullInvoice.due_amount).toLocaleString()}</div>
            </div>
            <div class="note-bg">* Rate includes making & stone charges</div>
            <div class="footer">Thank you for your business!<br>This is a computer generated invoice.</div>
          </div>
          <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Could not load invoice details for printing');
    }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Invoices</h1>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Invoice # or Customer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:text-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4 dark:text-gray-300">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4 dark:text-gray-300">No invoices found</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{inv.invoice_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{inv.customer?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{inv.invoice_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-200">₹{inv.grand_total.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600 dark:text-red-400">₹{inv.due_amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    <span className={`px-2 py-1 rounded text-xs ${
                      inv.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      inv.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>{inv.payment_status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => viewInvoice(inv.id)} className="text-blue-600 dark:text-blue-400"><FiEye size={18} /></button>
                    <button onClick={() => printInvoice(inv)} className="text-green-600 dark:text-green-400"><FiPrinter size={18} /></button>
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

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-white">Invoice Details</h2>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-500 dark:text-gray-400">
                <FiX size={24} />
              </button>
            </div>
            <div className="border-t pt-4">
              <p><strong className="dark:text-gray-300">Invoice #:</strong> <span className="dark:text-white">{selectedInvoice.invoice_number}</span></p>
              <p><strong className="dark:text-gray-300">Customer:</strong> <span className="dark:text-white">{selectedInvoice.customer.name} ({selectedInvoice.customer.mobile})</span></p>
              <p><strong className="dark:text-gray-300">Date:</strong> <span className="dark:text-white">{selectedInvoice.invoice_date}</span></p>
              <p><strong className="dark:text-gray-300">Status:</strong> <span className="capitalize dark:text-white">{selectedInvoice.payment_status}</span></p>
              <p><strong className="dark:text-gray-300">Total:</strong> <span className="dark:text-white">₹{selectedInvoice.grand_total}</span></p>
              <p><strong className="dark:text-gray-300">Paid:</strong> <span className="dark:text-white">₹{selectedInvoice.paid_amount}</span></p>
              <p><strong className="dark:text-gray-300">Due:</strong> <span className="dark:text-white text-red-600 font-semibold">₹{selectedInvoice.due_amount}</span></p>

              <h3 className="font-bold mt-4 dark:text-white">Items:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Item</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 dark:text-gray-200">{item.product.product_name}</td>
                        <td className="px-4 py-2 text-right dark:text-gray-200">{item.quantity}</td>
                        <td className="px-4 py-2 text-right dark:text-gray-200">₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment History */}
              <h3 className="font-bold mt-4 dark:text-white">Payment History</h3>
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Date</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.payments.map(p => (
                        <tr key={p.id}>
                          <td className="px-4 py-2 dark:text-gray-200">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-right dark:text-gray-200">₹{p.amount}</td>
                          <td className="px-4 py-2 dark:text-gray-200 capitalize">{p.payment_method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="dark:text-gray-400">No payments recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;