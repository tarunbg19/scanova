import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AnalyticsData } from '../../services/analyticsService';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = ['#8B5CF6', '#06B6D4', '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#3B82F6'];

const CustomTooltip = ({ active, payload, label, currency = true }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#0e0f26] border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-slate-600 dark:text-white/70 text-xs font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-xs font-medium" style={{ color: entry.color }}>
            {entry.name}: {currency ? `₹${Number(entry.value).toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DailySalesChart({ data }: { data: AnalyticsData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)';

  if (!data.dailySales || data.dailySales.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 neon-border flex flex-col items-center justify-center min-h-[300px] text-center">
        <p className="text-slate-500 dark:text-white/40 text-sm">No daily sales recorded for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 neon-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Revenue & Order Trends</h3>
          <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5">Daily sales revenue (₹) and order volumes</p>
        </div>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.dailySales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" stroke={axisStroke} tick={{ fontSize: 11 }} />
            <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BestSellingProductsChart({ data }: { data: AnalyticsData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)';
  const labelStroke = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.75)';

  if (!data.bestSellingProducts || data.bestSellingProducts.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 neon-border flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500 dark:text-white/40 text-sm">No sales data available for best selling products.</p>
      </div>
    );
  }

  const chartData = data.bestSellingProducts.map(p => ({
    name: p.name.length > 14 ? `${p.name.substring(0, 14)}...` : p.name,
    quantity: p.quantitySold,
    revenue: p.revenue,
  }));

  return (
    <div className="glass rounded-2xl p-6 neon-border">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Top Selling Products</h3>
      <p className="text-slate-500 dark:text-white/40 text-xs mb-4">Ranked by total units sold</p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis type="number" stroke={axisStroke} tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" stroke={labelStroke} tick={{ fontSize: 11 }} width={95} />
            <Tooltip content={<CustomTooltip currency={false} />} />
            <Bar dataKey="quantity" name="Quantity Sold" fill="#06B6D4" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategorySalesChart({ data }: { data: AnalyticsData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!data.categorySales || data.categorySales.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 neon-border flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500 dark:text-white/40 text-sm">No category distribution data available.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 neon-border">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Category Sales Share</h3>
      <p className="text-slate-500 dark:text-white/40 text-xs mb-4">Revenue breakdown by product category</p>
      <div className="h-[280px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.categorySales}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={4}
              dataKey="revenue"
              nameKey="name"
              label={({ name, percentage }) => `${name} (${percentage}%)`}
              labelLine={false}
            >
              {data.categorySales.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(val) => (
                <span className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{val}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MonthlySalesChart({ data }: { data: AnalyticsData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)';

  if (!data.monthlySales || data.monthlySales.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 neon-border flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500 dark:text-white/40 text-sm">No monthly sales data available.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 neon-border">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Monthly Sales & Volume Trends</h3>
      <p className="text-slate-500 dark:text-white/40 text-xs mb-4">Monthly total revenue (₹) and orders</p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.monthlySales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="month" stroke={axisStroke} tick={{ fontSize: 11 }} />
            <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="Monthly Revenue (₹)" fill="#EC4899" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CustomerGrowthChart({ data }: { data: AnalyticsData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)';

  if (!data.customerGrowth || data.customerGrowth.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 neon-border flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500 dark:text-white/40 text-sm">No customer registration history recorded.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 neon-border">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Customer Acquisition Growth</h3>
      <p className="text-slate-500 dark:text-white/40 text-xs mb-4">New customer registrations over time</p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.customerGrowth} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" stroke={axisStroke} tick={{ fontSize: 11 }} />
            <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip currency={false} />} />
            <Line type="monotone" dataKey="customers" name="New Registrations" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SalesForecastChart({ data }: { data: AnalyticsData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)';

  if (!data.salesForecast || data.salesForecast.length === 0) {
    return null;
  }

  return (
    <div className="glass rounded-2xl p-6 neon-border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>ML 7-Day Sales Forecast</span>
            <span className="px-2 py-0.5 rounded-full bg-scanova-purple/20 text-scanova-purple dark:text-scanova-purple-light text-[10px] font-semibold border border-scanova-purple/30">
              ML Predictive Baseline
            </span>
          </h3>
          <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5">Projected revenue based on time-series moving averages & trend bounds</p>
        </div>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.salesForecast} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" stroke={axisStroke} tick={{ fontSize: 11 }} />
            <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="predictedRevenue" name="Predicted Sales (₹)" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorForecast)" />
            <Line type="monotone" dataKey="upperBound" name="Upper Bound (₹)" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="lowerBound" name="Lower Bound (₹)" stroke="#EC4899" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
