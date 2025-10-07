
import React from 'react';
import { MicIcon, StopIcon, UploadIcon } from './Icons';

interface AudioInputProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (file: File) => void;
}

const AudioInput: React.FC<AudioInputProps> = ({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
  onFileUpload
}) => {
  const isDisabled = isProcessing || isRecording;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };

  return (
    <div className="w-full max-w-md p-8 flex flex-col items-center gap-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isProcessing}
        className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 ease-in-out text-white font-bold shadow-xl focus:outline-none focus:ring-4 focus:ring-opacity-50
          ${isRecording
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400'
            : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-blue-400'
          }
          ${isProcessing ? 'cursor-not-allowed opacity-50' : 'transform hover:scale-105'}
        `}
      >
        {isRecording ? (
          <StopIcon className="w-12 h-12" />
        ) : (
          <MicIcon className="w-12 h-12" />
        )}
        {isRecording && <span className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></span>}
      </button>
      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
        {isRecording ? 'Recording in progress...' : 'Press the button to start recording'}
      </p>

      <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <input
          type="file"
          id="audio-upload"
          className="hidden"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        <label
          htmlFor="audio-upload"
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors
            ${isProcessing
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 cursor-pointer'
            }
          `}
        >
          <UploadIcon className="w-5 h-5" />
          <span>Or upload an audio file</span>
        </label>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          (Supports MP3, WAV, M4A, etc.)
        </p>
      </div>
    </div>
  );
};

export default AudioInput;
