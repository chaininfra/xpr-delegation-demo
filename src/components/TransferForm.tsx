/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TransferForm Component - XPR Delegation Demo
 *
 * Form component for executing token transfers with validation
 * and user-friendly interface.
 *
 * @fileoverview Comprehensive token transfer form with validation
 */

import React, { useState, useEffect } from 'react';
import type {
  TransferData,
  TokenBalance,
  AccountInfo,
  RequestPaymentData,
} from '../types';

interface TransferFormProps {
  /** Selected token */
  token: TokenBalance | null;
  /** Account information */
  account: AccountInfo | null;
  /** Transfer handler */
  onTransfer: (transferData: TransferData) => Promise<void>;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Success message */
  success?: string | null;
  /** Pending transfer data from URL */
  pendingTransferData?: RequestPaymentData | null;
  /** Clear pending transfer data handler */
  onClearPendingData?: () => void;
}

/**
 * TransferForm - Comprehensive token transfer form
 */
const TransferForm: React.FC<TransferFormProps> = ({
  token,
  account,
  onTransfer,
  loading = false,
  error = null,
  success = null,
  pendingTransferData,
  onClearPendingData,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    memo: '',
  });

  const [validationErrors, setValidationErrors] = useState<{
    to?: string;
    amount?: string;
    memo?: string;
  }>({});

  /**
   * Auto-fill form when pending transfer data is available
   */
  useEffect(() => {
    if (pendingTransferData) {
      console.log(
        'TransferForm: Auto-filling form with pendingTransferData:',
        pendingTransferData
      );
      // Extract amount and symbol from the amount string (e.g., "100 XPR")
      const amountParts = pendingTransferData.amount.split(' ');
      const amount = amountParts[0] || '';

      setFormData({
        to: pendingTransferData.recipient || '',
        amount: amount,
        memo: pendingTransferData.memo || '',
      });
    }
  }, [pendingTransferData]);

  const [localLoading, setLocalLoading] = useState(false);

  // Reset form when token changes (but preserve pending data)
  useEffect(() => {
    if (!pendingTransferData) {
      setFormData({ to: '', amount: '', memo: '' });
      setValidationErrors({});
    }
  }, [token, pendingTransferData]);

  // Validate form data
  const validateForm = (): boolean => {
    const errors: any = {};

    // Validate destination account
    if (!formData.to.trim()) {
      errors.to = 'Destination account is required';
    } else if (!/^[a-zA-Z1-5]+$/.test(formData.to.trim())) {
      errors.to = 'Invalid account name format';
    } else if (
      account &&
      formData.to.trim().toLowerCase() === account.account_name.toLowerCase()
    ) {
      errors.to = 'Cannot transfer to yourself';
    }

    // Validate amount
    if (!formData.amount.trim()) {
      errors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be a positive number';
      } else if (token) {
        const tokenAmount = parseFloat(token.amount);
        if (amount > tokenAmount) {
          errors.amount = `Insufficient balance. Available: ${token.formatted}`;
        }
      }
    }

    // Validate memo (optional but check length)
    if (formData.memo.length > 256) {
      errors.memo = 'Memo cannot exceed 256 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token || !account || loading) {
      return;
    }

    try {
      setLocalLoading(true);

      // Format amount with correct precision
      const precision = token.precision;
      const amount = parseFloat(formData.amount).toFixed(precision);

      // Create transfer data
      const transferData: TransferData = {
        from: account.account_name,
        to: formData.to.trim(),
        quantity: `${amount} ${token.symbol}`,
        memo: formData.memo.trim(),
        contract: token.contract,
        permission: 'owner',
      };

      // Execute transfer
      await onTransfer(transferData);

      // Reset form on success
      setFormData({ to: '', amount: '', memo: '' });
    } catch {
      // Error handled by onTransfer callback
    } finally {
      setLocalLoading(false);
    }
  };

  // Format max amount for display
  const getMaxAmount = () => {
    if (!token) return '0';
    return parseFloat(token.amount).toString();
  };

  // Set max amount
  const setMaxAmount = () => {
    if (token) {
      setFormData(prev => ({ ...prev, amount: getMaxAmount() }));
    }
  };

  // Get formatted balance display
  const getBalanceDisplay = () => {
    if (!token) return 'No token selected';
    return `${token.formatted} (${token.contract})`;
  };

  const isLoading = loading || localLoading;

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-gray-900'>Transfer Token</h3>
        <p className='text-sm text-gray-600 mt-1'>
          Send tokens to another XPR account
        </p>
      </div>

      {/* Selected Token Display */}
      {token && (
        <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-medium text-blue-900'>Selected Token</h4>
              <p className='text-sm text-blue-700'>{getBalanceDisplay()}</p>
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium text-blue-900'>Available</p>
              <p className='text-sm text-blue-700'>{token.formatted}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Transfer Data Info */}
      {pendingTransferData && (
        <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <h4 className='text-sm font-medium text-green-900 mb-2'>
                Payment Request Received
              </h4>
              <div className='text-sm text-green-800 space-y-1'>
                <p>
                  <strong>From:</strong> {pendingTransferData.recipient}
                </p>
                <p>
                  <strong>Amount:</strong> {pendingTransferData.amount}
                </p>
                {pendingTransferData.memo && (
                  <p>
                    <strong>Memo:</strong> {pendingTransferData.memo}
                  </p>
                )}
              </div>
            </div>
            {onClearPendingData && (
              <button
                onClick={onClearPendingData}
                className='ml-4 text-green-600 hover:text-green-800 text-sm font-medium'
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Destination Account */}
        <div>
          <label
            htmlFor='to'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            To Account
          </label>
          <input
            type='text'
            id='to'
            value={formData.to}
            onChange={e => handleInputChange('to', e.target.value)}
            placeholder='Enter destination account name'
            disabled={isLoading}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${
                validationErrors.to
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }
              ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
          />
          {validationErrors.to && (
            <p className='mt-1 text-sm text-red-600'>{validationErrors.to}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor='amount'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Amount
            {token && (
              <span className='text-xs text-gray-500 ml-2'>
                (Symbol: {token.symbol}, Precision: {token.precision})
              </span>
            )}
          </label>
          <div className='relative'>
            <input
              type='number'
              id='amount'
              value={formData.amount}
              onChange={e => handleInputChange('amount', e.target.value)}
              placeholder='0.0000'
              step='0.0001'
              min='0'
              disabled={isLoading}
              className={`
                w-full px-4 py-3 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${
                  validationErrors.amount
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }
                ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              `}
            />
            {token && (
              <button
                type='button'
                onClick={setMaxAmount}
                disabled={isLoading}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                MAX
              </button>
            )}
          </div>
          {validationErrors.amount && (
            <p className='mt-1 text-sm text-red-600'>
              {validationErrors.amount}
            </p>
          )}
          {token && (
            <p className='mt-1 text-xs text-gray-500'>
              Available: {token.formatted}
            </p>
          )}
        </div>

        {/* Memo */}
        <div>
          <label
            htmlFor='memo'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Memo (Optional)
          </label>
          <textarea
            id='memo'
            value={formData.memo}
            onChange={e => handleInputChange('memo', e.target.value)}
            placeholder='Enter transfer memo'
            rows={3}
            maxLength={256}
            disabled={isLoading}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none
              ${
                validationErrors.memo
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }
              ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
          />
          <div className='flex justify-between mt-1'>
            {validationErrors.memo && (
              <p className='text-sm text-red-600'>{validationErrors.memo}</p>
            )}
            <p className='text-xs text-gray-500 ml-auto'>
              {formData.memo.length}/256 characters
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={!token || isLoading || !account}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${
              !token || isLoading || !account
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isLoading ? (
            <div className='flex items-center justify-center'>
              <svg
                className='animate-spin -ml-1 mr-3 h-5 w-5 text-current'
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
              Processing Transfer...
            </div>
          ) : (
            `Transfer ${formData.amount || '0'} ${token?.symbol || ''}`
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
          <div className='flex'>
            <svg
              className='w-5 h-5 text-red-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
            <div className='ml-3'>
              <p className='text-sm text-red-800'>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
          <div className='flex'>
            <svg
              className='w-5 h-5 text-green-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <div className='ml-3'>
              <p className='text-sm text-green-800'>{success}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferForm;
