import { getTextGenerationModel } from "./client";

export interface ConversationMessage {
  role: "user" | "model";
  parts: string;
}

export interface LessonContext {
  lessonTitle: string;
  unitTitle: string;
  level: string;
  targetLanguage: string;
  nativeLanguage: string;
}

export interface ConversationPrompt {
  id: number;
  starter_text: string;
}

/**
 * Generates an AI response for a chat conversation
 */
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  lessonContext: LessonContext,
  conversationPrompts: ConversationPrompt[] = []
): Promise<string> {
  try {
    const model = getTextGenerationModel();

    // Build the system prompt with lesson context
    const systemPrompt = buildSystemPrompt(lessonContext, conversationPrompts);

    // Prepare conversation history for Gemini
    const history = conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    }));

    // Start a chat session with history
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand. I'm ready to help you practice your language skills in this lesson context.",
            },
          ],
        },
        ...history,
      ],
    });

    // Send the user message and get response
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
  }
}

/**
 * Generates an initial greeting message for a new conversation
 */
export async function generateInitialGreeting(
  lessonContext: LessonContext,
  conversationPrompts: ConversationPrompt[] = []
): Promise<string> {
  try {
    const model = getTextGenerationModel();

    const systemPrompt = buildSystemPrompt(lessonContext, conversationPrompts);
    const greetingPrompt = `
${systemPrompt}

Please provide a warm, encouraging greeting to start our conversation practice session. 
Keep it brief (1-2 sentences) and mention the lesson topic if relevant. 
Use simple, clear language appropriate for a ${lessonContext.level} level learner.
`;

    const result = await model.generateContent(greetingPrompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Error generating initial greeting:", error);
    // Fallback greeting
    return `Hello! Welcome to ${lessonContext.lessonTitle}. I'm here to help you practice your ${lessonContext.targetLanguage}. What would you like to talk about?`;
  }
}

/**
 * Builds the system prompt with lesson context and conversation starters
 */
function buildSystemPrompt(
  lessonContext: LessonContext,
  conversationPrompts: ConversationPrompt[] = []
): string {
  const promptsText =
    conversationPrompts.length > 0
      ? `\n\nConversation starters for this lesson:\n${conversationPrompts
          .map((p) => `- ${p.starter_text}`)
          .join("\n")}`
      : "";

  return `You are a helpful language learning assistant for a ${lessonContext.targetLanguage} lesson. 

Context:
- Lesson: ${lessonContext.lessonTitle}
- Unit: ${lessonContext.unitTitle}
- Level: ${lessonContext.level}
- Target Language: ${lessonContext.targetLanguage}
- Student's Native Language: ${lessonContext.nativeLanguage}

Your role:
1. Help the student practice conversational ${lessonContext.targetLanguage}
2. Keep responses appropriate for ${lessonContext.level} level
3. Be encouraging and supportive
4. Use clear, simple language
5. Ask follow-up questions to keep the conversation going
6. Gently correct mistakes when appropriate
7. Stay focused on the lesson topic when possible

Guidelines:
- Keep responses concise (1-3 sentences typically)
- Use vocabulary appropriate for ${lessonContext.level} level
- Be patient and encouraging
- Ask questions to engage the student
- Provide gentle corrections when needed${promptsText}`;
}

/**
 * Checks if all conversation prompts have been addressed
 */
export function checkPromptsCompletion(
  conversationHistory: ConversationMessage[],
  conversationPrompts: ConversationPrompt[]
): boolean {
  if (conversationPrompts.length === 0) return true;

  const conversationText = conversationHistory
    .map((msg) => msg.parts.toLowerCase())
    .join(" ");

  // Simple check: if most prompts have related keywords in the conversation
  const addressedPrompts = conversationPrompts.filter((prompt) => {
    const keywords = prompt.starter_text
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 3);
    return keywords.some((keyword) => conversationText.includes(keyword));
  });

  // Consider prompts addressed if at least 70% have been touched upon
  return addressedPrompts.length >= Math.ceil(conversationPrompts.length * 0.7);
}
