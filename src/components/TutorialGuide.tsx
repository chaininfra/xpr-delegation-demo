/**
 * Interactive Tutorial Guide Component
 *
 * Provides guided learning experience for new users.
 * Features step-by-step instructions with interactive elements.
 *
 * Features:
 * - Progressive tutorial steps
 * - Interactive walkthroughs
 * - Progress tracking
 * - Skip/restart functionality
 * - Responsive design
 *
 * @component
 * @returns {JSX.Element} Interactive tutorial component
 */
import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Settings,
  Info,
} from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  element?: string; // CSS selector for highlighted element
  action?: () => void; // Optional action callback
  complete?: boolean;
}

export interface TutorialGuideProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  steps: TutorialStep[];
  onStepChange: (step: number) => void;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({
  isOpen,
  onClose,
  currentStep,
  steps,
  onStepChange,
}) => {
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  // const completionCount = Object.values(userProgress).filter(Boolean).length;

  const handleNext = () => {
    setUserProgress(prev => ({ ...prev, [currentStepData.id]: true }));
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getStepIcon = (stepIndex: number, isCompleted: boolean) => {
    if (isCompleted) return <CheckCircle className='w-5 h-5 text-green-500' />;
    return (
      <div
        className={`w-5 h-5 rounded-full border-2 ${
          stepIndex === currentStep
            ? 'border-blue-500 bg-blue-500'
            : 'border-gray-300'
        }`}
      >
        {stepIndex < currentStep && (
          <div className='w-full h-full bg-blue-500 rounded-full' />
        )}
      </div>
    );
  };

  if (!isOpen || !currentStepData) return null;

  return (
    <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
              <Settings className='w-4 h-4 text-blue-600' />
            </div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Tutorial Guide
            </h2>
          </div>
          <button
            onClick={handleSkip}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className='px-6 py-4 border-b border-gray-100'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm text-gray-600'>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className='text-sm text-gray-600'>
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-500 h-2 rounded-full transition-all duration-300'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className='flex justify-between mt-2'>
            {steps.map((_, index) => (
              <div key={index} className='flex items-center'>
                {getStepIcon(index, userProgress[steps[index].id] || false)}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className='p-6 flex-1'>
          <div className='flex items-start gap-3 mb-4'>
            <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <Info className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                {currentStepData.title}
              </h3>
              <p className='text-gray-600 leading-relaxed'>
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Step-specific content */}
          {currentStepData.element && (
            <div className='bg-gray-50 rounded-lg p-4 mb-4'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                <span className='text-sm font-medium text-gray-700'>
                  Look for this element:
                </span>
              </div>
              <code className='text-xs text-gray-600 bg-white px-2 py-1 rounded border'>
                {currentStepData.element}
              </code>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className='flex items-center justify-between p-6 border-t border-gray-200'>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className='w-4 h-4' />
            Previous
          </button>

          <div className='flex items-center gap-2'>
            <button
              onClick={handleSkip}
              className='px-4 py-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors'
            >
              Skip Tutorial
            </button>
            <button
              onClick={handleNext}
              className='flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              <ChevronRight className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialGuide;
