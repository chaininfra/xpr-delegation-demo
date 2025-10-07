/**
 * ShareableLink Component - XPR Delegation Demo
 *
 * Component for displaying and copying shareable payment request URLs.
 * Provides a user-friendly interface for sharing payment requests.
 *
 * @fileoverview Shareable link component
 */

import React, { useState } from 'react';
import {
  copyPaymentRequestUrl,
  generatePaymentRequestUrl,
} from '../utils/urlUtils';
import type { RequestPaymentData } from '../types';

interface ShareableLinkProps {
  /** Payment request data */
  requestData: RequestPaymentData;
  /** Whether to show the component */
  show: boolean;
  /** Callback when link is copied */
  onCopied?: () => void;
}

/**
 * ShareableLink - Component for sharing payment request URLs
 */
const ShareableLink: React.FC<ShareableLinkProps> = ({
  requestData,
  show,
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  if (!show) {
    return null;
  }

  // Generate shareable URL if not provided
  const shareableUrl =
    requestData.shareableUrl || generatePaymentRequestUrl(requestData);

  /**
   * Handle copy URL to clipboard
   */
  const handleCopyUrl = async () => {
    if (!shareableUrl) return;

    setCopying(true);
    try {
      await copyPaymentRequestUrl(requestData);
      setCopied(true);
      onCopied?.();

      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className='mt-6 bg-green-50 border border-green-200 rounded-md p-4'>
      <div className='flex items-start justify-between mb-3'>
        <div>
          <h4 className='text-sm font-medium text-green-900 mb-1'>
            Payment Request Created Successfully!
          </h4>
          <p className='text-sm text-green-800'>
            Share this link with <strong>{requestData.recipient}</strong> to
            request payment
          </p>
        </div>
      </div>

      {/* URL Display */}
      <div className='bg-white border border-green-200 rounded-md p-3 mb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex-1 min-w-0'>
            <p className='text-xs text-gray-500 mb-1'>Shareable Link:</p>
            <p className='text-sm text-gray-900 break-all font-mono'>
              {shareableUrl}
            </p>
          </div>
        </div>
      </div>

      {/* Copy Button */}
      <div className='flex items-center justify-between'>
        <button
          onClick={handleCopyUrl}
          disabled={copying || !shareableUrl}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
            copied
              ? 'bg-green-600 text-white'
              : copying
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
          }`}
        >
          {copying ? (
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
              Copying...
            </>
          ) : copied ? (
            <>
              <svg
                className='-ml-1 mr-2 h-4 w-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className='-ml-1 mr-2 h-4 w-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                />
              </svg>
              Copy Link
            </>
          )}
        </button>

        <div className='text-xs text-green-700'>
          {copied ? 'Link copied to clipboard!' : 'Click to copy the link'}
        </div>
      </div>

      {/* Instructions */}
      <div className='mt-3 text-xs text-green-700'>
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul className='mt-1 space-y-1'>
          <li>• Send this link to {requestData.recipient}</li>
          <li>• They can click the link to view the payment request</li>
          <li>• The link will auto-fill the payment form</li>
          <li>• They can then approve and send the payment</li>
        </ul>
      </div>
    </div>
  );
};

export default ShareableLink;
