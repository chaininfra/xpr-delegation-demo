/**
 * StakeResources Component
 *
 * Interface for staking and unstaking XPR tokens on XPR Network.
 * Provides input fields and controls for managing XPR token staking.
 *
 * Features:
 * - Stake/unstake XPR tokens for network resources
 * - Input validation and error handling
 * - Loading states and transaction feedback
 * - Network-specific token symbol detection
 * - Responsive form design
 *
 * @component
 * @param {Object} account - Account object with XPR token information
 * @param {Function} onStakeResources - Callback to execute XPR staking operations
 * @param {boolean} loading - Loading state for operations
 * @param {string} network - Current network ('testnet' | 'mainnet')
 * @returns {JSX.Element} XPR token staking component
 */
import React, { useState } from 'react';

import { CardLayout } from '../layout';
import type { StakeResourcesProps } from '../types';

const StakeResources: React.FC<StakeResourcesProps> = ({
  account,
  onStakeResources,
  loading,
}) => {
  // Component state management
  const [stakeAmount, setStakeAmount] = useState(''); // Amount to stake/unstake
  const [isStaking, setIsStaking] = useState(false); // Local staking state

  const handleStake = async () => {
    if (!stakeAmount) {
      alert('Please enter amount to stake');
      return;
    }

    setIsStaking(true);
    try {
      await onStakeResources({
        cpu: parseFloat(stakeAmount), // Total XPR amount to stake
        net: 0, // Not used in XPR Network - kept for compatibility
      });

      // Reset form after successful stake
      setStakeAmount('');
    } catch {
      // Error staking XPR tokens
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!stakeAmount) {
      alert('Please enter amount to unstake');
      return;
    }

    setIsStaking(true);
    try {
      await onStakeResources({
        cpu: -parseFloat(stakeAmount), // Negative amount for unstaking XPR
        net: 0, // Not used in XPR Network - kept for compatibility
      });

      // Reset form after successful unstake
      setStakeAmount('');
    } catch {
      // Error unstaking XPR tokens
    } finally {
      setIsStaking(false);
    }
  };

  const canVote = account?.voting_resources?.canVote;

  return (
    <CardLayout title='⚡ Stake XPR Tokens'>
      <div className='space-y-4'>
        {/* Current Resources Info */}
        {account?.total_resources && (
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-gray-600'>Can Vote:</span>
                <div
                  className={`font-medium ${canVote ? 'text-green-600' : 'text-red-600'}`}
                >
                  {canVote ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stake Form */}
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='stake-amount'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Stake Amount (XPR)
              </label>
              <input
                id='stake-amount'
                type='number'
                step='0.0001'
                min='0'
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                placeholder='0.0000'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <button
              onClick={handleStake}
              disabled={isStaking || loading || !stakeAmount}
              className='flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
              aria-label='Stake resources'
            >
              {isStaking ? (
                <span className='flex items-center justify-center gap-2'>
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
                  Staking...
                </span>
              ) : (
                'Stake'
              )}
            </button>

            <button
              onClick={handleUnstake}
              disabled={isStaking || loading || !stakeAmount}
              className='flex-1 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
              aria-label='Unstake resources'
            >
              {isStaking ? (
                <span className='flex items-center justify-center gap-2'>
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
                  Unstaking...
                </span>
              ) : (
                'Unstake'
              )}
            </button>
          </div>
        </div>

        {/* Info Message */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start'>
            <svg
              className='w-5 h-5 text-blue-500 mr-2 mt-0.5'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
            <div className='text-sm text-blue-800'>
              <p className='font-medium mb-1'>
                About Short Staking (XPR Network):
              </p>
              <ul className='list-disc list-inside space-y-1 text-xs'>
                <li>
                  Stake XPR to participate in voting for Block Producers (choose
                  up to 4)
                </li>
                <li>
                  Receive block rewards after 24 hours based on variable APR
                </li>
                <li>APR increases as on-chain token supply increases</li>
                <li>Unstaking takes 24 hours to complete</li>
                <li>More staked resources = more voting power</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </CardLayout>
  );
};

export default StakeResources;
