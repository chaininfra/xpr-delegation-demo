/**
 * BlockProducerSelector Component
 *
 * Enhanced dropdown component for selecting Block Producers with search functionality.
 * Provides a user-friendly interface to browse, search, and select Block Producers
 * for vote delegation on XPR Network.
 *
 * Features:
 * - Searchable dropdown with real-time filtering
 * - Click outside to close functionality
 * - Loading states and empty state handling
 * - Responsive design with Tailwind CSS
 * - Keyboard navigation support
 *
 * @component
 * @param {Array} blockProducers - Array of Block Producer objects
 * @param {string} selectedBP - Currently selected Block Producer name
 * @param {Function} onSelectBP - Callback when BP is selected
 * @param {Function} onDelegateVotes - Callback to delegate votes
 * @param {boolean} loading - Loading state for delegation
 * @returns {JSX.Element} Block Producer selector component
 */
/* eslint-disable no-undef */
import React, { useState, useMemo, useEffect, useRef } from 'react';

import { CardLayout } from '../layout';
import type { BlockProducerSelectorProps } from '../types';

const BlockProducerSelector: React.FC<BlockProducerSelectorProps> = ({
  blockProducers,
  selectedBPs,
  onSelectBP,
  onDelegateVotes,
  loading,
}) => {
  // Component state management
  const [isOpen, setIsOpen] = useState(false); // Dropdown open/close state
  const [searchTerm, setSearchTerm] = useState(''); // Search input value
  const dropdownRef = useRef<HTMLDivElement>(null); // Reference for click outside detection

  /**
   * Handle click outside dropdown to close it
   * Adds/removes event listener for better UX
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        dropdownRef.current.contains(event.target as Node)
      ) {
        return; // Don't close if clicking inside dropdown
      } else if (dropdownRef.current) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Filter block producers based on search term
   * Searches both name and URL fields for comprehensive results
   */
  const filteredProducers = useMemo(() => {
    if (!searchTerm) return blockProducers;

    return blockProducers.filter(
      bp =>
        bp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bp.url.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [blockProducers, searchTerm]);

  /**
   * Handle Block Producer selection (toggle)
   * Adds to selection if not selected, removes if already selected
   * Maximum 4 producers can be selected
   */
  const handleSelectBP = (bpName: string): void => {
    onSelectBP(bpName);
    // Don't close dropdown to allow multiple selections
    setSearchTerm('');
  };

  /**
   * Handle vote delegation for all selected producers
   */
  const handleDelegateVotes = (): void => {
    if (selectedBPs.length > 0) {
      onDelegateVotes(selectedBPs);
    }
  };

  // Find selected Block Producer data for display
  const selectedBPData = blockProducers.filter(bp =>
    selectedBPs.includes(bp.name)
  );

  if (!blockProducers || blockProducers.length === 0) {
    return (
      <CardLayout title='🏛️ Block Producers'>
        <div className='text-center py-12 text-gray-500'>
          <svg
            className='w-12 h-12 mx-auto mb-4 text-gray-300'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
            />
          </svg>
          <p>No Block Producers available</p>
        </div>
      </CardLayout>
    );
  }

  return (
    <CardLayout title='🏛️ Block Producers'>
      <div className='space-y-4'>
        {/* Search and Select Dropdown */}
        <div className='relative' ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='w-full p-4 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          >
            <div className='flex justify-between items-center'>
              <div className='flex-1'>
                {selectedBPs.length > 0 ? (
                  <div>
                    <div className='text-sm text-gray-600 mb-2'>
                      Selected ({selectedBPs.length}/4):
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {selectedBPs.map(bpName => (
                        <span
                          key={bpName}
                          className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                        >
                          {bpName}
                          <span
                            onClick={e => {
                              e.stopPropagation();
                              onSelectBP(bpName);
                            }}
                            className='ml-1 text-blue-600 hover:text-blue-800 cursor-pointer'
                            role='button'
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectBP(bpName);
                              }
                            }}
                          >
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className='text-gray-500'>
                    Select Block Producers (max 4)...
                  </div>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden'>
              {/* Search Input */}
              <div className='p-3 border-b border-gray-200'>
                <div className='relative'>
                  <svg
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                  <input
                    type='text'
                    placeholder='Search Block Producers...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                  />
                </div>
              </div>

              {/* Producer List */}
              <div className='max-h-60 overflow-y-auto'>
                {filteredProducers.length > 0 ? (
                  filteredProducers.map((bp, index) => (
                    <button
                      key={index}
                      type='button'
                      className={`w-full text-left p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedBPs.includes(bp.name) ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => handleSelectBP(bp.name)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelectBP(bp.name);
                        }
                      }}
                      disabled={
                        !selectedBPs.includes(bp.name) &&
                        selectedBPs.length >= 4
                      }
                    >
                      <div className='flex justify-between items-center'>
                        <div className='flex-1'>
                          <div className='font-medium text-gray-900'>
                            {bp.name}
                          </div>
                          <div className='text-sm text-gray-600 truncate'>
                            {bp.url}
                          </div>
                        </div>
                        {selectedBPs.includes(bp.name) && (
                          <svg
                            className='w-5 h-5 text-primary-500'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                              clipRule='evenodd'
                            />
                          </svg>
                        )}
                        {!selectedBPs.includes(bp.name) &&
                          selectedBPs.length >= 4 && (
                            <span className='text-xs text-gray-400'>
                              Max reached
                            </span>
                          )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className='p-4 text-center text-gray-500'>
                    <svg
                      className='w-8 h-8 mx-auto mb-2 text-gray-300'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                    <p className='text-sm'>No Block Producers found</p>
                    <p className='text-xs text-gray-400'>
                      Try a different search term
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Producers Info */}
        {selectedBPs.length > 0 && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-center mb-3'>
              <svg
                className='w-5 h-5 text-blue-500 mr-2'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <h3 className='font-medium text-blue-900'>
                Selected Block Producers ({selectedBPs.length}/4)
              </h3>
            </div>
            <div className='space-y-2'>
              {selectedBPData.map(bp => (
                <div key={bp.name} className='text-sm text-blue-800'>
                  <span className='font-medium'>{bp.name}</span>
                  <span className='text-blue-600 ml-2'>{bp.url}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delegate Button */}
        {selectedBPs.length > 0 && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-6 text-center'>
            <p className='text-green-800 mb-4 font-medium'>
              Ready to delegate votes to:{' '}
              <span className='font-bold'>
                {selectedBPs.length} Producer
                {selectedBPs.length !== 1 ? 's' : ''}
              </span>
            </p>
            <button
              onClick={handleDelegateVotes}
              disabled={loading}
              className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className='flex items-center gap-2'>
                  <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                      fill='none'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Delegating...
                </span>
              ) : (
                `Delegate Votes to ${selectedBPs.length} Producer${selectedBPs.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        )}
      </div>
    </CardLayout>
  );
};

export default BlockProducerSelector;
