/**
 * Router Component - XPR Delegation Demo
 *
 * Centralized routing management for the application.
 * Handles page navigation and URL parameter processing.
 *
 * @fileoverview Router component for page management
 */

import React, { useEffect } from 'react';
import { HomePage, TransferPage, RequestPage } from '../pages/index';
import {
  parsePaymentRequestUrl,
  hasPaymentRequestInUrl,
  clearPaymentRequestFromUrl,
} from '../utils/urlUtils';
import type {
  WalletInstance as Wallet,
  AccountInfo,
  BlockProducer,
  NetworkType,
  RequestPaymentData,
  Message,
} from '../types';

export type PageType = 'home' | 'transfer' | 'request';

interface RouterProps {
  // Current page state
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;

  // Wallet and account state
  wallet: Wallet | null;
  account: AccountInfo | null;

  // URL data state
  pendingTransferData: RequestPaymentData | null;
  setPendingTransferData: (data: RequestPaymentData | null) => void;
  urlRequestData: RequestPaymentData | null;
  setUrlRequestData: (data: RequestPaymentData | null) => void;

  // Message state
  message: Message | null;
  setMessage: (message: Message | null) => void;

  // Handler functions
  handleConnectWallet: () => Promise<void>;
  handleDisconnectWallet: () => Promise<void>;
  handleDelegateVotes: (producerNames?: string[]) => Promise<void>;
  handleNetworkChange: (network: NetworkType) => void;
  handleStakeResources: (stakeData: any) => Promise<void>;
  handleSelectBP: (bpName: string) => void;
  handleTransfer: (transferData: any) => Promise<void>;
  handleRequest: (requestData: RequestPaymentData) => Promise<void>;

  // Other props
  blockProducers: BlockProducer[];
  selectedBPs: string[];
  loading: boolean;
  network: NetworkType;
}

/**
 * Router - Centralized routing component
 */
const Router: React.FC<RouterProps> = ({
  currentPage,
  setCurrentPage,
  wallet,
  account,
  pendingTransferData,
  setPendingTransferData,
  urlRequestData,
  setUrlRequestData,
  message,
  setMessage,
  handleConnectWallet,
  handleDisconnectWallet,
  handleDelegateVotes,
  handleNetworkChange,
  handleStakeResources,
  handleSelectBP,
  handleTransfer,
  handleRequest,
  blockProducers,
  selectedBPs,
  loading,
  network,
}) => {
  /**
   * Check for payment request URL parameters on component mount
   */
  useEffect(() => {
    const checkUrlParams = () => {
      if (hasPaymentRequestInUrl()) {
        const requestData = parsePaymentRequestUrl();
        if (requestData) {
          console.log('Router: Setting pendingTransferData:', requestData);
          setPendingTransferData(requestData);

          // If wallet is already connected, go directly to transfer page
          if (wallet && account) {
            setCurrentPage('transfer');
            setMessage({
              type: 'info',
              text: `Payment request link opened: ${requestData.amount} from ${requestData.recipient}`,
            });
          } else {
            // If wallet not connected, stay on current page but show connect prompt
            setMessage({
              type: 'warning',
              text: `Please connect your wallet to process payment request: ${requestData.amount} from ${requestData.recipient}`,
            });
          }
        }
      }
    };

    checkUrlParams();
  }, [wallet, account, setPendingTransferData, setCurrentPage, setMessage]);

  /**
   * Handle wallet connection success - redirect to transfer if pending data
   */
  useEffect(() => {
    if (
      wallet &&
      account &&
      pendingTransferData &&
      currentPage !== 'transfer'
    ) {
      setCurrentPage('transfer');
      setMessage({
        type: 'success',
        text: `Connected! Processing payment request: ${pendingTransferData.amount} from ${pendingTransferData.recipient}`,
      });
    }
  }, [
    wallet,
    account,
    pendingTransferData,
    currentPage,
    setCurrentPage,
    setMessage,
  ]);

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
            pendingTransferData={pendingTransferData}
            onClearPendingData={() => {
              setPendingTransferData(null);
              clearPaymentRequestFromUrl();
            }}
          />
        );
      case 'request':
        return (
          <RequestPage
            wallet={wallet}
            account={account}
            loading={loading}
            network={network}
            handleRequest={handleRequest}
            message={message}
            urlRequestData={urlRequestData}
            onClearUrlData={() => {
              setUrlRequestData(null);
              clearPaymentRequestFromUrl();
            }}
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
            navigateToTransfer={() => setCurrentPage('transfer')}
          />
        );
    }
  };

  return <>{renderCurrentPage()}</>;
};

export default Router;
