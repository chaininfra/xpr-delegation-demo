/**
 * RequestForm Component - XPR Delegation Demo
 *
 * Form component for creating payment requests with recipient, amount, and memo fields.
 * Provides validation and user-friendly interface for requesting payments.
 *
 * @fileoverview Request payment form component
 */

import React, { useState, useEffect } from 'react';
import type { RequestFormProps, RequestPaymentData } from '../types';

/**
 * RequestForm - Payment request form interface
 */
const RequestForm: React.FC<RequestFormProps> = ({
  account,
  onRequest,
  loading,
  error,
  urlRequestData,
  onClearUrlData,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    memo: '',
    symbol: 'XPR',
  });

  const [validationErrors, setValidationErrors] = useState<{
    recipient?: string;
    amount?: string;
    memo?: string;
  }>({});

  /**
   * Auto-fill form when URL request data is available
   */
  useEffect(() => {
    if (urlRequestData) {
      // Extract amount and symbol from the amount string (e.g., "10.0000 XPR")
      const amountParts = urlRequestData.amount.split(' ');
      const amount = amountParts[0] || '';
      const symbol = amountParts[1] || 'XPR';

      setFormData({
        recipient: urlRequestData.recipient || '',
        amount: amount,
        memo: urlRequestData.memo || '',
        symbol: symbol,
      });
    } else if (account && !formData.recipient) {
      // Auto-fill recipient with connected wallet account if no URL data and recipient is empty
      setFormData(prev => ({
        ...prev,
        recipient: account.account_name,
      }));
    }
  }, [urlRequestData, account, formData.recipient]);

  /**
   * Handle input changes
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Validate recipient
    if (!formData.recipient.trim()) {
      errors.recipient = 'Recipient account name is required';
    } else if (formData.recipient.trim().length < 3) {
      errors.recipient = 'Account name must be at least 3 characters';
    } else if (!/^[a-z1-5]+$/.test(formData.recipient.trim())) {
      errors.recipient =
        'Account name must contain only lowercase letters and numbers 1-5';
    }
    // Note: Removed "Cannot request payment from yourself" validation as this is a payment request feature

    // Validate amount
    if (!formData.amount.trim()) {
      errors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be a positive number';
      } else if (amount > 1000000) {
        errors.amount = 'Amount cannot exceed 1,000,000';
      }
    }

    // Validate memo (optional but check length if provided)
    if (formData.memo.length > 256) {
      errors.memo = 'Memo cannot exceed 256 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const requestData: RequestPaymentData = {
        recipient: formData.recipient.trim(),
        amount: `${formData.amount} ${formData.symbol}`,
        memo: formData.memo.trim(),
        symbol: formData.symbol,
      };

      await onRequest(requestData);

      // Reset form on success
      setFormData({
        recipient: '',
        amount: '',
        memo: '',
        symbol: 'XPR',
      });
    } catch (err) {
      // Error handling is done by parent component
      console.error('Request submission error:', err);
    }
  };

  /**
   * Format amount input
   */
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, amount: value }));

      // Clear validation error
      if (validationErrors.amount) {
        setValidationErrors(prev => ({ ...prev, amount: undefined }));
      }
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Create Payment Request
        </h3>
        <p className='text-sm text-gray-600'>
          Request payment from another XPR account
        </p>
      </div>

      {/* URL Request Data Info */}
      {urlRequestData && (
        <div className='mb-6 bg-blue-50 border border-blue-200 rounded-md p-4'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <h4 className='text-sm font-medium text-blue-900 mb-2'>
                Payment Request Link Opened
              </h4>
              <div className='text-sm text-blue-800 space-y-1'>
                <p>
                  <strong>From:</strong> {urlRequestData.recipient}
                </p>
                <p>
                  <strong>Amount:</strong> {urlRequestData.amount}
                </p>
                {urlRequestData.memo && (
                  <p>
                    <strong>Memo:</strong> {urlRequestData.memo}
                  </p>
                )}
              </div>
            </div>
            {onClearUrlData && (
              <button
                onClick={onClearUrlData}
                className='ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium'
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Recipient Field */}
        <div>
          <label
            htmlFor='recipient'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Recipient Account Name *
          </label>
          <input
            type='text'
            id='recipient'
            name='recipient'
            value={formData.recipient}
            onChange={handleInputChange}
            placeholder={
              account
                ? `Default: ${account.account_name}`
                : 'Enter recipient account name'
            }
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.recipient
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
            }`}
            disabled={loading}
            aria-describedby={
              validationErrors.recipient ? 'recipient-error' : undefined
            }
          />
          {validationErrors.recipient && (
            <p id='recipient-error' className='mt-1 text-sm text-red-600'>
              {validationErrors.recipient}
            </p>
          )}
        </div>

        {/* Amount Field */}
        <div>
          <label
            htmlFor='amount'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Requested Amount *
          </label>
          <div className='relative'>
            <input
              type='text'
              id='amount'
              name='amount'
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder='0.0000'
              className={`w-full px-3 py-2 pr-16 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.amount
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              }`}
              disabled={loading}
              aria-describedby={
                validationErrors.amount ? 'amount-error' : undefined
              }
            />
            <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
              <span className='text-sm text-gray-500'>{formData.symbol}</span>
            </div>
          </div>
          {validationErrors.amount && (
            <p id='amount-error' className='mt-1 text-sm text-red-600'>
              {validationErrors.amount}
            </p>
          )}
        </div>

        {/* Memo Field */}
        <div>
          <label
            htmlFor='memo'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Memo (Optional)
          </label>
          <textarea
            id='memo'
            name='memo'
            value={formData.memo}
            onChange={handleInputChange}
            placeholder='Add a note about this payment request...'
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.memo
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
            }`}
            disabled={loading}
            aria-describedby={validationErrors.memo ? 'memo-error' : undefined}
          />
          {validationErrors.memo && (
            <p id='memo-error' className='mt-1 text-sm text-red-600'>
              {validationErrors.memo}
            </p>
          )}
          <p className='mt-1 text-xs text-gray-500'>
            {formData.memo.length}/256 characters
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-md p-3'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-red-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className='flex justify-end'>
          <button
            type='submit'
            disabled={loading}
            className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? (
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
                Creating Request...
              </>
            ) : (
              'Create Payment Request'
            )}
          </button>
        </div>
      </form>

      {/* Help Information */}
      <div className='mt-6 bg-blue-50 rounded-md p-4'>
        <h4 className='text-sm font-medium text-blue-900 mb-2'>
          Payment Request Information
        </h4>
        <ul className='text-sm text-blue-800 space-y-1'>
          <li>• Payment requests are shared via links</li>
          <li>• Recipients can choose to fulfill or ignore the request</li>
          <li>• Account names must follow XPR Network naming conventions</li>
          <li>• Amounts are specified in XPR tokens</li>
          <li>• Memo field is optional but recommended for clarity</li>
          <li>
            • Recipient field auto-fills with your connected wallet account
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RequestForm;
