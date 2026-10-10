import { useState } from 'react';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { DateFilterType } from '../../services/analyticsService';

interface Props {
  selectedFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const filterOptions: { id: DateFilterType; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7days', label: 'Last 7 Days' },
  { id: 'last30days', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'last3Months', label: 'Last 3 Months' },
  { id: 'thisYear', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

export default function DateFilterBar({
  selectedFilter,
  onFilterChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  selectedCategory,
  onCategoryChange,
  onRefresh,
  loading,
}: Props) {
  const [startInput, setStartInput] = useState(customStartDate);
  const [endInput, setEndInput] = useState(customEndDate);

  const handleApplyCustom = () => {
    if (startInput && endInput) {
      onCustomDateChange(startInput, endInput);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 neon-border mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Date Presets */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50 font-medium mr-2">
          <Calendar className="w-4 h-4 text-scanova-purple" />
          <span>Period:</span>
        </div>
        {filterOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => onFilterChange(opt.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedFilter === opt.id
                ? 'gradient-primary text-white shadow-neon'
                : 'glass text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filter controls & Refresh */}
      <div className="flex flex-wrap items-center gap-3">
        {selectedFilter === 'custom' && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-xl border border-slate-200 dark:border-white/10">
            <input
              type="date"
              value={startInput}
              onChange={e => setStartInput(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-white px-2 py-1 outline-none focus:ring-1 focus:ring-scanova-purple rounded"
            />
            <span className="text-slate-400 dark:text-white/40 text-xs">to</span>
            <input
              type="date"
              value={endInput}
              onChange={e => setEndInput(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-white px-2 py-1 outline-none focus:ring-1 focus:ring-scanova-purple rounded"
            />
            <button
              onClick={handleApplyCustom}
              className="px-2.5 py-1 gradient-primary text-white text-xs font-semibold rounded-lg"
            >
              Apply
            </button>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl neon-border">
          <Filter className="w-3.5 h-3.5 text-scanova-cyan" />
          <select
            value={selectedCategory}
            onChange={e => onCategoryChange(e.target.value)}
            className="bg-transparent text-xs text-slate-800 dark:text-white outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-[#0a0a1a] text-slate-900 dark:text-white">All Categories</option>
            <option value="footwear" className="bg-white dark:bg-[#0a0a1a] text-slate-900 dark:text-white">Footwear</option>
            <option value="outerwear" className="bg-white dark:bg-[#0a0a1a] text-slate-900 dark:text-white">Outerwear</option>
            <option value="tops" className="bg-white dark:bg-[#0a0a1a] text-slate-900 dark:text-white">Tops & Shirts</option>
            <option value="bottoms" className="bg-white dark:bg-[#0a0a1a] text-slate-900 dark:text-white">Bottoms & Pants</option>
            <option value="accessories" className="bg-white dark:bg-[#0a0a1a] text-slate-900 dark:text-white">Accessories</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 glass rounded-xl text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white neon-border hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Refresh Analytics Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-scanova-purple' : ''}`} />
        </button>
      </div>
    </div>
  );
}
