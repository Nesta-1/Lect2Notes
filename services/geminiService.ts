import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Flashcard } from '../types';

const transcriptionPrompt = "Transcribe the following audio recording of a lecture. Provide only the text of the transcription, with no additional commentary or formatting.";

export const transcribeAudioFile = async (
    audio: { mimeType: string; data: string },
    apiKey: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const audioPart = {
            inlineData: {
                mimeType: audio.mimeType,
                data: audio.data,
            },
        };
        const textPart = { text: transcriptionPrompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw new Error("Failed to transcribe the audio file. It might be corrupted or in an unsupported format.");
    }
};

const notesPrompt = `You are an expert academic assistant. Your task is to summarize a lecture transcript into clear, concise, and well-structured notes.
- Use clear headings for different topics.
- Use bullet points for key information.
- Identify and highlight the most important terms or concepts by wrapping them in '<b>' and '</b>' HTML tags.
- The output should be easy to read and scan.
- Do not add any introductory or concluding remarks outside of the notes themselves.

Here is the transcript:
---
`;

const quizFlashcardsPrompt = `Based on the following lecture notes, generate 5 multiple-choice quiz questions and 5 flashcards (term and definition).

Return the result as a single, valid JSON object that conforms to the provided schema. The root of the object should have two keys: "quiz" and "flashcards".

- The "quiz" key should be an array of objects, each with "question", "options" (an array of exactly 4 strings), and "answer" (the correct option string, which must be one of the strings from the "options" array).
- The "flashcards" key should be an array of objects, each with "term" and "definition".

Do not include any markdown formatting like \`json\` or backticks in your response. Output only the raw JSON object.

Here are the notes:
---
`;

const quizFlashcardsSchema = {
  type: Type.OBJECT,
  properties: {
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The quiz question." },
          options: {
            type: Type.ARRAY,
            description: "An array of 4 possible answers.",
            items: { type: Type.STRING }
          },
          answer: { type: Type.STRING, description: "The correct answer, must be one of the options." }
        },
        required: ["question", "options", "answer"]
      }
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "The term for the flashcard." },
          definition: { type: Type.STRING, description: "The definition of the term." }
        },
        required: ["term", "definition"]
      }
    }
  },
  required: ["quiz", "flashcards"]
};

interface GenerationResult {
    notes: string;
    quiz: QuizQuestion[];
    flashcards: Flashcard[];
}

export const generateNotesAndQuizFromTranscript = async (
    transcript: string,
    apiKey: string
): Promise<GenerationResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        // Step 1: Generate notes from transcript
        const notesResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${notesPrompt}${transcript}`,
        });
        const notes = notesResponse.text;

        // Step 2: Generate quiz and flashcards from the notes
        const quizResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${quizFlashcardsPrompt}${notes}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizFlashcardsSchema,
            }
        });

        const quizData = JSON.parse(quizResponse.text);

        return {
            notes,
            quiz: quizData.quiz,
            flashcards: quizData.flashcards,
        };
    } catch (error) {
        console.error("Error generating content from Gemini:", error);
        throw new Error("Failed to process the lecture. Please try again.");
    }
};
