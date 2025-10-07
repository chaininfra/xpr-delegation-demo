/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TransferPage Component - XPR Delegation Demo
 *
 * Complete token transfer page with wallet integration,
 * token selection, and transfer execution.
 *
 * @fileoverview Main transfer page component
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { TransferPageProps, TokenBalance, TransferData } from '../types';
import TokenSelector from '../components/TokenSelector';
import TransferForm from '../components/TransferForm';
import StatusMessage from '../components/StatusMessage';
import { tokenService } from '../services/token';

/**
 * TransferPage - Main token transfer interface
 */
const TransferPage: React.FC<TransferPageProps> = ({
  wallet,
  account,
  loading: globalLoading,
  network,
  handleTransfer,
  message,
  pendingTransferData,
  onClearPendingData,
}) => {
  // Local state
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load available tokens for account
   */
  const loadTokens = useCallback(async () => {
    // Double check wallet session is available
    if (!account?.account_name || !wallet?.session) {
      return;
    }

    try {
      setTokensLoading(true);
      setError(null);

      const accountTokens = await tokenService.getTokenBalances(
        account.account_name,
        network,
        wallet.session as any
      );

      setTokens(accountTokens);

      // Auto-select first token if available
      if (accountTokens.length > 0 && !selectedToken) {
        setSelectedToken(accountTokens[0]);
      }
    } catch (err: any) {
      setError(`Failed to load tokens: ${err.message}`);
    } finally {
      setTokensLoading(false);
    }
  }, [account?.account_name, wallet?.session, network, selectedToken]);

  // Load tokens when account and wallet session changes
  useEffect(() => {
    if (!account?.account_name || !wallet?.session) {
      setTokens([]);
      setSelectedToken(null);
      return;
    }

    // Debounce to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      loadTokens();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [account?.account_name, wallet?.session, network, loadTokens]);

  // Clear messages when token selection changes
  useEffect(() => {
    setError(null);
  }, [selectedToken]);

  /**
   * Handle token selection
   */
  const handleTokenSelect = (token: TokenBalance) => {
    setSelectedToken(token);
    setError(null);
  };

  /**
   * Handle transfer execution
   */
  const handleTransferSubmit = async (transferData: TransferData) => {
    try {
      setError(null);

      await handleTransfer(transferData);

      // Refresh tokens after successful transfer
      await loadTokens();
    } catch (err: any) {
      setError(`Transfer failed: ${err.message}`);
    }
  };

  // Determine loading state
  const isLoading = globalLoading || tokensLoading;

  // Check if wallet is connected
  const isWalletConnected = !!wallet && !!account;
  const isEmptyState = !isWalletConnected;
  const noTokens = isWalletConnected && tokens.length === 0 && !tokensLoading;

  return (
    <>
      {/* Status Message */}
      <StatusMessage message={message} network={network} />

      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Page Header */}
          <div className='text-center mb-8'>
            <div className='flex justify-center mb-4'>
              <img
                src='/logo/logo.svg'
                alt='XPR Logo'
                className='h-20 w-20'
                draggable={false}
              />
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Transfer Tokens
            </h1>
            <p className='text-gray-600'>
              Send XPR and other tokens to any XPR account
            </p>
          </div>

          {/* Empty State - No Wallet Connected */}
          {isEmptyState && (
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center'>
              <div className='mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                <svg
                  className='w-8 h-8 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Connect Wallet Required
              </h3>
              <p className='text-gray-600 mb-4'>
                Please connect your XPR wallet to transfer tokens
              </p>
              <button
                onClick={() => (window.location.href = '/')}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Go to Homepage
              </button>
            </div>
          )}

          {/* Connected State with Wallet */}
          {isWalletConnected && (
            <>
              {/* Account Info */}
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Connected Account</p>
                    <p className='font-semibold text-gray-900'>
                      {account.account_name}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-gray-600'>Network</p>
                    <p className='font-semibold text-gray-900 capitalize'>
                      {network}
                    </p>
                  </div>
                </div>
              </div>

              {/* Token Selector */}
              <div className='mb-6'>
                <TokenSelector
                  tokens={tokens}
                  selected={selectedToken}
                  onSelect={handleTokenSelect}
                  loading={tokensLoading}
                  error={error && error.includes('load tokens') ? error : null}
                />
              </div>

              {/* No Tokens State */}
              {noTokens && (
                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center'>
                  <div className='mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                    <svg
                      className='w-8 h-8 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                      />
                    </svg>
                  </div>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    No Token Balances Found
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    No tokens found in your account. You may need to:
                  </p>
                  <ul className='text-left text-gray-600 space-y-1 mb-4'>
                    <li>• Connect your wallet to load actual token balances</li>
                    <li>• Ensure you have tokens in your account</li>
                    <li>• Check if the selected network is correct</li>
                    <li>• Wait for blockchain synchronization</li>
                  </ul>
                  <button
                    onClick={loadTokens}
                    disabled={tokensLoading}
                    className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {tokensLoading ? (
                      <>
                        <svg
                          className='animate-spin -ml-1 mr-2 h-4 w-4'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                        Refreshing...
                      </>
                    ) : (
                      'Refresh Tokens'
                    )}
                  </button>
                </div>
              )}

              {/* Transfer Form */}
              {selectedToken && (
                <TransferForm
                  token={selectedToken}
                  account={account}
                  onTransfer={handleTransferSubmit}
                  loading={isLoading}
                  error={error}
                  pendingTransferData={pendingTransferData}
                  onClearPendingData={onClearPendingData}
                />
              )}
            </>
          )}

          {/* Help Section */}
          <div className='mt-8 bg-blue-50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-blue-900 mb-2'>
              Transfer Information
            </h4>
            <ul className='text-sm text-blue-800 space-y-1'>
              <li>• All transfers are irreversible transactions</li>
              <li>• Transaction fees apply based on network usage</li>
              <li>• Transfers require sufficient token balance</li>
              <li>• Check destination account name carefully</li>
              <li>
                • Memo field is optional but can be useful for record-keeping
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransferPage;
