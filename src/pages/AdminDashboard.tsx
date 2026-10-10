import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Download,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  BrainCircuit,
  PieChart as PieChartIcon,
  Layers,
  Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DateFilterBar from '../components/admin/DateFilterBar';
import ThemeSelector from '../components/ThemeSelector';
import {
  fetchAdminAnalytics,
  AnalyticsData,
  DateFilterType,
} from '../services/analyticsService';
import {
  exportSalesCSV,
  exportProductPerformanceCSV,
  exportCustomerAnalyticsCSV,
  exportSalesSummaryPDF,
} from '../services/reportExportService';
import {
  DailySalesChart,
  BestSellingProductsChart,
  CategorySalesChart,
  MonthlySalesChart,
  CustomerGrowthChart,
  SalesForecastChart,
} from '../components/admin/AnalyticsCharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'customers' | 'ml'>('sales');

  const [dateFilter, setDateFilter] = useState<DateFilterType>('last30days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminAnalytics(dateFilter, customStart, customEnd, selectedCategory);
      setData(res);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError('Failed to load database analytics. Please check Supabase connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateFilter, customStart, customEnd, selectedCategory]);

  const handleExportPDF = () => {
    exportSalesSummaryPDF('admin-dashboard-container', dateFilter);
  };

  const filteredCustomerHistory = data?.customerHistory.filter(c =>
    c.username.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.segment.toLowerCase().includes(customerSearchTerm.toLowerCase())
  ) || [];

  const filteredProductsList = data?.productPerformance.filter(p =>
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  ) || [];

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-scanova-bg text-scanova-text pb-20 transition-colors duration-200">
      {/* Top Header */}
      <div className="sticky top-0 z-40 glass-strong px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 glass rounded-xl text-slate-700 dark:text-white/70 hover:text-slate-950 dark:hover:text-white neon-border hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
            title="Return to Customer View"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gradient flex items-center gap-2">
              <span>Scanova Admin Analytics</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Authorised Admin
              </span>
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-xs">Logged in as {currentUser?.username} ({currentUser?.email})</p>
          </div>
        </div>

        {/* Theme Selector & Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <ThemeSelector compact />

          <button
            onClick={() => data && exportSalesCSV(data, dateFilter)}
            className="px-3 py-2 glass rounded-xl text-xs font-semibold text-slate-700 dark:text-white/80 hover:text-slate-950 dark:hover:text-white neon-border hover:bg-slate-200/50 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-scanova-purple" /> Sales CSV
          </button>
          <button
            onClick={() => data && exportProductPerformanceCSV(data, dateFilter)}
            className="px-3 py-2 glass rounded-xl text-xs font-semibold text-slate-700 dark:text-white/80 hover:text-slate-950 dark:hover:text-white neon-border hover:bg-slate-200/50 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-scanova-cyan" /> Product CSV
          </button>
          <button
            onClick={() => data && exportCustomerAnalyticsCSV(data, dateFilter)}
            className="px-3 py-2 glass rounded-xl text-xs font-semibold text-slate-700 dark:text-white/80 hover:text-slate-950 dark:hover:text-white neon-border hover:bg-slate-200/50 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-scanova-pink" /> Customer CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-2 gradient-primary rounded-xl text-xs font-semibold text-white shadow-neon flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <FileText className="w-3.5 h-3.5" /> PDF Summary
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Date Filter & Control Bar */}
        <DateFilterBar
          selectedFilter={dateFilter}
          onFilterChange={setDateFilter}
          customStartDate={customStart}
          customEndDate={customEnd}
          onCustomDateChange={(start, end) => {
            setCustomStart(start);
            setCustomEnd(end);
          }}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onRefresh={loadAnalytics}
          loading={loading}
        />

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 glass p-1.5 rounded-2xl neon-border mb-6 overflow-x-auto">
          {[
            { id: 'sales', label: 'Sales Overview', icon: DollarSign },
            { id: 'products', label: 'Product Performance', icon: Package },
            { id: 'customers', label: 'Customer Analytics', icon: Users },
            { id: 'ml', label: 'Advanced ML Analytics', icon: BrainCircuit },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'gradient-primary text-white shadow-neon'
                    : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="glass rounded-2xl p-4 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && !data && (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-scanova-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Aggregating database statistics...</p>
          </div>
        )}

        {/* Main Analytics Content */}
        {data && (
          <AnimatePresence mode="wait">
            {activeTab === 'sales' && (
              <motion.div
                key="sales-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Sales Summary KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Revenue */}
                  <div className="glass rounded-2xl p-5 neon-border relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wider">Total Sales Revenue</span>
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-neon">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{data.salesMetrics.totalRevenue.toLocaleString()}</h2>
                    <div className="flex items-center gap-1.5 mt-2 text-xs">
                      {data.salesMetrics.growthRate >= 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                          <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{data.salesMetrics.growthRate}%
                        </span>
                      ) : (
                        <span className="text-red-500 dark:text-red-400 font-semibold flex items-center">
                          <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {data.salesMetrics.growthRate}%
                        </span>
                      )}
                      <span className="text-slate-400 dark:text-white/30">vs previous period</span>
                    </div>
                  </div>

                  {/* Card 2: Total Orders */}
                  <div className="glass rounded-2xl p-5 neon-border relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wider">Completed Orders</span>
                      <div className="w-10 h-10 rounded-xl bg-scanova-cyan/20 border border-scanova-cyan/40 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-scanova-cyan" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{data.salesMetrics.totalOrders}</h2>
                    <p className="text-slate-500 dark:text-white/30 text-xs mt-2">Valid non-cancelled orders</p>
                  </div>

                  {/* Card 3: Average Order Value */}
                  <div className="glass rounded-2xl p-5 neon-border relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wider">Avg Order Value (AOV)</span>
                      <div className="w-10 h-10 rounded-xl bg-scanova-pink/20 border border-scanova-pink/40 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-scanova-pink" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{data.salesMetrics.averageOrderValue.toLocaleString()}</h2>
                    <p className="text-slate-500 dark:text-white/30 text-xs mt-2">Average spending per completed order</p>
                  </div>

                  {/* Card 4: Previous Period Revenue */}
                  <div className="glass rounded-2xl p-5 neon-border relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wider">Previous Period Revenue</span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <PieChartIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{data.salesMetrics.previousPeriodRevenue.toLocaleString()}</h2>
                    <p className="text-slate-500 dark:text-white/30 text-xs mt-2">Comparison baseline</p>
                  </div>
                </div>

                {/* Main Interactive Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DailySalesChart data={data} />
                  <CategorySalesChart data={data} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BestSellingProductsChart data={data} />
                  <MonthlySalesChart data={data} />
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div
                key="products-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Search & Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Product Performance & Inventory Stock</h2>
                    <p className="text-slate-500 dark:text-white/40 text-xs">Track sales volume, revenue, stock levels, and zero-sale items</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                    <input
                      type="text"
                      placeholder="Search product, brand..."
                      value={productSearchTerm}
                      onChange={e => setProductSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 glass text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl outline-none focus:ring-1 focus:ring-scanova-purple"
                    />
                  </div>
                </div>

                {/* Best & Least Selling Cards Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top 5 Best Sellers */}
                  <div className="glass rounded-2xl p-5 neon-border">
                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Top 5 Best-Selling Products
                    </h3>
                    <div className="space-y-3">
                      {data.bestSellingProducts.slice(0, 5).map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-white/40">{p.brand} • {p.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{p.quantitySold} Sold</p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">₹{p.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 Least Sellers */}
                  <div className="glass rounded-2xl p-5 neon-border">
                    <h3 className="text-sm font-bold text-red-500 dark:text-red-400 mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Top 5 Least-Selling Products
                    </h3>
                    <div className="space-y-3">
                      {data.leastSellingProducts.slice(0, 5).map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-500 dark:text-red-400 font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-white/40">{p.brand} • {p.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold ${p.isZeroSales ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`}>
                              {p.isZeroSales ? 'Zero Sales (0)' : `${p.quantitySold} Sold`}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-white/30">Stock: {p.stock}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Complete Product Performance Data Table */}
                <div className="glass rounded-2xl p-5 neon-border overflow-x-auto">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Complete Product Master Ledger</h3>
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 text-xs font-semibold">
                        <th className="py-3 px-3">Product Name</th>
                        <th className="py-3 px-3">Brand & Category</th>
                        <th className="py-3 px-3 text-right">Qty Sold</th>
                        <th className="py-3 px-3 text-right">Total Revenue</th>
                        <th className="py-3 px-3 text-right">Avg Selling Price</th>
                        <th className="py-3 px-3 text-center">Available Stock</th>
                        <th className="py-3 px-3 text-center">Demand Velocity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                      {filteredProductsList.map(p => (
                        <tr key={p.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-white/60">{p.brand} ({p.category})</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white">{p.quantitySold}</td>
                          <td className="py-3 px-3 text-right font-bold text-scanova-purple dark:text-scanova-purple-light">₹{p.revenue.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-slate-700 dark:text-white/80">₹{p.averagePrice.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              p.stock < 5 ? 'bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.demandTrend === 'increasing' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              p.demandTrend === 'decreasing' ? 'bg-red-500/10 text-red-500 dark:text-red-400' : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-white/60'
                            }`}>
                              {p.demandTrend.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div
                key="customers-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Customer Metrics KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass rounded-2xl p-5 neon-border">
                    <span className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase">Total Registered Customers</span>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{data.customerMetrics.totalRegisteredCustomers}</h2>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">+{data.customerMetrics.newCustomersInPeriod} new in selected period</p>
                  </div>

                  <div className="glass rounded-2xl p-5 neon-border">
                    <span className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase">Active Purchasing Buyers</span>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{data.customerMetrics.activePurchasingCustomers}</h2>
                    <p className="text-slate-500 dark:text-white/30 text-xs mt-1">Customers with completed purchases</p>
                  </div>

                  <div className="glass rounded-2xl p-5 neon-border">
                    <span className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase">Repeat Customer Rate</span>
                    <h2 className="text-2xl font-extrabold text-scanova-cyan mt-2">{data.customerMetrics.repeatCustomerRate}%</h2>
                    <p className="text-slate-500 dark:text-white/30 text-xs mt-1">{data.customerMetrics.repeatCustomers} customers with 2+ orders</p>
                  </div>

                  <div className="glass rounded-2xl p-5 neon-border">
                    <span className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase">Avg Customer Lifetime Spend</span>
                    <h2 className="text-2xl font-extrabold text-scanova-pink mt-2">₹{data.customerMetrics.averageCustomerSpending.toLocaleString()}</h2>
                    <p className="text-slate-500 dark:text-white/30 text-xs mt-1">Avg {data.customerMetrics.averageOrdersPerCustomer} orders per buyer</p>
                  </div>
                </div>

                {/* Customer Growth & RFM Segment Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CustomerGrowthChart data={data} />

                  {/* Customer RFM Segments List */}
                  <div className="glass rounded-2xl p-6 neon-border">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Customer RFM Cohort Segments</h3>
                    <p className="text-slate-500 dark:text-white/40 text-xs mb-4">Recency, Frequency, Monetary behavioral segmentation</p>

                    <div className="space-y-3">
                      {data.customerSegments.map(s => (
                        <div key={s.segment} className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">{s.segment}</p>
                            <p className="text-[10px] text-slate-500 dark:text-white/40">{s.description}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-scanova-purple/20 text-scanova-purple dark:text-scanova-purple-light font-bold text-xs border border-scanova-purple/30">
                            {s.count} Users
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Authorised Customer Purchase History Table */}
                <div className="glass rounded-2xl p-5 neon-border overflow-x-auto">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Authorised Customer Accounts & Ledger</h3>
                      <p className="text-slate-500 dark:text-white/40 text-xs">Individual customer transaction summaries (Restricted to Administrators)</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                      <input
                        type="text"
                        placeholder="Search customer username, email..."
                        value={customerSearchTerm}
                        onChange={e => setCustomerSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 glass text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl outline-none focus:ring-1 focus:ring-scanova-purple"
                      />
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 text-xs font-semibold">
                        <th className="py-3 px-3">Customer Username</th>
                        <th className="py-3 px-3">Email Address</th>
                        <th className="py-3 px-3">Member Since</th>
                        <th className="py-3 px-3 text-right">Total Orders</th>
                        <th className="py-3 px-3 text-right">Total Spent</th>
                        <th className="py-3 px-3 text-right">Avg Order Value</th>
                        <th className="py-3 px-3 text-center">RFM Segment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                      {filteredCustomerHistory.map(c => (
                        <tr key={c.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{c.username}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-white/60">{c.email}</td>
                          <td className="py-3 px-3 text-slate-500 dark:text-white/50">{c.createdAt}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white">{c.totalOrders}</td>
                          <td className="py-3 px-3 text-right font-bold text-scanova-cyan">₹{c.totalSpent.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-slate-700 dark:text-white/80">₹{c.avgOrderValue.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-scanova-purple/20 text-scanova-purple dark:text-scanova-purple-light border border-scanova-purple/30">
                              {c.segment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'ml' && (
              <motion.div
                key="ml-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Sales Forecasting Chart */}
                <SalesForecastChart data={data} />

                {/* Sales Anomaly & Risk Detection Table */}
                <div className="glass rounded-2xl p-5 neon-border overflow-x-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-scanova-purple dark:text-scanova-purple-light" />
                        <span>ML Anomaly & Risk Evaluation Log</span>
                      </h3>
                      <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5">Isolation Forest anomaly detection evaluations for cashier-less exit gates</p>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 text-xs font-semibold">
                        <th className="py-3 px-3">Evaluation Date</th>
                        <th className="py-3 px-3">Order ID</th>
                        <th className="py-3 px-3">User Account</th>
                        <th className="py-3 px-3 text-right">Billed Total</th>
                        <th className="py-3 px-3 text-center">ML Risk Score</th>
                        <th className="py-3 px-3 text-center">Risk Level</th>
                        <th className="py-3 px-3">Disposition Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                      {data.anomalies.map(a => (
                        <tr key={a.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 text-slate-500 dark:text-white/50">{a.createdAt}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{a.orderId}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-white/60">{a.userEmail}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">₹{a.totalAmount.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center font-bold text-scanova-cyan">{a.riskScore}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              a.riskLevel === 'high' ? 'bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30' :
                              a.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {a.riskLevel.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-white/60">{a.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
