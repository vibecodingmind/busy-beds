'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchableSelectProps<T = string> {
  value: T;
  options: T[];
  onChange: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  optionLabel?: (option: T) => string;
  onOptionClick?: (option: T) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  /** When true, the dropdown only shows options after the user starts typing */
  searchFirst?: boolean;
}

export default function SearchableSelect<T>({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  optionLabel = (option: T) => String(option),
  onOptionClick,
  allowCustom = false,
  customPlaceholder = 'Add new...',
  searchFirst = false,
}: SearchableSelectProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions =
    searchTerm.length > 0
      ? options.filter((option) =>
          optionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true);
      setIsDropdownOpen(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setIsDropdownOpen(false);
    }, 200);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleOptionSelect = (option: T) => {
    onChange(option);
    setIsDropdownOpen(false);
    setSearchTerm('');
    onOptionClick?.(option);
  };

  const handleCustomOption = () => {
    setIsCustom(true);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(options[0] as T);
  };

  // In searchFirst mode, only show the dropdown list when the user has typed something
  const showList = isDropdownOpen && (!searchFirst || searchTerm.length > 0);

  const renderOptions = () => {
    const displayOptions = filteredOptions;

    return (
      <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 rounded-lg border border-black/10 dark:border-zinc-600 shadow-lg max-h-60 overflow-auto">
        {displayOptions.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleOptionSelect(option)}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${option === value ? 'bg-primary text-primary-foreground' : 'text-black dark:text-zinc-100'}`}
          >
            {optionLabel(option)}
          </button>
        ))}

        {allowCustom && searchTerm.length > 0 && displayOptions.length === 0 && (
          <button
            type="button"
            onClick={handleCustomOption}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-black dark:text-zinc-100"
          >
            {customPlaceholder}: {searchTerm}
          </button>
        )}

        {displayOptions.length === 0 && !allowCustom && (
          <div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
            No results found
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        isDropdownOpen
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isCustom) {
      onChange(value as T);
      setIsCustom(false);
    }
  }, [isCustom, value, onChange]);

  // In searchFirst mode the input always shows the search term while focused,
  // otherwise show the selected value label when not actively searching.
  const displayValue = isCustom
    ? searchTerm
    : isFocused && searchFirst
    ? searchTerm
    : isFocused && searchTerm.length > 0
    ? searchTerm
    : optionLabel(value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`relative ${isFocused || isDropdownOpen ? 'ring-2 ring-primary/50' : ''}`}>
        <div className="flex items-center justify-between">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleSearchChange}
            placeholder={searchFirst && isFocused ? searchPlaceholder : placeholder}
            disabled={disabled}
            className={`w-full rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors ${disabled ? 'bg-zinc-50 dark:bg-zinc-800/50 cursor-not-allowed' : ''}`}
            readOnly={!allowCustom && !searchFirst}
          />

          {isFocused && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {showList && renderOptions()}

        {/* searchFirst hint: show a prompt before typing */}
        {searchFirst && isDropdownOpen && searchTerm.length === 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 rounded-lg border border-black/10 dark:border-zinc-600 shadow-lg px-4 py-2.5 text-sm text-zinc-400 dark:text-zinc-500">
            Type to search regions…
          </div>
        )}
      </div>
    </div>
  );
}
