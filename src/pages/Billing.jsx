import { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosConfig';
import { getTodayRates } from '../api/rateApi';
import toast from 'react-hot-toast';
import { FiSearch, FiTrash2, FiPlus } from 'react-icons/fi';

const Billing = () => {
  // ---------- Customer ----------
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // ---------- Products ----------
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productInputRef = useRef(null);
  const productDropdownRef = useRef(null);

  // ---------- Cart & totals ----------
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [todayRates, setTodayRates] = useState({});

  // ---------- Manual item modal ----------
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualItem, setManualItem] = useState({
    product_name: '',
    category: 'Gold',
    weight: '',
    making_charges_per_gram: '',
    stone_charges_per_gram: '',
    gst_percent: 5,
  });

  // 👇 CHANGE THIS TO THE ID OF YOUR "Manual Item" PRODUCT (created once)
  const MANUAL_PRODUCT_ID = 4;  

  // ---------- Fetch today's rates ----------
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const rates = await getTodayRates();
        setTodayRates(rates);
      } catch (error) {
        console.error('Failed to fetch rates', error);
      }
    };
    fetchRates();
  }, []);

  // ---------- Fetch all products ----------
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

  const [manualProductId, setManualProductId] = useState(null);

  useEffect(() => {
    const fetchManualProduct = async () => {
      try {
        const res = await axios.get('/products', { params: { search: 'Manual Item' } });
        if (res.data.data.length > 0) {
          setManualProductId(res.data.data[0].id);
        } else {
          console.error('Manual Item product not found');
          toast.error('Please create a product named "Manual Item" for manual billing');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchManualProduct();
  }, []);

  // Filter products by search term
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

  // Click outside to close product dropdown
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

  // Helper: rate per gram from today's rates
  const getRatePerGram = (categoryName) => {
    const ratePer10gm = todayRates[categoryName]?.rate_per_10gm || 0;
    return ratePer10gm / 10;
  };

  // ---------- Regular product handlers ----------
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
    console.log('Rate per gram:', ratePerGram);
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, unit_price: dynamicPrice, rate_per_gram: ratePerGram }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        product_id: product.id,  // ✅ add this line
        ...product,
        quantity: 1,
        unit_price: dynamicPrice,
        rate_per_gram: ratePerGram,
        making_charges_per_gram: product.making_charges_per_gram,
        stone_charges_per_gram: product.stone_charges_per_gram,
        gst_percent: product.gst_percent,
        weight: product.weight
      }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
    toast.success(`${product.product_name} added (₹${dynamicPrice})`);
  };

  // ---------- Manual item handlers ----------
  const openManualModal = () => {
    setManualItem({
      product_name: '',
      category: 'Gold',
      weight: '',
      making_charges_per_gram: '',
      stone_charges_per_gram: '',
      gst_percent: 5,
    });
    setShowManualModal(true);
  };

  const handleManualInputChange = (e) => {
    const { name, value } = e.target;
    setManualItem(prev => ({ ...prev, [name]: value }));
  };

  const calculateManualPrice = () => {
    const ratePerGram = getRatePerGram(manualItem.category);
    const making = parseFloat(manualItem.making_charges_per_gram) || 0;
    const stone = parseFloat(manualItem.stone_charges_per_gram) || 0;
    const weight = parseFloat(manualItem.weight) || 0;
    return (ratePerGram + making + stone) * weight;
  };

  const addManualItemToCart = () => {
    if (!manualItem.product_name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!manualItem.weight || parseFloat(manualItem.weight) <= 0) {
      toast.error('Valid weight is required');
      return;
    }
    const ratePerGram = getRatePerGram(manualItem.category);
    const making = parseFloat(manualItem.making_charges_per_gram) || 0;
    const stone = parseFloat(manualItem.stone_charges_per_gram) || 0;
    const weight = parseFloat(manualItem.weight);
    const unitPrice = (ratePerGram + making + stone) * weight;
    const gstPercent = parseFloat(manualItem.gst_percent) || 0;

    const manualCartItem = {
      id: `manual_${Date.now()}_${Math.random()}`,     // unique frontend key
      product_id: MANUAL_PRODUCT_ID,                   // 👈 backend expects this
      product_name: manualItem.product_name,
      category_name: manualItem.category,
      category: { name: manualItem.category },
      weight: parseFloat(manualItem.weight),
      rate_per_gram: ratePerGram,
      making_charges_per_gram: making,
      stone_charges_per_gram: stone,
      gst_percent: gstPercent,
      unit_price: unitPrice,
      quantity: 1,
    };

    setCart([...cart, manualCartItem]);
    setShowManualModal(false);
    toast.success('Manual item added to cart');
  };

  // ---------- Cart helpers ----------
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart(prevCart => prevCart.map(item =>
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
    let makingRate = 0;
    let stoneRate = 0;

    cart.forEach(item => {
      const weight = item.weight || 0;
      const makingPerGram = item.making_charges_per_gram || 0;
      const stonePerGram = item.stone_charges_per_gram || 0;
      const totalWeight = weight * item.quantity;

      const itemTotal = item.unit_price * item.quantity;
      subtotal += itemTotal;
      totalMaking += makingPerGram * totalWeight;
      totalStone += stonePerGram * totalWeight;
      totalGST += itemTotal * (item.gst_percent / 100);

      // Capture rates from first item (assuming they are same across cart)
      if (!makingRate) makingRate = makingPerGram;
      if (!stoneRate) stoneRate = stonePerGram;
    });

    const discountAmount = discountType === 'percentage'
      ? subtotal * (discountValue / 100)
      : discountValue;

    let grandTotal = subtotal + totalGST - discountAmount;
    const roundOff = Math.round(grandTotal) - grandTotal;
    grandTotal = Math.round(grandTotal);
    const due = grandTotal - paidAmount;

    return {
      subtotal,
      totalMaking,
      totalStone,
      totalGST,
      discountAmount,
      roundOff,
      grandTotal,
      due,
      makingRate,
      stoneRate,
      paymentStatus: due <= 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid')
    };
  };

  const totals = calculateTotals();

  // ---------- Print invoice ----------
  const printInvoice = (invoice) => {
    if (!invoice) {
      toast.error('No invoice data to print');
      return;
    }
    if (!invoice.items || invoice.items.length === 0) {
      toast.error('Invoice has no items');
      return;
    }

    console.log("In voive Details--->",invoice);
    

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    // Build rates HTML safely
    let ratesHtml = '';
    if (invoice.rates_snapshot) {
      try {
        const rates = JSON.parse(invoice.rates_snapshot);
        ratesHtml = `<div class="rates-section"><strong>Today's Rates (per 10g):</strong><br/>${Object.entries(rates).map(([cat, rate]) => `${cat}: ₹${rate || '—'}`).join(' &nbsp;&nbsp; ')}</div>`;
      } catch (e) { console.error('Invalid rates snapshot'); }
    }

    // Build items rows
    
    const itemsRows = invoice.items.map((item, idx) => {
      const weight = item.weight || item.product?.weight || 0;
      const ratePerGram = weight > 0 ? (item.unit_price / weight).toFixed(2) : '—';
      const productName = item.product_name || item.product?.product_name || 'Manual Item';
      // const category = item.product?.category?.name || '—';
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

    const customerName = invoice.customer?.name || 'N/A';
    const customerMobile = invoice.customer?.mobile || 'N/A';

    // Write the HTML to the print window
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>Invoice ${invoice.invoice_number}</title>
    <style>
      
      @page {
        size: A5;
        margin: 1cm;
      }

      thead {
        display: table-header-group;
      }

      table {
        page-break-inside: avoid;
        width: 100%;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
        
      *{box-sizing:border-box} body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:20px;font-size:14px}
      .invoice-container{max-width:800px;margin:0 auto;background:#fff;padding:20px;border:1px solid #ddd}
      .header{text-align:center;border-bottom:2px solid #8B4513}
      .shop-name{font-size:32px;font-weight:bold;color:#8B4513}
      .tagline{font-size:12px;color:#555}
      .invoice-title{font-size:18px;font-weight:bold;margin-top:5px}
      .customer-info{margin:15px 0;padding:10px;background:#f9f9f9}
      .rates-section{margin:15px 0;padding:10px;background:#f0f7ff;text-align:center}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      .text-right{text-align:right}
      .totals{text-align:right;margin-top:20px;border-top:1px solid #ddd;padding-top:10px}
      .grand-total{font-size:18px;font-weight:bold;margin-top:10px}
      .footer{text-align:center;margin-top:10px;font-size:12px;color:#777}
      @media print {
        body { margin: 0; padding: 0; }
        .invoice-container { border: none; padding: 0; }
        .note-bg {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="shop-name">💎 AMBIKA JEWELLERS</div>
          <div class="tagline">Since 1985 | Trust & Quality</div>
          <div class="address" style="font-size: 12px; color: #555; margin-top: 5px;">
            Saraswati nagar, Near Rasbihari Int. School, Meri Link Road, Panchavti, Nashik-422003.
          </div>
          <div class="invoice-title">TAX INVOICE</div>
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <span>Invoice #: ${invoice.invoice_number}</span>
            <span>Date: ${invoice.invoice_date}</span>
          </div>
        </div>
        <div class="note-bg" style="background-color: #e3f5fd; padding: 8px; margin-top: 15px; border-radius: 4px;">
          <div style="font-size: 14px;">
            <strong>Customer:</strong> ${invoice.customer.name}<br>
            <strong>Mobile:</strong> ${invoice.customer.mobile}
          </div>
          <div style="font-size: 10px; color: #555; margin-top: 5px;">
            ${invoice.customer.address ? `<strong>Address:</strong> ${invoice.customer.address}<br>` : ''}
            ${invoice.customer.gst_number ? `<strong>GST:</strong> ${invoice.customer.gst_number}` : ''}
          </div>
        </div>
        <div class="note-bg" style="background-color: #d8d8d8; margin-top: 10px; font-size: 10px; text-align: center; border-radius: 4px;">
        ${ratesHtml}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Category</th>
              <th class="text-right">Weight(g)</th>
              <th class="text-right">Rate(₹/g)</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price(₹)</th>
              <th class="text-right">Total(₹)</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div class="totals">
          <div>Subtotal: ₹${Number(invoice.subtotal).toLocaleString()}</div>
          <div>Making Charges: ₹${totals.totalMaking.toFixed(2)}</div>
          <div>Stone Charges: ₹${totals.totalStone.toFixed(2)}</div>
          <div>CGST: ₹${Number(invoice.cgst_amount).toLocaleString()} | SGST: ₹${Number(invoice.sgst_amount).toLocaleString()}</div>
          <div>Discount: ₹${Number(invoice.discount_amount).toLocaleString()}</div>
          <div class="grand-total">Grand Total: ₹${Number(invoice.grand_total).toLocaleString()}</div>
          <div>Paid: ₹${Number(invoice.paid_amount).toLocaleString()}</div>
          <div>Due: ₹${Number(invoice.due_amount).toLocaleString()}</div>
        </div>
        <div class="note-bg" style="background-color: #eef2f5; padding: 8px; font-size: 12px; text-align: center; border-radius: 4px;">
          * Rate includes making & stone charges
        </div>
        <div class="footer">Thank you for your business!<br>This is a computer generated invoice.</div>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
    printWindow.document.close();
  };

  // ---------- Create invoice ----------
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
      product_id: item.product_id,
      product_name: item.product_name,   // 👈 required for manual items
      category_name: item.category_name || item.category?.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      weight: item.weight,
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

      // ✅ Correctly extract invoice id
      const invoiceId = response.data.invoice.id;
      const shouldPrint = window.confirm('Print invoice?');

      if (shouldPrint) {
        try {
          const fullInvoiceRes = await axios.get(`/invoices/${invoiceId}`);
          printInvoice(fullInvoiceRes.data);
        } catch (printErr) {
          console.error('Print error:', printErr);
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
      console.error('Invoice creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'partial'
  useEffect(() => {
  if (paymentMode === 'full') {
    setPaidAmount(totals.grandTotal);
  }
}, [totals.grandTotal, paymentMode]);

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
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
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2"
              />
              {showCustomerDropdown && customerSearch.length > 1 && (
                <div className="absolute z-10 w-full bg-white dark:bg-gray-800 dark:text-white border rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {customers.map(customer => (
                    <div key={customer.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => { setSelectedCustomer(customer); setCustomerSearch(customer.name); setShowCustomerDropdown(false); }}>
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

          {/* Product Selection + Manual Item button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Add Products</h2>
              <button
                onClick={openManualModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
              >
                <FiPlus size={16} /> Add Manual Item
              </button>
            </div>
            <div className="relative" ref={productDropdownRef}>
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                ref={productInputRef}
                type="text"
                placeholder="Click to see all products or type to search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onFocus={() => setShowProductDropdown(true)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2"
              />
              {showProductDropdown && (
                <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No products found</div>
                  ) : (
                    filteredProducts.map(product => {
                      const dynamicPrice = calculateDynamicPrice(product);
                      return (
                        <div key={product.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                          onClick={() => addToCart(product)}>
                          <div>
                            <span className="font-medium dark:text-white">{product.product_name}</span>
                            <span className="text-xs text-gray-500 ml-2">Stock: {product.stock_quantity}</span>
                          </div>
                          <span className="font-semibold dark:text-white">₹{dynamicPrice.toFixed(2)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Price is calculated using today's market rate.</p>
          </div>

          {/* Cart Table */}
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
                      <th className="py-2 text-right">Weight (g)</th>
                      <th className="py-2 text-right">Rate (₹/g)</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-2 dark:text-white">{item.product_name}</td>
                        <td className="py-2 dark:text-gray-300">{item.category?.name || '—'}</td>
                        <td className="py-2 text-right dark:text-white">{item.weight || 0}</td>
                        <td className="py-2 text-right dark:text-white">₹{item.rate_per_gram?.toFixed(2)}</td>
                        <td className="py-2 text-right">
                          <input type="number" value={item.quantity} onChange={e => updateQuantity(item.id, e.target.value)} className="w-20 border rounded px-2 py-1 text-right dark:bg-gray-700 dark:text-white" min="1" />
                        </td>
                        <td className="py-2 text-right dark:text-white">₹{item.unit_price.toFixed(2)}</td>
                        <td className="py-2 text-right dark:text-white">₹{(item.unit_price * item.quantity).toFixed(2)}</td>
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

        {/* Right panel – Bill Summary & Payment */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Bill Summary</h2>
            <div className="space-y-2 dark:text-gray-300">
              <div className="flex justify-between"><span>Subtotal:</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between">
                <span>Making Charges:</span>
                <span>₹{totals.totalMaking.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stone Charges:</span>
                <span>₹{totals.totalStone.toFixed(2)}</span>
              </div>
              <div className="flex justify-between"><span>GST:</span><span>₹{totals.totalGST.toFixed(2)}</span></div>
              <div className="flex justify-between items-center">
                <span>Discount:</span>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value)}
                    className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="percentage">%</option>
                    <option value="flat">₹</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-28 border rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                    placeholder={discountType === 'flat' ? 'Amount' : 'Percent'}
                  />
                </div>
              </div>
              <div className="flex justify-between"><span>Round Off:</span><span>₹{totals.roundOff.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 dark:text-white">
                <span>Grand Total:</span><span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Payment</h2>
            <div className="space-y-4">
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2"
              >
                <option value="full">Full Payment (Paid All)</option>
                <option value="partial">Partial Payment</option>
              </select>

              <input
                type="number"
                placeholder="Paid Amount"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                disabled={paymentMode === 'full'}
                className={`w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:text-white ${
                  paymentMode === 'full'
                    ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed'
                    : 'dark:bg-gray-700'
                }`}
              />

              <div className="flex justify-between dark:text-gray-300">
                <span>Due Amount:</span>
                <span className="font-bold text-red-600 dark:text-red-400">₹{totals.due.toFixed(2)}</span>
              </div>

              <div className="flex justify-between dark:text-gray-300">
                <span>Status:</span>
                <span className="capitalize font-semibold">{totals.paymentStatus}</span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Item Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Add Manual Item</h2>
              <button onClick={() => setShowManualModal(false)} className="text-gray-500 dark:text-gray-400 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Product Name *</label>
                <input type="text" name="product_name" value={manualItem.product_name} onChange={handleManualInputChange}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Category *</label>
                <select name="category" value={manualItem.category} onChange={handleManualInputChange}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white">
                  <option value="Gold">Gold</option><option value="Silver">Silver</option><option value="Diamond">Diamond</option><option value="Platinum">Platinum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Weight (grams) *</label>
                <input type="number" step="0.001" name="weight" value={manualItem.weight} onChange={handleManualInputChange}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Making Charges (₹/gram)</label>
                <input type="number" step="0.01" name="making_charges_per_gram" value={manualItem.making_charges_per_gram} onChange={handleManualInputChange}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Stone Charges (₹/gram)</label>
                <input type="number" step="0.01" name="stone_charges_per_gram" value={manualItem.stone_charges_per_gram} onChange={handleManualInputChange}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">GST %</label>
                <input type="number" step="0.01" name="gst_percent" value={manualItem.gst_percent} onChange={handleManualInputChange}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-right">
                <span className="font-semibold dark:text-white">Calculated Price: </span>
                <span className="dark:text-white">₹{calculateManualPrice().toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowManualModal(false)} className="px-4 py-2 border rounded dark:text-gray-300">Cancel</button>
              <button onClick={addManualItemToCart} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add to Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;