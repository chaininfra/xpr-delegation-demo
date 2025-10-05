/**
 * XPR Delegation Demo - Main Application Component
 *
 * This component manages the overall application state and coordinates
 * between wallet connection, blockchain operations, and UI components.
 *
 * Key Features:
 * - Wallet connection and session management
 * - Account information and voting data management
 * - Block producer selection and vote delegation
 * - Resource staking and unstaking
 * - Network switching (testnet/mainnet)
 *
 * @component
 * @returns {JSX.Element} The main application component
 */
import React, { useState, useEffect, useRef } from 'react';

import { HomePage, TransferPage } from './pages/index';
import { smartCache, CacheKeys } from './utils/SmartCache';
import { RefreshTriggers } from './utils/RefreshTriggers';
import {
  connectWallet,
  disconnectWallet,
  delegateVotes,
  getAccountInfo,
  getBlockProducers,
  checkExistingSession,
  stakeResources,
  unstakeResources,
  getVoteInfo,
  checkVotingResources,
} from './services';
import { transferTokens, clearTransferCache } from './services/token';
import { extractTransactionId } from './utils/transactionUtils';
import type {
  WalletInstance as Wallet,
  AccountInfo,
  BlockProducer,
  NetworkType,
  StakeData,
  TransferData,
} from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const App: React.FC = () => {
  // Application state management
  const [wallet, setWallet] = useState<Wallet | null>(null); // Connected wallet instance
  const [account, setAccount] = useState<AccountInfo | null>(null); // Account information and voting data
  const [blockProducers, setBlockProducers] = useState<BlockProducer[]>([]); // List of available block producers
  const [selectedBPs, setSelectedBPs] = useState<string[]>([]); // Currently selected block producers (max 4)
  const [loading, setLoading] = useState<boolean>(false); // Loading state for async operations
  const [message, setMessage] = useState<any>(null); // Status messages for user feedback
  const [network, setNetwork] = useState<NetworkType>('testnet'); // Current network (testnet/mainnet)
  const [currentPage, setCurrentPage] = useState<'home' | 'transfer'>('home'); // Current page

  // Performance optimization: prevent duplicate API calls
  const dataLoadedRef = useRef<boolean>(false); // Track if data has been loaded
  const currentWalletRef = useRef<string | null>(null); // Track current wallet/network combination

  /**
   * Check for existing wallet session on component mount and network changes
   * This allows users to maintain their connection across page refreshes
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const existingSession = await checkExistingSession(network);

        if (existingSession) {
          setWallet(existingSession);
          setAccount(existingSession.account);

          const sessionMessage = {
            type: 'success' as const,
            text: `Restored session for ${existingSession.account.account_name}`,
          };

          // Debug: Log the message being set
          // eslint-disable-next-line no-console
          console.log(
            '[App] Setting restored session message:',
            sessionMessage
          );

          setMessage(sessionMessage);
        }
      } catch {
        // Session check failed, continue without session
        // eslint-disable-next-line no-console
        console.log('No existing session found');
      }
    };

    checkSession();
  }, [network]);

  /**
   * Cleanup effect to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (typeof window !== 'undefined') {
        // Clear any pending timeouts
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < Number(highestTimeoutId); i++) {
          clearTimeout(i);
        }

        // Clear any pending intervals
        const highestIntervalId = setInterval(() => {}, 0);
        for (let i = 0; i < Number(highestIntervalId); i++) {
          clearInterval(i);
        }
      }
    };
  }, []);

  /**
   * Load detailed account info and block producers when wallet is connected
   * Uses smart caching to prevent unnecessary API calls
   */
  useEffect(() => {
    if (wallet && wallet.session) {
      // Check if this is the same wallet and data hasn't been loaded yet
      const walletKey = `${wallet.account.account_name}-${network}`;

      if (currentWalletRef.current === walletKey && dataLoadedRef.current) {
        return; // Skip if already loaded for this wallet/network combination
      }

      const loadData = async () => {
        try {
          const accountName = wallet.account.account_name;

          // Check cache first to avoid unnecessary API calls
          const accountCacheKey = CacheKeys.account(accountName, network);
          const voteCacheKey = CacheKeys.voteInfo(accountName, network);
          const resourcesCacheKey = CacheKeys.votingResources(
            accountName,
            network
          );
          const producersCacheKey = CacheKeys.blockProducers(network);

          let detailedAccount: AccountInfo;
          let freshVoteInfo: any;
          let votingResources: any;
          let bps: any[];

          // Use cached data if available and fresh
          if (
            smartCache.get(accountCacheKey) &&
            !smartCache.isStale(accountCacheKey)
          ) {
            detailedAccount = smartCache.get(accountCacheKey)!;
          } else {
            detailedAccount = await getAccountInfo(
              accountName,
              network,
              wallet.session
            );
          }

          if (
            smartCache.get(voteCacheKey) &&
            !smartCache.isStale(voteCacheKey)
          ) {
            freshVoteInfo = smartCache.get(voteCacheKey);
          } else {
            freshVoteInfo = await getVoteInfo(
              accountName,
              network,
              wallet.session
            );
          }

          if (
            smartCache.get(resourcesCacheKey) &&
            !smartCache.isStale(resourcesCacheKey)
          ) {
            votingResources = smartCache.get(resourcesCacheKey);
          } else {
            votingResources = await checkVotingResources(accountName, network);
          }

          if (
            smartCache.get(producersCacheKey) &&
            !smartCache.isStale(producersCacheKey)
          ) {
            bps = smartCache.get(producersCacheKey)!;
          } else {
            bps = await getBlockProducers(network, wallet.session);
          }

          // Merge detailed account with fresh vote info
          const accountWithVoteInfo = {
            ...detailedAccount,
            vote_info: freshVoteInfo || wallet.account.vote_info,
            voting_resources:
              votingResources || wallet.account.voting_resources,
          };

          setAccount(accountWithVoteInfo);
          setBlockProducers(bps);

          // Mark as loaded to prevent duplicate calls
          dataLoadedRef.current = true;
          currentWalletRef.current = walletKey;
        } catch {
          setMessage({
            type: 'error',
            text: 'Failed to load account data',
          });
          // Don't retry on error to prevent infinite loops
        }
      };
      loadData();
    } else {
      // Reset tracking when wallet disconnects
      dataLoadedRef.current = false;
      currentWalletRef.current = null;
    }
  }, [wallet, network]); // Only trigger when wallet or network changes

  /**
   * Handle wallet connection
   * Initiates wallet connection process and updates application state
   */
  const handleConnectWallet = async (): Promise<void> => {
    setLoading(true);
    setMessage(null);

    try {
      const walletInstance = await connectWallet(network);
      setWallet(walletInstance);

      if (walletInstance.account) {
        setAccount(walletInstance.account);

        // Trigger intelligent refresh for wallet connection
        RefreshTriggers.onWalletConnect(
          walletInstance.account.account_name,
          network
        );

        setMessage({
          type: 'success',
          text: `Connected to ${walletInstance.account.account_name}`,
        });
      }
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to connect wallet',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle wallet disconnection
   * Clears wallet state and resets application to initial state
   */
  const handleDisconnectWallet = async (): Promise<void> => {
    try {
      await disconnectWallet();
      setWallet(null);
      setAccount(null);
      setSelectedBPs([]);
      setBlockProducers([]); // Clear block producers when disconnecting

      // Reset performance tracking
      dataLoadedRef.current = false;
      currentWalletRef.current = null;

      setMessage({
        type: 'info',
        text: 'Wallet disconnected',
      });
    } catch {
      // Ignore disconnect errors
    }
  };

  /**
   * Handle Block Producer selection (toggle)
   * Adds to selection if not selected, removes if already selected
   * Maximum 4 producers can be selected
   */
  const handleSelectBP = (bpName: string): void => {
    setSelectedBPs(prev => {
      if (prev.includes(bpName)) {
        // Remove if already selected
        return prev.filter(name => name !== bpName);
      } else if (prev.length < 4) {
        // Add if not at max limit
        return [...prev, bpName];
      }
      // Don't add if at max limit
      return prev;
    });
  };

  /**
   * Handle vote delegation to selected Block Producers
   * Validates inputs, executes delegation, and refreshes account data
   */
  const handleDelegateVotes = async (
    producerNames?: string[]
  ): Promise<void> => {
    // Use producerNames parameter or fallback to selectedBPs
    const bpsToVote = producerNames || selectedBPs;

    // Validate required inputs
    if (!bpsToVote || bpsToVote.length === 0 || !account || !wallet) {
      setMessage({
        type: 'warning',
        text: 'Please select Block Producers and ensure wallet is connected',
      });
      return;
    }

    // Ensure we have a valid account name
    const accountName = account.account_name;
    if (!accountName) {
      setMessage({
        type: 'error',
        text: 'Account name not found. Please reconnect your wallet.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Execute vote delegation using session RPC client
      const result = await delegateVotes(
        accountName,
        bpsToVote, // Use the BPs to vote for
        network,
        wallet.session
      );

      setMessage({
        type: 'success',
        text: `Successfully delegated votes to ${bpsToVote.length} producer${bpsToVote.length !== 1 ? 's' : ''}! Transaction ID: ${result.transactionId}`,
      });

      // Trigger intelligent refresh for vote delegation
      RefreshTriggers.onVoteDelegated(accountName, network);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to delegate votes',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle network switching between testnet and mainnet
   * Resets application state and clears cached data
   */
  const handleNetworkChange = (newNetwork: NetworkType): void => {
    setNetwork(newNetwork);
    setWallet(null);
    setAccount(null);
    setSelectedBPs([]);
    setBlockProducers([]); // Clear block producers when changing network

    // Reset performance tracking when changing network
    dataLoadedRef.current = false;
    currentWalletRef.current = null;

    setMessage(null);
  };

  /**
   * Handle resource staking and unstaking operations
   * Determines operation type based on input values and refreshes account data
   */
  const handleStakeResources = async (stakeData: StakeData): Promise<void> => {
    // Validate wallet connection
    if (!wallet || !account) {
      setMessage({
        type: 'error',
        text: 'Please connect your wallet first',
      });
      return;
    }

    const accountName = account.account_name;
    if (!accountName) {
      setMessage({
        type: 'error',
        text: 'Account name not found. Please reconnect your wallet.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Determine if this is stake or unstake based on values
      const isUnstake = stakeData.cpu < 0 || stakeData.net < 0;

      const result = isUnstake
        ? await unstakeResources(
            accountName,
            {
              cpu: Math.abs(stakeData.cpu),
              net: Math.abs(stakeData.net),
            },
            network,
            wallet.session
          )
        : await stakeResources(accountName, stakeData, network, wallet.session);

      setMessage({
        type: 'success',
        text: `Successfully ${isUnstake ? 'unstaked' : 'staked'} resources! Transaction ID: ${result.transactionId}`,
      });

      // Refresh account info and voting info to show updated resources
      try {
        const [updatedAccount, voteInfo, votingResources] = await Promise.all([
          getAccountInfo(accountName, network, wallet.session),
          getVoteInfo(accountName, network, wallet.session),
          checkVotingResources(accountName, network),
        ]);

        // Merge updated account with fresh voting info
        const accountWithVoteInfo = {
          ...updatedAccount,
          vote_info: voteInfo || undefined,
          voting_resources: votingResources,
        };

        setAccount(accountWithVoteInfo);
      } catch {
        // Ignore refresh errors
      }
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: `Error ${stakeData.cpu < 0 || stakeData.net < 0 ? 'unstaking' : 'staking'} resources: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle token transfer
   */
  const handleTransfer = async (transferData: TransferData): Promise<void> => {
    if (!wallet?.session) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await transferTokens(
        transferData,
        wallet.session as any,
        network
      );

      // Extract transaction ID using utility function
      const transactionId = extractTransactionId(
        result as Record<string, unknown>
      );

      setMessage({
        type: 'success',
        text: `Successfully transferred ${transferData.quantity} to ${transferData.to}! Transaction ID: ${transactionId}`,
      });

      // Clear cache after successful transfer
      clearTransferCache(transferData.from);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: `Transfer failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigation handlers
   */
  const navigateToPage = (page: 'home' | 'transfer') => {
    setCurrentPage(page);
    // Don't clear message on navigation - let user see important messages
  };

  /**
   * Render current page based on routing
   */
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'transfer':
        return (
          <TransferPage
            wallet={wallet}
            account={account}
            loading={loading}
            network={network}
            handleTransfer={handleTransfer}
            message={message}
          />
        );
      default:
      case 'home':
        return (
          <HomePage
            wallet={wallet}
            account={account}
            blockProducers={blockProducers}
            selectedBPs={selectedBPs}
            loading={loading}
            message={message}
            network={network}
            handleConnectWallet={handleConnectWallet}
            handleDisconnectWallet={handleDisconnectWallet}
            handleDelegateVotes={handleDelegateVotes}
            handleNetworkChange={handleNetworkChange}
            handleStakeResources={handleStakeResources}
            handleSelectBP={handleSelectBP}
            navigateToTransfer={() => navigateToPage('transfer')}
          />
        );
    }
  };

  return (
    <>
      {/* Navigation Header */}
      <nav className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center space-x-8'>
              {/* Logo/Title */}
              <div className='flex-shrink-0 flex items-center space-x-3'>
                <img
                  src='/logo/logo.svg'
                  alt='XPR Delegation Demo'
                  className='h-8 w-8'
                  onError={e => {
                    // Fallback to PNG if SVG fails to load
                    e.currentTarget.src = '/logo/logo.png';
                  }}
                />
                <h1 className='text-xl font-bold text-gray-900'>
                  XPR Delegation Demo
                </h1>
              </div>

              {/* Navigation Links */}
              <div className='hidden md:flex space-x-8'>
                <button
                  onClick={() => navigateToPage('home')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'home'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => navigateToPage('transfer')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'transfer'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Transfer
                </button>
              </div>
            </div>

            {/* Wallet Connection Status */}
            <div className='flex items-center space-x-4'>
              {wallet && account && (
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <span>💼</span>
                  <span>{account.account_name}</span>
                  <span className='text-gray-400'>|</span>
                  <span className='capitalize'>{network}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className='md:hidden'>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              <button
                onClick={() => navigateToPage('home')}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  currentPage === 'home'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateToPage('transfer')}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  currentPage === 'transfer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {renderCurrentPage()}
    </>
  );
};

export default App;
