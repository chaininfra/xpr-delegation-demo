/**
 * StatusMessage Component
 *
 * Displays status messages (success, error, warning, info) with appropriate styling
 * and icons. Provides user feedback for various operations like wallet connection,
 * vote delegation, resource staking, and token transfers.
 *
 * Features:
 * - Multiple message types (success, error, warning, info)
 * - Auto-dismiss functionality with timer
 * - Accessible design with ARIA attributes
 * - Responsive design with Tailwind CSS
 * - Smooth animations and transitions
 *
 * @component
 * @param {Object} message - Message object with type and text
 * @param {Function} onDismiss - Optional callback when message is dismissed
 * @returns {JSX.Element} Status message component
 */
import React, { useEffect, useState } from 'react';

import type { Message, NetworkType } from '../types';
import { getTransactionDisplay } from '../utils/transactionUtils';

export interface StatusMessageProps {
  message: Message | null | undefined;
  network?: NetworkType;
  onDismiss?: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  network = 'testnet',
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show message when it changes
  useEffect(() => {
    // Debug: Log when message changes
    // eslint-disable-next-line no-console
    console.log('[StatusMessage] Message changed:', message);

    if (message) {
      setIsVisible(true);

      // Auto-dismiss after 5 seconds for success messages, 8 seconds for others
      const timeout = setTimeout(
        () => {
          setIsVisible(false);
          setTimeout(() => {
            onDismiss?.();
          }, 300); // Wait for animation to complete
        },
        message.type === 'success' ? 5000 : 8000
      );

      return () => clearTimeout(timeout);
    } else {
      setIsVisible(false);
    }
  }, [message, onDismiss]);

  if (!message || !isVisible) {
    return null;
  }

  // Get appropriate icon and colors based on message type
  const getMessageConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          ),
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-400',
        };
      case 'error':
        return {
          icon: (
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
              clipRule='evenodd'
            />
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-400',
        };
      case 'warning':
        return {
          icon: (
            <path
              fillRule='evenodd'
              d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-400',
        };
      case 'info':
        return {
          icon: (
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-400',
        };
      default:
        return {
          icon: (
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          ),
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-400',
        };
    }
  };

  const config = getMessageConfig(message.type);

  /**
   * Render message text with transaction ID links
   * @param text - Message text
   * @returns JSX element with clickable transaction IDs
   */
  const renderMessageText = (text: string): React.ReactElement => {
    // Check if message contains "Transaction ID:"
    const transactionIdMatch = text.match(/Transaction ID: ([a-f0-9]{64})/i);

    if (transactionIdMatch) {
      const fullTransactionId = transactionIdMatch[1];
      const transactionDisplay = getTransactionDisplay(
        fullTransactionId,
        network
      );

      if (transactionDisplay.hasValidId) {
        return (
          <span>
            {text.replace(
              `Transaction ID: ${fullTransactionId}`,
              `Transaction ID: `
            )}
            <a
              href={transactionDisplay.explorerUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='font-mono text-sm underline hover:no-underline'
              title={`View transaction ${fullTransactionId} on explorer`}
            >
              {transactionDisplay.formattedId}
            </a>
            <svg
              className='inline w-3 h-3 ml-1'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
              />
            </svg>
          </span>
        );
      }
    }

    // Return plain text if no transaction ID found
    return <span>{text}</span>;
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full mx-4 ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role='alert'
      aria-live='polite'
    >
      <div className='p-4'>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>
            <svg
              className={`w-5 h-5 ${config.iconColor}`}
              fill='currentColor'
              viewBox='0 0 20 20'
              aria-hidden='true'
            >
              {config.icon}
            </svg>
          </div>
          <div className='ml-3 flex-1'>
            <p className={`text-sm font-medium ${config.textColor}`}>
              {renderMessageText(message.text)}
            </p>
          </div>
          <div className='ml-4 flex-shrink-0'>
            <button
              type='button'
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  onDismiss?.();
                }, 300);
              }}
              className={`inline-flex ${config.textColor} hover:${config.textColor.replace('800', '600')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-500`}
              aria-label='Dismiss message'
            >
              <svg
                className='w-4 h-4'
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusMessage;
