import React from 'react';

import {
  NetworkSelector,
  NetworkInfo,
  WalletConnection,
  VoteInfo,
  StakeResources,
  BlockProducerSelector,
  StatusMessage,
} from '../components';

import type { HomePageProps } from '../types';

const HomePage: React.FC<HomePageProps> = ({
  wallet,
  account,
  blockProducers,
  selectedBPs,
  loading,
  message,
  network,
  handleConnectWallet,
  handleDisconnectWallet,
  handleDelegateVotes,
  handleNetworkChange,
  handleStakeResources,
  handleSelectBP,
  navigateToTransfer,
}) => {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      {/* Status Message */}
      <StatusMessage message={message} network={network} />

      <div className='max-w-4xl mx-auto px-4'>
        {/* Header */}
        <div className='text-center mb-8 pb-6 border-b-2 border-gray-100'>
          <div className="flex justify-center mb-4">
            <img
              src="/logo/logo.svg"
              alt="XPR Logo"
              className="h-20 w-20"
              draggable={false}
            />
          </div>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3'>
            XPR Delegation Demo
          </h1>
          <p className='text-lg text-gray-600 font-light'>
            Delegate your votes to Block Producers on XPR Network
          </p>
        </div>

        <div className='space-y-6'>
          <NetworkSelector
            network={network}
            onNetworkChange={handleNetworkChange}
          />

          <NetworkInfo network={network} />

          <WalletConnection
            wallet={wallet}
            loading={loading}
            onConnect={handleConnectWallet}
            onDisconnect={handleDisconnectWallet}
          />

          {/* Transfer Tokens Section */}
          {wallet && account && (
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                    Transfer Tokens
                  </h3>
                  <p className='text-sm text-gray-600'>
                    Send XPR and other tokens to any account
                  </p>
                </div>
                <button
                  onClick={navigateToTransfer}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
                >
                  Go to Transfer
                </button>
              </div>
            </div>
          )}

          {wallet && account && <VoteInfo account={account} />}

          {wallet && account && (
            <StakeResources
              account={account}
              onStakeResources={handleStakeResources}
              loading={loading}
              network={network}
            />
          )}

          {wallet && account && (
            <BlockProducerSelector
              blockProducers={blockProducers}
              selectedBPs={selectedBPs}
              onSelectBP={handleSelectBP}
              onDelegateVotes={handleDelegateVotes}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
