import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface CustomSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  disabled?: boolean;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  icon,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  size = 'sm',
  align = 'left',
  disabled = false
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

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
        className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white text-slate-800 transition-all font-semibold shadow-2xs select-none cursor-pointer ${sizeClasses} ${
          isOpen
            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20 text-emerald-950'
            : 'border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/20 text-slate-700'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {icon && <span className="text-emerald-600 flex-shrink-0">{icon}</span>}
          {selectedOption?.icon && !icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-emerald-600 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 min-w-full w-max max-w-xs sm:max-w-sm rounded-xl bg-white/95 backdrop-blur-md p-1.5 shadow-xl border border-slate-200/90 text-xs animation-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${dropdownClassName}`}
          style={{
            boxShadow: '0 12px 30px -4px rgba(6, 78, 59, 0.12), 0 4px 10px -2px rgba(6, 78, 59, 0.08)'
          }}
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 chat-scrollbar">
            {options.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200/80 shadow-2xs'
                      : 'text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-950 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    {option.icon && (
                      <span className="text-slate-500 flex-shrink-0">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                    {option.badge}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
