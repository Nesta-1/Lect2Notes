
import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface QuizDisplayProps {
  quiz: QuizQuestion[];
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelectAnswer = (questionIndex: number, option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: option }));
    setShowResults(false);
  };
  
  const getOptionClass = (questionIndex: number, option: string) => {
    if (!showResults) {
      return selectedAnswers[questionIndex] === option ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600';
    }
    const correctAnswer = quiz[questionIndex].answer;
    if (option === correctAnswer) {
      return 'bg-green-200 dark:bg-green-800';
    }
    if (selectedAnswers[questionIndex] === option) {
      return 'bg-red-200 dark:bg-red-800';
    }
    return 'bg-gray-100 dark:bg-gray-700';
  };

  return (
    <div className="space-y-6">
      {quiz.map((q, index) => (
        <div key={index} className="p-4 bg-white dark:bg-gray-800/50 rounded-lg">
          <p className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{index + 1}. {q.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((option, optIndex) => (
              <button
                key={optIndex}
                onClick={() => handleSelectAnswer(index, option)}
                className={`w-full text-left p-3 rounded-md transition-colors text-sm ${getOptionClass(index, option)} text-gray-700 dark:text-gray-200`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
       <div className="pt-4">
        <button 
          onClick={() => setShowResults(true)}
          className="w-full py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md"
        >
          Check Answers
        </button>
      </div>
    </div>
  );
};

export default QuizDisplay;
