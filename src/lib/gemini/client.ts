// Note: This requires @google/generative-ai package to be installed
// Run: npm install @google/generative-ai

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

// Initialize the Gemini client
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration for different use cases
export const GEMINI_MODELS = {
  TEXT_GENERATION: "gemini-2.0-flash-exp", // Latest Gemini 2.0 model
  TEXT_TO_SPEECH: "gemini-2.0-flash-exp", // Same model for TTS
} as const;

// Default generation config
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1000,
};

// Safety settings
export const SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HARASSMENT" as const,
    threshold: "BLOCK_MEDIUM_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH" as const,
    threshold: "BLOCK_MEDIUM_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as const,
    threshold: "BLOCK_MEDIUM_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT" as const,
    threshold: "BLOCK_MEDIUM_AND_ABOVE" as const,
  },
];

// Get model instance for text generation
export function getTextGenerationModel() {
  return genAI.getGenerativeModel({
    model: GEMINI_MODELS.TEXT_GENERATION,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });
}

// Get model instance for text-to-speech
export function getTTSModel() {
  return genAI.getGenerativeModel({
    model: GEMINI_MODELS.TEXT_TO_SPEECH,
    generationConfig: {
      ...DEFAULT_GENERATION_CONFIG,
      maxOutputTokens: 500, // Shorter for TTS
    },
    safetySettings: SAFETY_SETTINGS,
  });
}
