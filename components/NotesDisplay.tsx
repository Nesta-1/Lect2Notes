
import React, { useState } from 'react';
import { DownloadIcon, CopyIcon } from './Icons';

interface NotesDisplayProps {
  notes: string;
}

const NotesDisplay: React.FC<NotesDisplayProps> = ({ notes }) => {
  const [copyStatus, setCopyStatus] = useState('Copy');

  const handleCopyToClipboard = () => {
    const plainText = notes.replace(/<[^>]+>/g, '');
    navigator.clipboard.writeText(plainText).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    }, () => {
      setCopyStatus('Failed!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    });
  };

  const handleDownload = () => {
    const plainText = notes.replace(/<[^>]+>/g, '');
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LectureNotesAI-Notes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Summarized Notes</h2>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Download as .txt">
            <DownloadIcon className="w-5 h-5"/>
          </button>
          <button onClick={handleCopyToClipboard} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Copy to Clipboard">
            <CopyIcon className="w-5 h-5"/>
          </button>
        </div>
      </div>
      <div 
        className="prose prose-blue dark:prose-invert max-w-none flex-grow overflow-y-auto pr-2"
        dangerouslySetInnerHTML={{ __html: notes }}
      />
    </div>
  );
};

export default NotesDisplay;
