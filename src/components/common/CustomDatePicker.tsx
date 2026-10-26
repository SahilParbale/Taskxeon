import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { getTodayDateString, isToday, formatDateToYYYYMMDD } from '../../lib/dateUtils';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
  disabled?: boolean;
  clearable?: boolean;
  minDate?: string;
  maxDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  className = '',
  buttonClassName = '',
  align = 'left',
  size = 'sm',
  disabled = false,
  clearable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view from value or fallback to today
  const initialDate = useMemo(() => {
    if (value) {
      const parts = value.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  // When opening or when value changes, synchronize current view month/year
  useEffect(() => {
    if (isOpen) {
      setViewYear(initialDate.getFullYear());
      setViewMonth(initialDate.getMonth());
    }
  }, [isOpen, initialDate]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    const dt = new Date(year, month, day);
    onChange(formatDateToYYYYMMDD(dt));
    setIsOpen(false);
  };

  const handleJumpToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(getTodayDateString());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Build calendar matrix
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      year: number;
      month: number;
      day: number;
      isCurrentMonth: boolean;
      dateString: string;
    }[] = [];

    // Previous month filler days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        year: prevYear,
        month: prevMonth,
        day,
        isCurrentMonth: false,
        dateString: formatDateToYYYYMMDD(new Date(prevYear, prevMonth, day))
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        year: viewYear,
        month: viewMonth,
        day: d,
        isCurrentMonth: true,
        dateString: formatDateToYYYYMMDD(new Date(viewYear, viewMonth, d))
      });
    }

    // Next month filler days to complete grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        year: nextYear,
        month: nextMonth,
        day: d,
        isCurrentMonth: false,
        dateString: formatDateToYYYYMMDD(new Date(nextYear, nextMonth, d))
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Formatted trigger label
  const formattedDisplayLabel = useMemo(() => {
    if (!value) return placeholder;
    try {
      const parts = value.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', {
          weekday: size === 'sm' ? undefined : 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      return value;
    }
    return value;
  }, [value, placeholder, size]);

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-xs sm:text-sm'
  }[size];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 rounded-xl border bg-white transition-all font-semibold shadow-2xs cursor-pointer select-none ${sizeClasses} ${
          isOpen
            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20 text-emerald-950'
            : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 text-slate-700'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className={`truncate ${!value ? 'text-slate-400 font-normal' : 'text-slate-800'}`}>
            {formattedDisplayLabel}
          </span>
        </div>

        {clearable && value && (
          <span
            onClick={handleClear}
            className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-600 ml-1 transition-colors"
            title="Clear date"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Popover Custom Calendar */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-[280px] sm:w-72 max-w-[calc(100vw-24px)] rounded-2xl bg-white shadow-2xl border border-emerald-100/90 p-3 sm:p-3.5 text-xs select-none animation-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{
            boxShadow: '0 20px 35px -5px rgba(6, 78, 59, 0.15), 0 8px 12px -3px rgba(6, 78, 59, 0.08)'
          }}
        >
          {/* Calendar Header with Month/Year Navigation */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="font-bold text-slate-900 text-sm">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAY_NAMES.map(day => (
              <span key={day} className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, index) => {
              const isSelected = value === d.dateString;
              const isCurrentDay = isToday(d.dateString);

              return (
                <button
                  key={`${d.dateString}-${index}`}
                  type="button"
                  onClick={() => handleSelectDay(d.year, d.month, d.day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs transition-all relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-sm ring-2 ring-emerald-600/30'
                      : isCurrentDay
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 hover:bg-emerald-100'
                      : d.isCurrentMonth
                      ? 'text-slate-800 hover:bg-emerald-50/70 hover:text-emerald-950 font-medium'
                      : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                  title={d.dateString}
                >
                  {d.day}
                  {isCurrentDay && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Quick Select Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleJumpToday}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Today</span>
            </button>

            {clearable ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Clear
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">
                {value ? `Selected: ${value}` : 'No date selected'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
