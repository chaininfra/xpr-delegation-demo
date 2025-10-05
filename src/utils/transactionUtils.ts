/**
 * Transaction ID Formatting Utilities
 *
 * Provides utilities for formatting transaction IDs with shortened display
 * and explorer links for XPR Network transactions.
 *
 * Features:
 * - Shortened transaction ID display (first 8 + last 8 characters)
 * - Explorer URL generation based on network
 * - Clickable links to transaction details
 * - Support for both testnet and mainnet
 *
 * @fileoverview Transaction ID formatting utilities
 */

import type { NetworkType } from '../types';

/**
 * Format transaction ID for display (shortened version)
 * @param transactionId - Full transaction ID
 * @returns Formatted transaction ID string
 */
export const formatTransactionId = (transactionId: string): string => {
  if (!transactionId || transactionId === 'No transaction ID') {
    return 'No transaction ID';
  }

  // If transaction ID is too short, return as is
  if (transactionId.length <= 16) {
    return transactionId;
  }

  // Return shortened format: first 8 + ... + last 8 characters
  return `${transactionId.substring(0, 8)}...${transactionId.substring(transactionId.length - 8)}`;
};

/**
 * Generate explorer URL for transaction
 * @param transactionId - Full transaction ID
 * @param network - Network type (testnet/mainnet)
 * @returns Explorer URL string
 */
export const getExplorerUrl = (
  transactionId: string,
  network: NetworkType
): string => {
  if (!transactionId || transactionId === 'No transaction ID') {
    return '#';
  }

  const baseUrls = {
    testnet: 'https://testnet.explorer.xprnetwork.org',
    mainnet: 'https://explorer.xprnetwork.org',
  };

  return `${baseUrls[network]}/transaction/${transactionId}`;
};

/**
 * Generate transaction ID display with link
 * @param transactionId - Full transaction ID
 * @param network - Network type (testnet/mainnet)
 * @returns Object with formatted ID and explorer URL
 */
export const getTransactionDisplay = (
  transactionId: string,
  network: NetworkType
): {
  formattedId: string;
  explorerUrl: string;
  hasValidId: boolean;
} => {
  const formattedId = formatTransactionId(transactionId);
  const explorerUrl = getExplorerUrl(transactionId, network);
  const hasValidId = Boolean(
    transactionId && transactionId !== 'No transaction ID'
  );

  return {
    formattedId,
    explorerUrl,
    hasValidId,
  };
};

/**
 * Extract transaction ID from various result formats
 * @param result - Transaction result object
 * @returns Extracted transaction ID string
 */
export const extractTransactionId = (
  result: Record<string, unknown>
): string => {
  if (!result) {
    return 'No transaction ID';
  }

  // Comprehensive fallback options for different ProtonSDK response formats
  return (
    (result.transaction_id as string) ||
    (result.id as string) ||
    (result.transactionId as string) ||
    (result.txid as string) ||
    (result.tx_id as string) ||
    ((result.processed as Record<string, unknown>)?.id as string) ||
    ((result.processed as Record<string, unknown>)?.transaction_id as string) ||
    ((
      (result.processed as Record<string, unknown>)?.trx as Record<
        string,
        unknown
      >
    )?.id as string) ||
    'No transaction ID'
  );
};
