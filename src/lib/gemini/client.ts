// Note: This requires @google/generative-ai package to be installed
// Run: npm install @google/generative-ai

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

// Initialize the Gemini client
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration for different use cases
export const GEMINI_MODELS = {
  TEXT_GENERATION: "gemini-2.0-flash-exp", // Latest Gemini 2.0 model
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
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
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
