
import React, { useState } from 'react';
import { Flashcard as FlashcardType } from '../types';

interface FlashcardProps {
  card: FlashcardType;
}

const Flashcard: React.FC<FlashcardProps> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="perspective w-full h-48" onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className={`relative w-full h-full preserve-3d transition-transform duration-500 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md cursor-pointer">
          <p className="text-xl font-bold text-center text-gray-800 dark:text-white">{card.term}</p>
        </div>
        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900 rounded-xl shadow-md cursor-pointer">
          <p className="text-md text-center text-gray-700 dark:text-gray-200">{card.definition}</p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
