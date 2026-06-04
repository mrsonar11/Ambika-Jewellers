import { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosConfig';
import { getTodayRates } from '../api/rateApi';
import toast from 'react-hot-toast';
import { FiSearch, FiTrash2 } from 'react-icons/fi';
import LiveRates from '../components/LiveRates';

const Billing = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productInputRef = useRef(null);
  const productDropdownRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [todayRates, setTodayRates] = useState({});

  // Fetch today's rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const rates = await getTodayRates();
        setTodayRates(rates);
      } catch (error) {
        console.error('Failed to fetch today\'s rates', error);
      }
    };
    fetchRates();
  }, []);

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/products', { params: { page: 1, limit: 100 } });
        setAllProducts(res.data.data);
        setFilteredProducts(res.data.data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    };
    fetchProducts();
  }, []);

  // Filter products by search term locally
  useEffect(() => {
    if (productSearch.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(p =>
        p.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.barcode_sku && p.barcode_sku.toLowerCase().includes(productSearch.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [productSearch, allProducts]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search customers
  useEffect(() => {
    if (customerSearch.length > 1) {
      axios.get('/customers', { params: { search: customerSearch } })
        .then(res => setCustomers(res.data.data))
        .catch(err => console.error(err));
    }
  }, [customerSearch]);

  const getRatePerGram = (categoryName) => {
    const ratePer10gm = todayRates[categoryName]?.rate_per_10gm || 0;
    return ratePer10gm / 10;
  };

  const calculateDynamicPrice = (product) => {
    const ratePerGram = getRatePerGram(product.category?.name || 'Gold');
    const makingPerGram = product.making_charges_per_gram || 0;
    const stonePerGram = product.stone_charges_per_gram || 0;
    const weight = product.weight || 0;
    const basePrice = (ratePerGram + makingPerGram + stonePerGram) * weight;
    return parseFloat(basePrice.toFixed(2));
  };

  const addToCart = (product) => {
    const dynamicPrice = calculateDynamicPrice(product);
    const ratePerGram = getRatePerGram(product.category?.name || 'Gold');
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, unit_price: dynamicPrice, rate_per_gram: ratePerGram }
          : item
      ));
    } else {
      setCart([...cart, {
        ...product,
        quantity: 1,
        unit_price: dynamicPrice,
        rate_per_gram: ratePerGram,
        making_charges_per_gram: product.making_charges_per_gram,
        stone_charges_per_gram: product.stone_charges_per_gram,
        gst_percent: product.gst_percent,
        weight: product.weight   // <-- add this line
      }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
    toast.success(`${product.product_name} added (₹${dynamicPrice})`);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: parseInt(quantity) } : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalMaking = 0;
    let totalStone = 0;
    let totalGST = 0;

    cart.forEach(item => {
      const itemTotal = item.unit_price * item.quantity;
      subtotal += itemTotal;
      totalMaking += (item.making_charges_per_gram || 0) * item.quantity;
      totalStone += (item.stone_charges_per_gram || 0) * item.quantity;
      totalGST += (itemTotal + (item.making_charges_per_gram || 0) * item.quantity + (item.stone_charges_per_gram || 0) * item.quantity) * (item.gst_percent / 100);
    });

    const taxableAmount = subtotal + totalMaking + totalStone;
    const discountAmount = discountType === 'percentage'
      ? (taxableAmount + totalGST) * (discountValue / 100)
      : discountValue;

    let grandTotal = taxableAmount + totalGST - discountAmount;
    const roundOff = Math.round(grandTotal) - grandTotal;
    grandTotal = Math.round(grandTotal);

    const due = grandTotal - paidAmount;

    return {
      subtotal,
      totalMaking,
      totalStone,
      totalGST,
      taxableAmount,
      discountAmount,
      roundOff,
      grandTotal,
      due,
      paymentStatus: due <= 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid')
    };
  };

  const totals = calculateTotals();

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    // Format rates snapshot (if available)
    let ratesHtml = '';
    if (invoice.rates_snapshot) {
      const rates = JSON.parse(invoice.rates_snapshot);
      ratesHtml = `
            <div class="rates-section">
              <strong>Today's Rates (per 10g):</strong><br/>
              ${Object.entries(rates)
          .map(([cat, rate]) => `${cat}: ₹${rate || '—'}`)
          .join(' &nbsp;&nbsp; ')}
            </div>
          `;
    }

    printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice ${invoice.invoice_number}</title>
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: 'Segoe UI', Arial, sans-serif;
                margin: 0;
                padding: 20px;
                font-size: 14px;
                line-height: 1.4;
              }
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border: 1px solid #ddd;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #8B4513;
              }
              .shop-name {
                font-size: 28px;
                font-weight: bold;
                font-family: 'Georgia', serif;
                color: #8B4513;
                margin: 5px 0;
              }
              .tagline {
                font-size: 12px;
                color: #555;
              }
              .invoice-title {
                font-size: 18px;
                font-weight: bold;
                margin-top: 5px;
              }
              .customer-info {
                margin: 15px 0;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 5px;
              }
              .rates-section {
                margin: 15px 0;
                padding: 10px;
                background: #f0f7ff;
                font-size: 13px;
                text-align: center;
                border-radius: 5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background-color: #f2f2f2;
                font-weight: 600;
              }
              .text-right {
                text-align: right;
              }
              .totals {
                text-align: right;
                margin-top: 20px;
                border-top: 1px solid #ddd;
                padding-top: 10px;
              }
              .totals div {
                margin: 5px 0;
              }
              .grand-total {
                font-size: 18px;
                font-weight: bold;
                margin-top: 10px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #777;
                border-top: 1px solid #eee;
                padding-top: 10px;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .invoice-container { border: none; padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <!-- Replace this div with your logo image if you have a Base64 version -->
                <div class="shop-name">💎 AMBIKA JEWELLERS</div>
                <div class="tagline">Since 1985 | Trust & Quality</div>
                <div class="invoice-title">TAX INVOICE</div>
                <div>Invoice #: ${invoice.invoice_number}</div>
                <div>Date: ${invoice.invoice_date}</div>
              </div>

              <div class="customer-info">
                <strong>Customer:</strong> ${invoice.customer.name}<br>
                <strong>Mobile:</strong> ${invoice.customer.mobile}<br>
                ${invoice.customer.gst_number ? `<strong>GST:</strong> ${invoice.customer.gst_number}<br>` : ''}
              </div>

              ${ratesHtml}

              <table>
                 <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th class="text-right">Weight (g)</th>
                      <th class="text-right">Rate (₹/g)</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Price (₹)</th>
                      <th class="text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.items.map(item => {
                      const weight = item.product.weight || 0;
                      const ratePerGram = weight > 0 ? (item.unit_price / weight).toFixed(2) : '—';
                      return `
                        <tr>
                          <td>${item.product.product_name}</td>
                          <td>${item.product.category?.name || '—'}</td>
                          <td class="text-right">${weight}</td>
                          <td class="text-right">${ratePerGram}</td>
                          <td class="text-right">${item.quantity}</td>
                          <td class="text-right">${Number(item.unit_price).toLocaleString()}</td>
                          <td class="text-right">${Number(item.total).toLocaleString()}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
              </table>

              <div class="totals">
                <div>Subtotal: ₹${Number(invoice.subtotal).toLocaleString()}</div>
                <div>Making Charges: ₹${Number(invoice.making_charges_total).toLocaleString()}</div>
                <div>Stone Charges: ₹${Number(invoice.stone_charges_total).toLocaleString()}</div>
                <div>CGST: ₹${Number(invoice.cgst_amount).toLocaleString()} | SGST: ₹${Number(invoice.sgst_amount).toLocaleString()}</div>
                <div>Discount: ₹${Number(invoice.discount_amount).toLocaleString()}</div>
                <div class="grand-total">Grand Total: ₹${Number(invoice.grand_total).toLocaleString()}</div>
                <div>Paid: ₹${Number(invoice.paid_amount).toLocaleString()}</div>
                <div>Due: ₹${Number(invoice.due_amount).toLocaleString()}</div>
              </div>

              <div class="footer">
                Thank you for your business!<br>
                This is a computer generated invoice.
              </div>
            </div>
            <script>window.print();</script>
          </body>
          </html>
        `);
    printWindow.document.close();
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (paidAmount < 0) {
      toast.error('Invalid paid amount');
      return;
    }

    setSubmitting(true);
    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      making_charges_total: (item.making_charges_per_gram || 0) * item.quantity,
      stone_charges_total: (item.stone_charges_per_gram || 0) * item.quantity,
      gst_percent: item.gst_percent
    }));

    try {
      const response = await axios.post('/invoices', {
        customer_id: selectedCustomer.id,
        items,
        payment_method: paymentMethod,
        paid_amount: paidAmount,
        discount_type: discountType,
        discount_value: discountValue
      });

      toast.success('Invoice created successfully!');

      const shouldPrint = window.confirm('Print invoice?');
      if (shouldPrint) {
        try {
          const invoiceId = response.data.invoice.id;
          const fullInvoiceRes = await axios.get(`/invoices/${invoiceId}`);
          printInvoice(fullInvoiceRes.data);
        } catch (printErr) {
          toast.error('Could not load invoice for printing');
        }
      }

      // Reset form
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setDiscountValue(0);
      setPaidAmount(0);
      setPaymentMethod('cash');

    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <LiveRates />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Customer Details</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer by name or mobile"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              {showCustomerDropdown && customerSearch.length > 1 && (
                <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {customers.map(customer => (
                    <div
                      key={customer.id}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200"
                      onClick={() => { setSelectedCustomer(customer); setCustomerSearch(customer.name); setShowCustomerDropdown(false); }}
                    >
                      {customer.name} - {customer.mobile}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-gray-800 dark:text-white"><strong>{selectedCustomer.name}</strong></p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedCustomer.mobile}</p>
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add Products</h2>
            <div className="relative" ref={productDropdownRef}>
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                ref={productInputRef}
                type="text"
                placeholder="Click to see all products or type to search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onFocus={() => setShowProductDropdown(true)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              {showProductDropdown && (
                <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No products found</div>
                  ) : (
                    filteredProducts.map(product => {
                      const dynamicPrice = calculateDynamicPrice(product);
                      return (
                        <div
                          key={product.id}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                          onClick={() => addToCart(product)}
                        >
                          <div>
                            <span className="font-medium text-gray-800 dark:text-white">{product.product_name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Stock: {product.stock_quantity}</span>
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-white">₹{dynamicPrice.toFixed(2)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Price is calculated using today's market rate.</p>
          </div>

          {/* Cart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Cart</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No items in cart</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr className="text-gray-700 dark:text-gray-300">
                      <th className="py-2 text-left">Product</th>
                      <th className="py-2 text-left">Category</th>
                      <th className="py-2 text-left">Weight (g)</th>
                      <th className="py-2 text-left">Rate (₹/g)</th>
                      <th className="py-2 text-left">Qty</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-2 text-gray-800 dark:text-white">{item.product_name}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{item.category?.name || '—'}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{item.weight || '—'}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">₹{item.rate_per_gram?.toFixed(2)}</td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateQuantity(item.id, e.target.value)}
                            className="w-20 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1"
                            min="1"
                          />
                        </td>
                        <td className="py-2 text-right text-gray-800 dark:text-white">₹{item.unit_price.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-800 dark:text-white">₹{(item.unit_price * item.quantity).toFixed(2)}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-800 dark:text-red-400">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right panel – Totals & Payment */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Bill Summary</h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <div className="flex justify-between"><span>Subtotal:</span><span className="font-mono">₹{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Making Charges:</span><span className="font-mono">₹{totals.totalMaking.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Stone Charges:</span><span className="font-mono">₹{totals.totalStone.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>GST:</span><span className="font-mono">₹{totals.totalGST.toFixed(2)}</span></div>
              <div className="flex justify-between items-center">
                <span>Discount:</span>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1"
                  >
                    <option value="percentage">%</option>
                    <option value="flat">₹</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1"
                  />
                </div>
              </div>
              <div className="flex justify-between"><span>Round Off:</span><span className="font-mono">₹{totals.roundOff.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 text-gray-900 dark:text-white">
                <span>Grand Total:</span><span className="font-mono">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Payment</h2>
            <div className="space-y-4">
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="mixed">Mixed</option>
              </select>
              <input
                type="number"
                placeholder="Paid Amount"
                value={paidAmount}
                onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2"
              />
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Due Amount:</span>
                <span className="font-bold text-red-600 dark:text-red-400">₹{totals.due.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Status:</span>
                <span className="capitalize font-semibold">{totals.paymentStatus}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Processing...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;