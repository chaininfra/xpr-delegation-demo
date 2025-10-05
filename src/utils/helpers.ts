/**
 * XPR Network Utility Functions
 *
 * Collection of utility functions for XPR Network operations.
 * Provides validation, formatting, and helper functions for the application.
 *
 * Features:
 * - Account name validation
 * - Balance and resource formatting
 * - String manipulation utilities
 * - Data transformation helpers
 * - Default value creators
 *
 * @fileoverview Utility functions for XPR Delegation Demo
 */
/* eslint-disable no-prototype-builtins */

import type { AccountInfo } from '../types';

/**
 * Validate Block Producer name according to XPR Network rules
 * @param bpName - Block Producer name to validate
 * @returns True if valid XPR account name format
 */
export const validateBPName = (bpName: string | null | undefined): boolean => {
  if (!bpName || typeof bpName !== 'string') return false;
  // XPR account names must be 4-12 characters, only lowercase letters and numbers 1-5
  const regex = /^[a-z1-5]{4,12}$/;
  return regex.test(bpName);
};

/**
 * Format account balance
 * @param balance - Balance amount
 * @param symbol - Token symbol (default: XPR)
 * @returns Formatted balance string
 */
export const formatBalance = (
  balance: string | number | null | undefined,
  symbol: string = 'XPR'
): string => {
  if (!balance) return '0.0000 XPR';

  const amount = parseFloat(String(balance));
  return `${amount.toFixed(4)} ${symbol}`;
};

/**
 * Format resource usage
 * @param used - Used amount
 * @param max - Maximum amount
 * @returns Formatted usage string
 */
export const formatResourceUsage = (
  used: number | null | undefined,
  max: number | null | undefined
): string => {
  if ((!used && used !== 0) || (!max && max !== 0)) return '0 / 0';

  const usedNum = parseInt(String(used));
  const maxNum = parseInt(String(max));
  const percentage = maxNum > 0 ? ((usedNum / maxNum) * 100).toFixed(1) : '0.0';

  return `${usedNum.toLocaleString()} / ${maxNum.toLocaleString()} (${percentage}%)`;
};

/**
 * Format percentage
 * @param value - Value to format
 * @param total - Total value
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number | null | undefined,
  total: number | null | undefined
): string => {
  if ((!value && value !== 0) || (!total && total !== 0)) return '0%';

  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  return `${percentage}%`;
};

/**
 * Truncate string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export const truncateString = (
  str: string | null | undefined,
  maxLength: number = 20
): string => {
  if (!str || str.length <= maxLength) return str || '';
  return str.substring(0, maxLength) + '...';
};

/**
 * Format transaction ID for display
 * @param txId - Transaction ID
 * @returns Formatted transaction ID
 */
export const formatTransactionId = (
  txId: string | null | undefined
): string => {
  if (!txId) return 'N/A';

  if (txId.length <= 16) return txId;

  return `${txId.substring(0, 8)}...${txId.substring(txId.length - 8)}`;
};

/**
 * Format block number for display
 * @param blockNum - Block number
 * @returns Formatted block number
 */
export const formatBlockNumber = (
  blockNum: number | null | undefined
): string => {
  if (!blockNum && blockNum !== 0) return 'N/A';

  return blockNum.toLocaleString();
};

/**
 * Get network display name
 * @param network - Network name
 * @returns Display name
 */
export const getNetworkDisplayName = (network: string): string => {
  const displayNames: Record<string, string> = {
    testnet: 'Testnet',
    mainnet: 'Mainnet',
  };

  return displayNames[network] || network;
};

/**
 * Check if value is empty or null
 * @param value - Value to check
 * @returns True if empty or null
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmpty = (value: any): boolean => {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

/**
 * Create default account info structure
 * @param accountName - Account name
 * @returns Default account info structure
 */
export const createDefaultAccountInfo = (accountName: string): AccountInfo => {
  return {
    account_name: accountName,
    core_liquid_balance: '0.0000 XPR',
    all_balances: [], // Empty array for all balances
    ram_usage: 0,
    ram_quota: 0,
    cpu_limit: { used: 0, max: 0 },
    net_limit: { used: 0, max: 0 },
  };
};

/**
 * Deep clone object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};
