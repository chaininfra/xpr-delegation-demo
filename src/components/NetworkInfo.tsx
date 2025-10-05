/**
 * NetworkInfo Component
 *
 * Displays current network configuration and connection details.
 * Shows chain ID, endpoint, and WebAuth information with visual indicators.
 *
 * Features:
 * - Network configuration display
 * - Visual status indicators (testnet/mainnet)
 * - Truncated chain ID for readability
 * - Color-coded network status
 * - Responsive card layout
 *
 * @component
 * @param {string} network - Current network ('testnet' | 'mainnet')
 * @returns {JSX.Element} Network information component
 */
import React from 'react';

import { getNetworkConfig } from '../config/networks';
import type { NetworkInfoProps } from '../types';

const NetworkInfo: React.FC<NetworkInfoProps> = ({ network }) => {
  // Get network configuration based on selected network
  const config = getNetworkConfig(network);

  return (
    <div
      className={`card border-l-4 ${network === 'testnet' ? 'border-yellow-400' : 'border-green-400'}`}
    >
      <h4
        className={`text-lg font-semibold mb-3 ${network === 'testnet' ? 'text-yellow-600' : 'text-green-600'}`}
      >
        🌐 {config.name} Network
      </h4>

      <div className='space-y-2 text-sm'>
        <div className='flex justify-between'>
          <span className='font-medium text-gray-600'>Chain ID:</span>
          <code className='bg-gray-100 px-2 py-1 rounded text-xs font-mono'>
            {config.chainId.substring(0, 16)}...
          </code>
        </div>

        <div className='flex justify-between'>
          <span className='font-medium text-gray-600'>Endpoint:</span>
          <code className='bg-gray-100 px-2 py-1 rounded text-xs font-mono'>
            {config.endpoints[0]}
          </code>
        </div>

        <div className='flex justify-between'>
          <span className='font-medium text-gray-600'>WebAuth:</span>
          <code className='bg-gray-100 px-2 py-1 rounded text-xs font-mono'>
            {config.webauth}
          </code>
        </div>
      </div>

      <div
        className={`mt-4 p-3 rounded-lg text-sm ${network === 'testnet' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}
      >
        {network === 'testnet'
          ? '⚠️ Testnet - Safe for testing'
          : '🔒 Mainnet - Real transactions'}
      </div>
    </div>
  );
};

export default NetworkInfo;
