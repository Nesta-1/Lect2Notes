
import React from 'react';
import { AiMascotIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-6 text-center">
      <div className="flex items-center justify-center gap-4">
        <AiMascotIcon className="w-12 h-12" />
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            LectureNotesAI
          </h1>
          <p className="mt-1 text-md text-gray-600 dark:text-gray-300">
            Record a lecture. Get smart notes, instantly.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
