import { AnalyticsData, DateFilterType } from './analyticsService';
// @ts-ignore
import html2pdf from 'html2pdf.js';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSalesCSV(data: AnalyticsData, filter: DateFilterType) {
  const headers = ['Date', 'Revenue (INR)', 'Completed Orders', 'Average Order Value (INR)'];
  const rows = data.dailySales.map(d => [
    d.date,
    d.revenue.toFixed(2),
    d.orders.toString(),
    d.orders > 0 ? (d.revenue / d.orders).toFixed(2) : '0.00',
  ]);

  const csvContent = [
    `# Scanova Retail Sales Report - Period: ${filter.toUpperCase()}`,
    `# Generated At: ${new Date().toLocaleString()}`,
    `# Total Revenue: Rs. ${data.salesMetrics.totalRevenue}`,
    `# Total Orders: ${data.salesMetrics.totalOrders}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n');

  downloadFile(csvContent, `scanova_sales_report_${filter}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportProductPerformanceCSV(data: AnalyticsData, filter: DateFilterType) {
  const headers = [
    'Product ID',
    'Product Name',
    'Brand',
    'Category',
    'Quantity Sold',
    'Revenue Generated (INR)',
    'Average Selling Price (INR)',
    'Current Stock Level',
    'Zero Sales Flag',
    'Demand Trend',
  ];

  const rows = data.productPerformance.map(p => [
    p.id,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.brand}"`,
    `"${p.category}"`,
    p.quantitySold.toString(),
    p.revenue.toFixed(2),
    p.averagePrice.toFixed(2),
    p.stock.toString(),
    p.isZeroSales ? 'Yes' : 'No',
    p.demandTrend,
  ]);

  const csvContent = [
    `# Scanova Product Performance Report - Period: ${filter.toUpperCase()}`,
    `# Generated At: ${new Date().toLocaleString()}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n');

  downloadFile(csvContent, `scanova_product_performance_${filter}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportCustomerAnalyticsCSV(data: AnalyticsData, filter: DateFilterType) {
  const headers = [
    'Customer ID',
    'Username',
    'Email Address',
    'Member Since',
    'Total Completed Orders',
    'Total Lifetime Spend (INR)',
    'Average Order Value (INR)',
    'Last Order Date',
    'RFM Customer Segment',
  ];

  const rows = data.customerHistory.map(c => [
    c.id,
    `"${c.username.replace(/"/g, '""')}"`,
    `"${c.email}"`,
    c.createdAt,
    c.totalOrders.toString(),
    c.totalSpent.toFixed(2),
    c.avgOrderValue.toFixed(2),
    c.lastOrderDate || 'No Orders',
    `"${c.segment}"`,
  ]);

  const csvContent = [
    `# Scanova Customer Analytics Report - Period: ${filter.toUpperCase()}`,
    `# Generated At: ${new Date().toLocaleString()}`,
    `# Total Customers: ${data.customerMetrics.totalRegisteredCustomers}`,
    `# Active Buyers: ${data.customerMetrics.activePurchasingCustomers}`,
    `# Repeat Customer Rate: ${data.customerMetrics.repeatCustomerRate}%`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n');

  downloadFile(csvContent, `scanova_customer_analytics_${filter}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportSalesSummaryPDF(containerId: string, filterName: string) {
  const element = document.getElementById(containerId);
  if (!element) {
    alert('Unable to generate PDF report element.');
    return;
  }

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `scanova_sales_summary_report_${filterName}_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0a1a' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error('PDF Export failed:', err);
    alert('Could not export PDF report. Falling back to browser print.');
    window.print();
  }
}
