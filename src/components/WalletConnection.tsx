/**
 * WalletConnection Component
 *
 * Manages wallet connection state and provides UI for connecting/disconnecting wallets.
 * Supports WebAuth and Anchor wallet integration with loading states and visual feedback.
 *
 * Features:
 * - Connect/Disconnect wallet functionality
 * - Loading states with spinner animation
 * - Visual connection status indicators
 * - Responsive button design
 * - Error handling integration
 *
 * @component
 * @param wallet - Connected wallet instance or null
 * @param loading - Loading state for connection process
 * @param onConnect - Callback to initiate wallet connection
 * @param onDisconnect - Callback to disconnect wallet
 * @returns Wallet connection component
 */
import React from 'react';

import type { WalletConnectionProps } from '../types';

const WalletConnection: React.FC<WalletConnectionProps> = ({
  wallet,
  loading,
  onConnect,
  onDisconnect,
}) => {
  /**
   * Handle wallet connection click
   * Validates callback exists before executing
   */
  const handleConnectClick = () => {
    if (onConnect) {
      onConnect();
    }
  };

  return (
    <div className='text-center mb-6'>
      {!wallet ? (
        <div className='space-y-3'>
          <button
            onClick={handleConnectClick}
            disabled={loading}
            className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={loading ? 'Connecting wallet' : 'Connect wallet'}
            aria-describedby='wallet-connect-description'
          >
            {loading ? (
              <span className='flex items-center gap-2'>
                <svg
                  className='animate-spin h-4 w-4'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
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
                <span aria-hidden='true'>Connecting...</span>
              </span>
            ) : (
              'Connect Wallet'
            )}
          </button>
          <div id='wallet-connect-description' className='sr-only'>
            Click to connect your WebAuth or Anchor wallet to interact with XPR
            Network
          </div>
        </div>
      ) : (
        <div className='flex items-center justify-center gap-3'>
          <span
            className='bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold flex items-center gap-2'
            role='status'
            aria-live='polite'
          >
            <svg
              className='w-4 h-4'
              fill='currentColor'
              viewBox='0 0 20 20'
              aria-hidden='true'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            Wallet Connected
          </span>
          <button
            onClick={onDisconnect}
            className='btn-danger'
            aria-label='Disconnect wallet'
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
