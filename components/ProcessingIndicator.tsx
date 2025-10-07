
import React from 'react';

interface ProcessingIndicatorProps {
  step: string;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ step }) => {
  return (
    <div className="w-full max-w-md p-8 flex flex-col items-center gap-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Processing Your Lecture...</h2>
      <p className="text-gray-600 dark:text-gray-300">{step}</p>
    </div>
  );
};

export default ProcessingIndicator;
