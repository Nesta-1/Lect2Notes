
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { QuizQuestion, Flashcard as FlashcardType } from './types';
import { generateNotesAndQuizFromTranscript, transcribeAudioFile } from './services/geminiService';
import Header from './components/Header';
import AudioInput from './components/AudioInput';
import ProcessingIndicator from './components/ProcessingIndicator';
import NotesDisplay from './components/NotesDisplay';
import QuizDisplay from './components/QuizDisplay';
import Flashcard from './components/Flashcard';

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] < 0 ? data[i] * 32768 : data[i] * 32767;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove "data:mime/type;base64," prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
}
// --- End Audio Helper Functions ---

type AppState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'RESULTS' | 'ERROR';
type ActiveTab = 'quiz' | 'flashcards';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [processingStep, setProcessingStep] = useState('');
  const [notes, setNotes] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('quiz');
  const [apiKey, setApiKey] = useState<string>(() => {
    const existing = sessionStorage.getItem('GEMINI_API_KEY');
    return existing ?? '';
  });

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const transcriptRef = useRef('');

  const handleStartRecording = useCallback(async () => {
    setAppState('RECORDING');
    transcriptRef.current = '';
    setError('');

    try {
      let key = apiKey;
      if (!key) {
        key = window.prompt('Enter your Gemini API key:')?.trim() || '';
        if (!key) {
          throw new Error('API key is required to start recording.');
        }
        sessionStorage.setItem('GEMINI_API_KEY', key);
        setApiKey(key);
      }
      const ai = new GoogleGenAI({ apiKey: key });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session opened.');
            const source = audioContext.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              transcriptRef.current += text;
            }
            if(message.serverContent?.turnComplete) {
                const finalChunk = transcriptRef.current;
                transcriptRef.current = '';
                transcriptRef.current = finalChunk;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError('An error occurred during the recording session.');
            setAppState('ERROR');
          },
          onclose: (e: CloseEvent) => {
            console.log('Session closed.');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
      });

    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Could not access microphone. Please check permissions and try again.");
      setAppState('ERROR');
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    setAppState('PROCESSING');
    setProcessingStep('Finalizing transcription...');

    // Stop hardware
    streamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    audioContextRef.current?.close();

    try {
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
        }

        if (transcriptRef.current.trim().length < 5) {
            throw new Error("Recording was too short to generate notes.");
        }
        
        setProcessingStep('Generating smart notes...');
        const result = await generateNotesAndQuizFromTranscript(transcriptRef.current);
        
        setNotes(result.notes);
        setQuiz(result.quiz);
        setFlashcards(result.flashcards);
        setAppState('RESULTS');
    } catch(err) {
        console.error("Failed to process lecture:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
        setAppState('ERROR');
    } finally {
        sessionPromiseRef.current = null;
        streamRef.current = null;
        audioContextRef.current = null;
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    setAppState('PROCESSING');
    setError('');
    
    try {
        let key = apiKey;
        if (!key) {
            key = window.prompt('Enter your Gemini API key:')?.trim() || '';
            if (!key) {
                throw new Error('API key is required to process files.');
            }
            sessionStorage.setItem('GEMINI_API_KEY', key);
            setApiKey(key);
        }
        setProcessingStep('Transcribing audio file...');
        const base64Audio = await fileToBase64(file);
        const transcript = await transcribeAudioFile({
            mimeType: file.type,
            data: base64Audio,
        }, key);
        
        if (transcript.trim().length < 5) {
            throw new Error("Audio content was too short or unclear to generate notes.");
        }

        setProcessingStep('Generating smart notes...');
        const result = await generateNotesAndQuizFromTranscript(transcript, key);
        
        setNotes(result.notes);
        setQuiz(result.quiz);
        setFlashcards(result.flashcards);
        setAppState('RESULTS');
    } catch (err) {
        console.error("Failed to process uploaded file:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while processing the file.";
        setError(errorMessage);
        setAppState('ERROR');
    }
  }, []);

  const handleStartOver = () => {
    setAppState('IDLE');
    setNotes('');
    setQuiz([]);
    setFlashcards([]);
    setError('');
    transcriptRef.current = '';
  };

  const renderContent = () => {
    switch (appState) {
      case 'IDLE':
      case 'RECORDING':
        return (
          <AudioInput
            isRecording={appState === 'RECORDING'}
            isProcessing={appState === 'PROCESSING'}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onFileUpload={handleFileUpload}
          />
        );
      case 'PROCESSING':
        return <ProcessingIndicator step={processingStep} />;
      case 'RESULTS':
        return (
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 h-[75vh]">
            <div className="h-full">
               <NotesDisplay notes={notes} />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col h-full">
              <div className="flex-shrink-0 mb-4">
                <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg">
                  <button onClick={() => setActiveTab('quiz')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${activeTab === 'quiz' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Quiz</button>
                  <button onClick={() => setActiveTab('flashcards')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${activeTab === 'flashcards' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Flashcards</button>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto pr-2">
                {activeTab === 'quiz' ? <QuizDisplay quiz={quiz} /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {flashcards.map((card, index) => <Flashcard key={index} card={card} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        case 'ERROR':
        return (
            <div className="w-full max-w-md p-8 flex flex-col items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
                 <h2 className="text-xl font-semibold text-red-500">Oops! Something went wrong.</h2>
                 <p className="text-gray-600 dark:text-gray-300">{error}</p>
                 <button onClick={handleStartOver} className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                     Try Again
                 </button>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <Header />
      <main className="flex-grow w-full flex flex-col items-center justify-center py-8">
        {renderContent()}
      </main>
      {appState === 'RESULTS' && (
         <button onClick={handleStartOver} className="mt-8 px-8 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-colors shadow-lg">
            Start a New Session
         </button>
      )}
    </div>
  );
};

export default App;
