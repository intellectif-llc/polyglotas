// Note: This requires @google/generative-ai package to be installed
// Run: npm install @google/generative-ai

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResult,
  ChatSession,
  GenerationConfig,
  SafetySetting,
  GenerateContentRequest,
  StartChatParams,
  Part,
} from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

// WARNING: Modifying global.fetch affects the entire Node.js application
// This adds Referer header for Gemini API restrictions but may impact other SDKs
const originalFetch = global.fetch;
global.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  if (!headers.has("Referer")) {
    headers.set(
      "Referer",
      process.env.NEXT_PUBLIC_SITE_URL || "https://polyglotas.com"
    );
  }
  return originalFetch(input, { ...init, headers });
};

interface LogEntry {
  timestamp: string;
  keyId: string;
  errorType: string;
  statusCode?: number;
  errorMessage: string;
  retryAttempt: number;
  outcome: "success" | "failure" | "retry";
  operation: string;
}

// Define the shape of the config passed to the manager's methods
interface ModelConfig {
  model: string;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
}

class GeminiClientManager {
  private primaryClient: GoogleGenerativeAI;
  private secondaryClient: GoogleGenerativeAI | null;

  constructor() {
    this.primaryClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.secondaryClient = process.env.GEMINI_API_KEY_SECONDARY
      ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY_SECONDARY)
      : null;
  }

  private log(entry: LogEntry): void {
    const logMessage = `[Gemini] ${entry.timestamp} | ${entry.keyId} | ${
      entry.errorType
    } | ${entry.statusCode || "N/A"} | ${entry.errorMessage} | Attempt:${
      entry.retryAttempt
    } | ${entry.outcome.toUpperCase()} | ${entry.operation}`;

    if (entry.outcome === "failure") {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  private isRecoverableError(error: unknown): boolean {
    const message = (error as Error)?.message?.toLowerCase() || "";
    const status =
      (error as { status?: number; code?: number })?.status ||
      (error as { status?: number; code?: number })?.code;

    return (
      status === 429 || // Rate limit
      status === 503 || // Service unavailable
      status === 502 || // Bad gateway
      status === 500 || // Internal server error (sometimes recoverable)
      message.includes("rate limit") ||
      message.includes("quota") ||
      message.includes("exceeded") ||
      message.includes("unavailable") ||
      message.includes("timeout")
    );
  }

  private getErrorType(error: unknown): string {
    const message = (error as Error)?.message?.toLowerCase() || "";
    const status =
      (error as { status?: number; code?: number })?.status ||
      (error as { status?: number; code?: number })?.code;

    if (status === 429 || message.includes("rate limit")) return "rate_limit";
    if (message.includes("quota") || message.includes("exceeded"))
      return "quota_exceeded";
    if (status === 401 || message.includes("auth")) return "auth_error";
    if (status === 503) return "service_unavailable";
    if (status === 500) return "internal_error";
    if (message.includes("timeout")) return "timeout";
    return "unknown_error";
  }

  private sanitizeErrorMessage(error: unknown): string {
    const message = (error as Error)?.message || "Unknown error";
    return message
      .replace(/key[_\s]*[a-zA-Z0-9]{10,}/gi, "[API_KEY]")
      .substring(0, 200);
  }

  /**
   * Generates content with a one-shot request.
   * This method includes robust retry and failover logic.
   */
  async generateContent(
    config: ModelConfig,
    params: GenerateContentRequest | string | (string | Part)[],
    operation: string = "generate_content"
  ): Promise<GenerateContentResult> {
    let retryAttempt = 0;
    const maxRetries = this.secondaryClient ? 2 : 1;
    let lastError: Error = new Error("Gemini client failed to initialize");

    while (retryAttempt < maxRetries) {
      const isPrimary = retryAttempt === 0;
      const client = isPrimary ? this.primaryClient : this.secondaryClient!;
      const keyId = isPrimary ? "key_1" : "key_2";

      if (!client) break;

      try {
        // 1. Get the model (local operation)
        const model = client.getGenerativeModel(config);
        
        // 2. Make the actual API call (this is what fails)
        const result = await model.generateContent(params);

        if (retryAttempt > 0) {
          this.log({
            timestamp: new Date().toISOString(),
            keyId,
            errorType: "retry_success",
            errorMessage: "Successful after failover",
            retryAttempt,
            outcome: "success",
            operation,
          });
        }

        return result;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isRecoverable = this.isRecoverableError(error);
        const canRetry =
          isRecoverable &&
          this.secondaryClient &&
          retryAttempt < maxRetries - 1;

        this.log({
          timestamp: new Date().toISOString(),
          keyId,
          errorType: this.getErrorType(error),
          statusCode:
            (error as { status?: number; code?: number })?.status ||
            (error as { status?: number; code?: number })?.code,
          errorMessage: this.sanitizeErrorMessage(error),
          retryAttempt,
          outcome: canRetry ? "retry" : "failure",
          operation,
        });

        if (canRetry) {
          retryAttempt++;
          continue;
        }

        throw lastError;
      }
    }

    throw lastError;
  }

  /**
   * Starts a new chat session.
   * NOTE: This is a local initialization, not a network API call.
   * It does not have failover logic because it cannot be rate-limited.
   * It will only use the primary API key.
   * Any subsequent calls to chat.sendMessage() will NOT have this retry logic.
   */
  async startChat(
    config: ModelConfig,
    chatConfig: StartChatParams,
    operation: string = "start_chat"
  ): Promise<ChatSession> {
    const keyId = "key_1"; // Always use the primary client for chat initialization
    try {
      const model = this.primaryClient.getGenerativeModel(config);
      const chat = model.startChat(chatConfig);
      return chat;
    } catch (error: unknown) {
      const lastError = error instanceof Error ? error : new Error(String(error));
      this.log({
        timestamp: new Date().toISOString(),
        keyId,
        errorType: this.getErrorType(error),
        statusCode:
          (error as { status?: number; code?: number })?.status ||
          (error as { status?: number; code?: number })?.code,
        errorMessage: this.sanitizeErrorMessage(error),
        retryAttempt: 0,
        outcome: "failure",
        operation,
      });
      throw lastError;
    }
  }
}

// Initialize the Gemini client manager
const geminiManager = new GeminiClientManager();

// Legacy export for backward compatibility
export const genAI = {
  getGenerativeModel: () => {
    throw new Error(
      "Legacy getGenerativeModel is deprecated. Use geminiManager.generateContent() instead."
    );
  },
};

// Configuration for different use cases
export const GEMINI_MODELS = {
  TEXT_GENERATION: "gemini-2.0-flash", // Latest Gemini 2.0 model
} as const;

// Default generation config
export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1000,
};

// Safety settings
export const SAFETY_SETTINGS: SafetySetting[] = [
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

// Generate text content with enhanced error handling
export async function generateTextContent(params: GenerateContentRequest | string | (string | Part)[]) {
  const config: ModelConfig = {
    model: GEMINI_MODELS.TEXT_GENERATION,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  };
  return await geminiManager.generateContent(config, params, "text_generation");
}

// Start chat with enhanced error handling
export async function startChatSession(chatConfig: StartChatParams) {
  const config: ModelConfig = {
    model: GEMINI_MODELS.TEXT_GENERATION,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  };
  return await geminiManager.startChat(config, chatConfig, "chat_session");
}

// Export the manager for advanced usage
export { geminiManager };