/**
 * CardLayout Component
 *
 * Reusable card layout component for consistent UI structure.
 * Provides a standardized container with optional title and content sections.
 *
 * Features:
 * - Flexible content area
 * - Optional title section
 * - Consistent styling
 * - Accessibility support
 *
 * @component
 * @param title - Optional title for the card
 * @param children - Card content
 * @param className - Additional CSS classes
 * @returns Card layout component
 */
import React from 'react';

interface CardLayoutProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const CardLayout: React.FC<CardLayoutProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <h4 className='text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2'>
          {title}
        </h4>
      )}
      <div className='card-content'>{children}</div>
    </div>
  );
};

export default CardLayout;
