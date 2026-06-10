import { useState } from 'react';
import axios from '../api/axiosConfig';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      if (reportType === 'daily') url = `/reports/daily?date=${date}`;
      else if (reportType === 'monthly') url = `/reports/monthly?month=${month}`;
      else if (reportType === 'product-sales') url = '/reports/product-sales';
      else if (reportType === 'gst') url = `/reports/gst?from=${date}&to=${date}`;
      else if (reportType === 'profit') url = '/reports/profit';
      
      const res = await axios.get(url);
      setData(res.data);
    } catch (error) {
      toast.error('Failed to fetch report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!data) return;
    let worksheet;
    if (reportType === 'daily' && data.invoices) {
      worksheet = XLSX.utils.json_to_sheet(data.invoices);
    } else if (reportType === 'product-sales' && Array.isArray(data)) {
      worksheet = XLSX.utils.json_to_sheet(data);
    } else if (reportType === 'monthly') {
      worksheet = XLSX.utils.json_to_sheet([{ month: data.month, total_sales: data.total_sales }]);
    } else if (reportType === 'gst') {
      worksheet = XLSX.utils.json_to_sheet([{
        'Period From': data.from,
        'Period To': data.to,
        'Total CGST': data.gst?.total_cgst || 0,
        'Total SGST': data.gst?.total_sgst || 0,
        'Total GST': data.gst?.total_gst || 0
      }]);
    } else {
      worksheet = XLSX.utils.json_to_sheet([data]);
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().slice(0,19)}.xlsx`);
  };

  const renderReport = () => {
    if (!data) return <div className="text-gray-500 dark:text-gray-400 mt-4">No data. Click Generate.</div>;

    switch (reportType) {
      case 'daily':
        return (
          <div>
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded mb-4">
              <h3 className="text-lg font-bold dark:text-white">Summary</h3>
              <p className="dark:text-gray-200"><strong>Date:</strong> {data.date}</p>
              <p className="dark:text-gray-200"><strong>Total Sales:</strong> ₹{parseFloat(data.total_sales).toLocaleString()}</p>
              <p className="dark:text-gray-200"><strong>Number of Invoices:</strong> {data.invoices?.length || 0}</p>
            </div>
            {data.invoices && data.invoices.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 border dark:text-white">Invoice #</th>
                      <th className="p-2 border dark:text-white">Customer</th>
                      <th className="p-2 border dark:text-white">Date</th>
                      <th className="p-2 border dark:text-white text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map(inv => (
                      <tr key={inv.id}>
                        <td className="p-2 border dark:text-gray-200">{inv.invoice_number}</td>
                        <td className="p-2 border dark:text-gray-200">{inv.customer?.name || 'N/A'}</td>
                        <td className="p-2 border dark:text-gray-200">{inv.invoice_date}</td>
                        <td className="p-2 border dark:text-gray-200 text-right">₹{parseFloat(inv.grand_total || inv.subtotal).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'monthly':
        return (
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
            <h3 className="text-lg font-bold dark:text-white">Monthly Sales</h3>
            <p className="dark:text-gray-200"><strong>Month:</strong> {data.month}</p>
            <p className="dark:text-gray-200"><strong>Total Sales:</strong> ₹{parseFloat(data.total_sales).toLocaleString()}</p>
          </div>
        );
      case 'product-sales':
        if (!Array.isArray(data) || data.length === 0) return <p className="dark:text-gray-200">No product sales data.</p>;
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 border dark:text-white">Product</th>
                  <th className="p-2 border dark:text-white text-right">Quantity Sold</th>
                  <th className="p-2 border dark:text-white text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.product_id}>
                    <td className="p-2 border dark:text-gray-200">{item.product?.product_name || 'Product'}</td>
                    <td className="p-2 border dark:text-gray-200 text-right">{item.total_qty}</td>
                    <td className="p-2 border dark:text-gray-200 text-right">₹{parseFloat(item.total_amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'gst':
        return (
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
            <h3 className="text-lg font-bold dark:text-white">GST Report</h3>
            <p className="dark:text-gray-200"><strong>Period:</strong> {data.from} to {data.to}</p>
            <p className="dark:text-gray-200"><strong>Total CGST:</strong> ₹{parseFloat(data.gst?.total_cgst || 0).toLocaleString()}</p>
            <p className="dark:text-gray-200"><strong>Total SGST:</strong> ₹{parseFloat(data.gst?.total_sgst || 0).toLocaleString()}</p>
            <p className="dark:text-gray-200"><strong>Total GST:</strong> ₹{parseFloat(data.gst?.total_gst || 0).toLocaleString()}</p>
          </div>
        );
      case 'profit':
        return (
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded">
            <h3 className="text-lg font-bold dark:text-white">Profit Report</h3>
            <p className="dark:text-gray-200"><strong>Total Profit:</strong> ₹{parseFloat(data.profit || 0).toLocaleString()}</p>
          </div>
        );
      default:
        return <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded dark:text-gray-200">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <div className="dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Reports</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Report Type</label>
            <select value={reportType} onChange={e=>setReportType(e.target.value)} className="mt-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2">
              <option value="daily">Daily Sales</option>
              <option value="monthly">Monthly Sales</option>
              <option value="product-sales">Product Sales</option>
              <option value="gst">GST Report</option>
              <option value="profit">Profit Report</option>
            </select>
          </div>
          {(reportType === 'daily' || reportType === 'gst') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2" />
            </div>
          )}
          {reportType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
              <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="mt-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-4 py-2" />
            </div>
          )}
          <button onClick={fetchReport} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mt-1">Generate</button>
          {data && <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded mt-1">Export Excel</button>}
        </div>
        {loading && <p className="text-center dark:text-gray-300">Loading...</p>}
        <div className="mt-6">{renderReport()}</div>
      </div>
    </div>
  );
};

export default Reports;