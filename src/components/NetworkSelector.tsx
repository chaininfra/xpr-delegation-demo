/**
 * NetworkSelector Component
 *
 * Dropdown component for selecting between XPR Network testnet and mainnet.
 * Provides clear visual indicators and status information for each network.
 *
 * Features:
 * - Testnet/Mainnet selection
 * - Visual status indicators
 * - Custom styled dropdown with hover effects
 * - Responsive design
 *
 * @component
 * @param network - Current selected network ('testnet' | 'mainnet')
 * @param onNetworkChange - Callback when network changes
 * @returns Network selector component
 */
import React from 'react';
import type { NetworkSelectorProps } from '../types';

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  network,
  onNetworkChange,
}) => {
  return (
    <div className='mb-6'>
      <label
        htmlFor='network-select'
        className='block text-sm font-semibold text-gray-700 mb-2'
      >
        🌐 Network Selection
      </label>
      <div className='relative'>
        <select
          id='network-select'
          className='w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 appearance-none cursor-pointer hover:border-gray-400'
          value={network}
          onChange={e =>
            onNetworkChange(e.target.value as 'testnet' | 'mainnet')
          }
          data-testid='network-select'
        >
          <option value='testnet'>Testnet</option>
          <option value='mainnet'>Mainnet</option>
        </select>
        <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
          <svg
            className='w-5 h-5 text-gray-400'
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
      </div>
      <div className='mt-2 text-xs text-gray-500'>
        {network === 'testnet'
          ? '🧪 Testnet - Safe for testing'
          : '🔒 Mainnet - Real transactions'}
      </div>
    </div>
  );
};

export default NetworkSelector;
