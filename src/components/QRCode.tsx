/**
 * QRCode Component - XPR Delegation Demo
 *
 * Component for generating and displaying QR codes for shareable payment request URLs.
 * Provides a user-friendly interface for sharing payment requests via QR code.
 *
 * @fileoverview QR code component for payment requests
 */

import React, { useState, useEffect } from 'react';
import QRCodeLib from 'qrcode';
import type { RequestPaymentData } from '../types';

interface QRCodeProps {
  /** Payment request data */
  requestData: RequestPaymentData;
  /** Whether to show the component */
  show: boolean;
  /** QR code size in pixels */
  size?: number;
  /** Callback when QR code is generated */
  onGenerated?: (qrDataUrl: string) => void;
}

/**
 * QRCode - Component for displaying QR codes
 */
const QRCode: React.FC<QRCodeProps> = ({
  requestData,
  show,
  size = 200,
  onGenerated,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate QR code from shareable URL
   */
  useEffect(() => {
    if (!show || !requestData.shareableUrl) {
      return;
    }

    const generateQRCode = async () => {
      setGenerating(true);
      setError(null);

      try {
        if (!requestData.shareableUrl) {
          throw new Error('No shareable URL provided');
        }

        const qrDataUrl = await QRCodeLib.toDataURL(requestData.shareableUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });

        setQrDataUrl(qrDataUrl);
        onGenerated?.(qrDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setGenerating(false);
      }
    };

    generateQRCode();
  }, [show, requestData.shareableUrl, size, onGenerated]);

  if (!show) {
    return null;
  }

  return (
    <div className='mt-6 bg-purple-50 border border-purple-200 rounded-md p-4'>
      <div className='text-center'>
        <h4 className='text-sm font-medium text-purple-900 mb-3'>
          QR Code for Payment Request
        </h4>

        {generating && (
          <div className='flex justify-center items-center h-48'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
            <span className='ml-2 text-sm text-purple-700'>
              Generating QR code...
            </span>
          </div>
        )}

        {error && (
          <div className='flex justify-center items-center h-48'>
            <div className='text-center'>
              <svg
                className='mx-auto h-12 w-12 text-red-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              <p className='mt-2 text-sm text-red-600'>{error}</p>
            </div>
          </div>
        )}

        {qrDataUrl && !generating && !error && (
          <div className='space-y-3'>
            <div className='flex justify-center'>
              <img
                src={qrDataUrl}
                alt='Payment Request QR Code'
                className='border border-gray-200 rounded-lg shadow-sm'
                style={{ width: size, height: size }}
              />
            </div>

            <div className='text-xs text-purple-700'>
              <p>Scan this QR code to open the payment request</p>
              <p className='mt-1 font-mono text-xs break-all'>
                {requestData.shareableUrl}
              </p>
            </div>

            <div className='flex justify-center space-x-2'>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrDataUrl;
                  link.download = `payment-request-${requestData.recipient}.png`;
                  link.click();
                }}
                className='inline-flex items-center px-3 py-1 border border-purple-300 text-xs font-medium rounded text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
              >
                <svg
                  className='-ml-0.5 mr-1 h-3 w-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                Download QR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className='mt-4 text-xs text-purple-700'>
        <p>
          <strong>How to use:</strong>
        </p>
        <ul className='mt-1 space-y-1'>
          <li>• Show this QR code to {requestData.recipient}</li>
          <li>• They can scan it with their phone camera</li>
          <li>• The QR code will open the payment request link</li>
          <li>• They can then approve and send the payment</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCode;
