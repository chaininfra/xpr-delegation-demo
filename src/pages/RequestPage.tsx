/**
 * RequestPage Component - XPR Delegation Demo
 *
 * Complete payment request page with wallet integration and request creation.
 * Allows users to create payment requests with recipient, amount, and memo.
 *
 * @fileoverview Main request page component
 */

import React, { useState, useEffect } from 'react';
import type { RequestPageProps, RequestPaymentData } from '../types';
import RequestForm from '../components/RequestForm';
import ShareableLink from '../components/ShareableLink';
import QRCode from '../components/QRCode';
import StatusMessage from '../components/StatusMessage';

/**
 * RequestPage - Main payment request interface
 */
const RequestPage: React.FC<RequestPageProps> = ({
  wallet,
  account,
  loading: globalLoading,
  network,
  handleRequest,
  message,
  urlRequestData,
  onClearUrlData,
}) => {
  // Local state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] =
    useState<RequestPaymentData | null>(null);

  /**
   * Update createdRequest when urlRequestData changes (after successful request)
   */
  useEffect(() => {
    if (urlRequestData && urlRequestData.shareableUrl && !createdRequest) {
      console.log(
        'Setting createdRequest from urlRequestData:',
        urlRequestData
      );
      setCreatedRequest(urlRequestData);
    }
  }, [urlRequestData, createdRequest]);

  /**
   * Handle request submission
   */
  const handleRequestSubmit = async (requestData: RequestPaymentData) => {
    try {
      setError(null);
      setSuccess(null);

      await handleRequest(requestData);

      setSuccess(
        `Payment request created successfully! Share the link below with ${requestData.recipient}`
      );
    } catch (err: any) {
      setError(`Request failed: ${err.message}`);
    }
  };

  // Check if wallet is connected
  const isWalletConnected = !!wallet && !!account;
  const isEmptyState = !isWalletConnected;

  return (
    <>
      {/* Status Message */}
      <StatusMessage message={message} network={network} />

      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Page Header */}
          <div className='text-center mb-8'>
            <div className='flex justify-center mb-4'>
              <img
                src='/logo/logo.svg'
                alt='XPR Logo'
                className='h-20 w-20'
                draggable={false}
              />
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Request Payment
            </h1>
            <p className='text-gray-600'>
              Create a payment request to ask for XPR tokens from another
              account
            </p>
          </div>

          {/* Empty State - No Wallet Connected */}
          {isEmptyState && (
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center'>
              <div className='mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                <svg
                  className='w-8 h-8 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Connect Wallet Required
              </h3>
              <p className='text-gray-600 mb-4'>
                Please connect your XPR wallet to create payment requests
              </p>
              <button
                onClick={() => (window.location.href = '/')}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Go to Homepage
              </button>
            </div>
          )}

          {/* Connected State with Wallet */}
          {isWalletConnected && (
            <>
              {/* Account Info */}
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Requesting From</p>
                    <p className='font-semibold text-gray-900'>
                      {account.account_name}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-gray-600'>Network</p>
                    <p className='font-semibold text-gray-900 capitalize'>
                      {network}
                    </p>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className='mb-6 bg-green-50 border border-green-200 rounded-md p-4'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <svg
                        className='h-5 w-5 text-green-400'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div className='ml-3'>
                      <p className='text-sm text-green-800'>{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Form */}
              <RequestForm
                account={account}
                onRequest={handleRequestSubmit}
                loading={globalLoading}
                error={error}
                urlRequestData={urlRequestData}
                onClearUrlData={onClearUrlData}
              />

              {/* Shareable Link */}
              {createdRequest && (
                <>
                  {console.log('Rendering ShareableLink with:', createdRequest)}
                  <ShareableLink
                    requestData={createdRequest}
                    show={true}
                    onCopied={() => {
                      setSuccess('Link copied to clipboard!');
                    }}
                  />
                </>
              )}

              {/* QR Code */}
              {createdRequest && (
                <QRCode
                  requestData={createdRequest}
                  show={true}
                  size={200}
                  onGenerated={qrDataUrl => {
                    console.log('QR Code generated:', qrDataUrl);
                  }}
                />
              )}
            </>
          )}

          {/* Help Section */}
          <div className='mt-8 bg-blue-50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-blue-900 mb-2'>
              Payment Request Information
            </h4>
            <ul className='text-sm text-blue-800 space-y-1'>
              <li>• Payment requests are shared via links</li>
              <li>• Recipients can choose to fulfill or ignore the request</li>
              <li>
                • Account names must follow XPR Network naming conventions
              </li>
              <li>• Amounts are specified in XPR tokens</li>
              <li>• Memo field is optional but recommended for clarity</li>
              <li>• Requests do not automatically transfer funds</li>
            </ul>
          </div>

          {/* Additional Information */}
          <div className='mt-6 bg-yellow-50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-yellow-900 mb-2'>
              Important Notes
            </h4>
            <ul className='text-sm text-yellow-800 space-y-1'>
              <li>• This creates a request link, not an actual transaction</li>
              <li>
                • The recipient must manually approve and send the payment
              </li>
              <li>• No funds are held or locked during the request process</li>
              <li>• Requests are shared through shareable links</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestPage;
