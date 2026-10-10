import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

interface ThemeSelectorProps {
  compact?: boolean;
}

export default function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const options: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  if (compact) {
    return (
      <div
        role="group"
        aria-label="Theme mode selector"
        className="inline-flex items-center p-1 rounded-xl glass neon-border gap-1"
      >
        {options.map(option => {
          const Icon = option.icon;
          const isSelected = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              aria-pressed={isSelected}
              title={`${option.label} theme`}
              className={`relative p-2 rounded-lg transition-all flex items-center justify-center ${
                isSelected
                  ? 'text-white'
                  : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="compactThemeIndicator"
                  className="absolute inset-0 rounded-lg gradient-primary shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="sr-only">{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-white/70">
          Appearance & Theme
        </label>
        <span className="text-[11px] font-medium text-scanova-purple dark:text-scanova-purple-light capitalize">
          {theme === 'system' ? `System (${resolvedTheme})` : `${theme} mode`}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Theme options"
        className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl glass neon-border"
      >
        {options.map(option => {
          const Icon = option.icon;
          const isSelected = theme === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(option.id)}
              className={`relative py-2.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-white/5'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="themeSelectedPill"
                  className="absolute inset-0 rounded-xl gradient-primary shadow-neon"
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" strokeWidth={isSelected ? 2.5 : 2} />
              <span className="relative z-10 text-[11px]">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
