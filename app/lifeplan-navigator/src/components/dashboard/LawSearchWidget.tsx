'use client';

import React, { useState, useCallback } from 'react';

interface LawSearchWidgetProps {
  onSearch: (query: string) => void;
  suggestions?: string[];
  recentSearches?: string[];
  placeholder?: string;
}

export function LawSearchWidget({
  onSearch,
  suggestions = [],
  recentSearches = [],
  placeholder = '法令を検索...',
}: LawSearchWidgetProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      onSearch(suggestion);
    },
    [onSearch]
  );

  const showDropdown = isFocused && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            aria-label="法令検索"
          />

          {/* Search Button */}
          <button
            type="submit"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="検索実行"
          >
            <span className="text-sm font-medium">検索</span>
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-gray-500 px-2 py-1 font-medium">
                おすすめキーワード
              </p>
              <div className="flex flex-wrap gap-2 p-2">
                {suggestions.slice(0, 6).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {suggestions.length > 0 && recentSearches.length > 0 && (
            <div className="border-t border-gray-100" />
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-gray-500 px-2 py-1 font-medium">
                最近の検索
              </p>
              <ul>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleSuggestionClick(search)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      <svg
                        className="h-4 w-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {search}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LawSearchWidget;
