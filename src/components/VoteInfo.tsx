/**
 * VoteInfo Component
 *
 * Displays comprehensive voting information for connected XPR Network accounts.
 * Shows account stake details, voting resources, and current vote status.
 *
 * Features:
 * - Account stake information (CPU/NET/Total)
 * - Voting resources availability
 * - Current vote status and voted producers
 * - Real-time data updates
 * - Responsive card layout
 *
 * @component
 * @param {Object} account - Account object with voting and resource data
 * @returns {JSX.Element} Voting information component
 */
import React from 'react';

import CardLayout from '../layout/CardLayout.jsx';
import type { VoteInfoProps } from '../types';

const VoteInfo: React.FC<VoteInfoProps> = ({ account }) => {
  // Extract voting data from account object
  const voteInfo = account?.vote_info;
  const votingResources = account?.voting_resources;

  return (
    <CardLayout className='bg-white border-gray-200'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
          <span className='mr-2'>🗳️</span>
          Voting Information
        </h3>
      </div>

      <div className='px-6 py-4 space-y-4'>
        {/* Account Stake Information */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h4 className='text-sm font-semibold text-blue-900 mb-2'>
            Account Stake
          </h4>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-gray-600'>Core Balance:</span>
              <div className='font-medium text-gray-900'>
                {account?.core_liquid_balance || '0.0000 XPR'}
              </div>
            </div>
            <div>
              <span className='text-gray-600'>All Balances:</span>
              <div className='font-medium text-gray-900'>
                {account?.all_balances?.length || 0} tokens
              </div>
            </div>
          </div>
        </div>

        {/* Voting Resources */}
        {votingResources && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <h4 className='text-sm font-semibold text-green-900 mb-2'>
              Voting Resources
            </h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-gray-600'>Can Vote:</span>
                <div
                  className={`font-medium ${votingResources.canVote ? 'text-green-600' : 'text-red-600'}`}
                >
                  {votingResources.canVote ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <span className='text-gray-600'>CPU Available:</span>
                <div className='font-medium text-gray-900'>
                  {votingResources.cpuAvailable?.toLocaleString() || 0} μs
                </div>
              </div>
              <div>
                <span className='text-gray-600'>NET Available:</span>
                <div className='font-medium text-gray-900'>
                  {votingResources.netAvailable?.toLocaleString() || 0} bytes
                </div>
              </div>
              <div>
                <span className='text-gray-600'>RAM Available:</span>
                <div className='font-medium text-gray-900'>
                  {votingResources.ramAvailable?.toLocaleString() || 0} bytes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vote Information */}
        {voteInfo ? (
          <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
            <h4 className='text-sm font-semibold text-purple-900 mb-2'>
              Current Votes
            </h4>
            <div className='space-y-2 text-sm'>
              <div>
                <span className='text-gray-600'>Owner:</span>
                <div className='font-medium text-gray-900'>
                  {voteInfo.owner}
                </div>
              </div>
              <div>
                <span className='text-gray-600'>Proxy:</span>
                <div className='font-medium text-gray-900'>
                  {voteInfo.proxy || 'None'}
                </div>
              </div>
              <div>
                <span className='text-gray-600'>Staked:</span>
                <div className='font-medium text-gray-900'>
                  {(voteInfo.staked / 10000).toFixed(4) + ' XPR' ||
                    '0.0000 XPR'}
                </div>
              </div>
              <div>
                <span className='text-gray-600'>Last Vote Weight:</span>
                <div className='font-medium text-gray-900'>
                  {voteInfo.last_vote_weight || '0'}
                </div>
              </div>
              {voteInfo.producers && voteInfo.producers.length > 0 && (
                <div>
                  <span className='text-gray-600'>Voted Producers:</span>
                  <div className='mt-1 space-y-1'>
                    {voteInfo.producers.map((producer, index) => (
                      <div
                        key={index}
                        className='text-xs bg-gray-100 px-2 py-1 rounded'
                      >
                        {producer}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <div className='text-center text-gray-600'>
              <div className='text-sm'>No voting information available</div>
              <div className='text-xs mt-1'>
                This account has not voted for any Block Producers yet
              </div>
            </div>
          </div>
        )}
      </div>
    </CardLayout>
  );
};

export default VoteInfo;
