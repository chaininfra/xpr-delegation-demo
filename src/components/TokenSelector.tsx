/**
 * TokenSelector Component - XPR Delegation Demo
 *
 * Interactive dropdown selector for choosing available tokens
 * from user's wallet with search functionality.
 *
 * @fileoverview Token selection component with search capabilities
 */

import React, { useState, useMemo } from 'react';
import type { TokenBalance } from '../types';

// Type for input element
interface InputElement {
  value: string;
}

interface TokenSelectorProps {
  /** Available tokens */
  tokens: TokenBalance[];
  /** Selected token */
  selected: TokenBalance | null;
  /** Token selection handler */
  onSelect: (token: TokenBalance) => void;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * TokenSelector - Interactive token selection dropdown
 */
const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  selected,
  onSelect,
  loading = false,
  error = null,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tokens based on search term
  const filteredTokens = useMemo(() => {
    if (!searchTerm) return tokens;

    const term = searchTerm.toLowerCase();
    return tokens.filter(
      token =>
        token.symbol.toLowerCase().includes(term) ||
        token.contract.toLowerCase().includes(term) ||
        token.formatted.toLowerCase().includes(term)
    );
  }, [tokens, searchTerm]);

  // Handle token selection
  const handleTokenSelect = (token: TokenBalance) => {
    onSelect(token);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Get display text for selected token
  const getDisplayText = () => {
    if (selected) {
      return `${selected.formatted} (${selected.contract})`;
    }
    return 'Select token to transfer';
  };

  // Handle dropdown toggle
  const toggleDropdown = () => {
    if (disabled || loading) return;
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<InputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      <label
        htmlFor={'token-selector'}
        className='block text-sm font-medium text-gray-700 mb-2'
      >
        Token to Transfer
      </label>

      {/* Selector Button */}
      <button
        type='button'
        id='token-selector'
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg text-left
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${
            disabled || loading
              ? 'bg-gray-100 cursor-not-allowed text-gray-400'
              : 'bg-white cursor-pointer hover:border-gray-400'
          }
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
        `}
      >
        <div className='flex items-center justify-between'>
          <span
            className={`truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}
          >
            {loading ? 'Loading tokens...' : getDisplayText()}
          </span>

          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </div>
      </button>

      {/* Error Message */}
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && !disabled && !loading && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg'>
          {/* Search Input */}
          <div className='p-3 border-b border-gray-200'>
            <input
              type='text'
              placeholder='Search tokens...'
              value={searchTerm}
              onChange={handleSearchChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Token List */}
          <div className='max-h-60 overflow-y-auto'>
            {filteredTokens.length === 0 ? (
              <div className='p-4 text-center text-gray-500'>
                {searchTerm
                  ? 'No tokens found matching search'
                  : 'No tokens available'}
              </div>
            ) : (
              filteredTokens.map((token, index) => (
                <button
                  key={`${token.contract}-${token.symbol}`}
                  type='button'
                  onClick={() => handleTokenSelect(token)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                    ${index !== filteredTokens.length - 1 ? 'border-b border-gray-100' : ''}
                    ${
                      selected?.contract === token.contract &&
                      selected?.symbol === token.symbol
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-900'
                    }
                  `}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-sm'>
                        {token.formatted}
                      </div>
                      <div className='text-xs text-gray-500 truncate'>
                        Contract: {token.contract}
                      </div>
                    </div>

                    {selected?.contract === token.contract &&
                      selected?.symbol === token.symbol && (
                        <svg
                          className='w-4 h-4 text-blue-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay for closing dropdown */}
      {isOpen && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => setIsOpen(false)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          role='button'
          tabIndex={-1}
          aria-label='Close token selector'
        />
      )}
    </div>
  );
};

export default TokenSelector;
