/**
 * URL Generator for Payment Requests
 *
 * Utility functions for creating shareable payment request URLs
 * and parsing URL parameters to pre-fill request forms.
 *
 * @fileoverview URL utilities for payment requests
 */

import type { RequestPaymentData } from '../types';

/**
 * Generate a shareable payment request URL
 * @param requestData - Payment request data
 * @param baseUrl - Base URL of the application (optional)
 * @returns Complete URL with query parameters
 */
export const generatePaymentRequestUrl = (
  requestData: RequestPaymentData,
  baseUrl?: string
): string => {
  const base = baseUrl || window.location.origin;
  const params = new URLSearchParams();

  // Add request data as query parameters
  params.set('recipient', requestData.recipient);
  params.set('amount', encodeURIComponent(requestData.amount));
  params.set('memo', encodeURIComponent(requestData.memo || ''));
  params.set('symbol', requestData.symbol || 'XPR');

  // Add timestamp for uniqueness
  params.set('timestamp', Date.now().toString());

  return `${base}/?page=transfer&${params.toString()}`;
};

/**
 * Parse URL parameters to extract payment request data
 * @param url - URL to parse (optional, defaults to current URL)
 * @returns Parsed request data or null if invalid
 */
export const parsePaymentRequestUrl = (
  url?: string
): RequestPaymentData | null => {
  try {
    const targetUrl = url || window.location.href;
    const urlObj = new URL(targetUrl);
    const params = urlObj.searchParams;

    // Check if this is a payment request URL
    const page = params.get('page');
    if (page !== 'transfer') {
      return null;
    }

    const recipient = params.get('recipient');
    const amount = params.get('amount');
    const memo = params.get('memo') || '';
    const symbol = params.get('symbol') || 'XPR';

    console.log('Parsed URL parameters:', { recipient, amount, memo, symbol });

    // Validate required fields
    if (!recipient || !amount) {
      console.log('Missing required fields:', { recipient, amount });
      return null;
    }

    // Decode URL-encoded values
    const decodedAmount = decodeURIComponent(amount);
    const decodedMemo = decodeURIComponent(memo);

    console.log('Decoded values:', { decodedAmount, decodedMemo });

    return {
      recipient,
      amount: decodedAmount,
      memo: decodedMemo,
      symbol,
    };
  } catch (error) {
    console.error('Error parsing payment request URL:', error);
    return null;
  }
};

/**
 * Check if current URL contains payment request parameters
 * @returns True if URL contains payment request data
 */
export const hasPaymentRequestInUrl = (): boolean => {
  return parsePaymentRequestUrl() !== null;
};

/**
 * Clear payment request parameters from URL
 * @param baseUrl - Base URL to redirect to (optional)
 */
export const clearPaymentRequestFromUrl = (): void => {
  try {
    const url = new URL(window.location.href);

    // Remove payment request parameters
    url.searchParams.delete('page');
    url.searchParams.delete('recipient');
    url.searchParams.delete('amount');
    url.searchParams.delete('memo');
    url.searchParams.delete('symbol');
    url.searchParams.delete('timestamp');

    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('Error clearing payment request from URL:', error);
  }
};

/**
 * Copy payment request URL to clipboard
 * @param requestData - Payment request data
 * @returns Promise that resolves when URL is copied
 */
export const copyPaymentRequestUrl = async (
  requestData: RequestPaymentData
): Promise<void> => {
  try {
    const url = generatePaymentRequestUrl(requestData);

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  } catch (error) {
    console.error('Error copying payment request URL:', error);
    throw new Error('Failed to copy URL to clipboard');
  }
};
