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
  allowNativeLanguage?: boolean;
  detectedUserLanguage?: string;
  languageSwitchingAllowed?: boolean;
  encourageTargetLanguage?: boolean;
}

export interface ConversationPrompt {
  id: number;
  starter_text: string;
}

/**
 * Generates an AI response for a chat conversation with multilingual support
 */
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  lessonContext: LessonContext,
  conversationPrompts: ConversationPrompt[] = [],
  detectedLanguage?: string,
  languageSwitch?: { switched: boolean; fromLanguage: string; toLanguage: string; confidence: number }
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

    // Build language context for the prompt
    let languageContext = "";
    if (detectedLanguage && detectedLanguage !== lessonContext.targetLanguage) {
      languageContext = `\r\n\r\nIMPORTANT: The user just spoke in ${detectedLanguage} instead of ${lessonContext.targetLanguage}. `;
      if (languageSwitch?.switched) {
        languageContext += "Gently encourage them to practice in their target language while still being helpful. ";
      }
    }
    
    // Send the user message and get response with structured format
    const structuredPrompt = `${userMessage}${languageContext}

Respond with ONLY a JSON object in this exact format:
{
  "response": "your conversational response here",
  "suggested_answer": "a complete natural sentence the student could say"
}

For suggested_answer: Create a natural, complete sentence that directly answers your question. Use simple ${lessonContext.level} level vocabulary in ${lessonContext.targetLanguage}. Example: if you ask "What's your favorite food?", suggest "My favorite food is pizza" not just "pizza".`;

    const result = await chat.sendMessage(structuredPrompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Error generating AI response:", error);
    // Fallback to simple text response
    return JSON.stringify({
      response: "I'm here to help you practice. What would you like to talk about?",
      suggested_answer: "I'd like to practice conversation"
    });
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

Your task is to generate a warm, encouraging greeting to begin a conversation practice session.

Instructions:
1. Start with a friendly greeting.
2. After the greeting, you MUST select ONE of the "Conversation starters" from the context above.
3. Your message must END with the selected conversation starter question. Do not add any text after the question.
4. Use simple, clear language appropriate for a ${lessonContext.level} level learner.

Respond with ONLY a JSON object in this exact format:
{
  "response": "your greeting message ending with a conversation starter question",
  "suggested_answer": "a complete natural sentence the student could say to answer your question"
}

For suggested_answer: Create a natural, complete sentence that directly answers your question. Use simple ${lessonContext.level} level vocabulary.`;

    const result = await model.generateContent(greetingPrompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Error generating initial greeting:", error);
    // Fallback greeting with structured format
    return JSON.stringify({
      response: `Hello! Welcome to ${lessonContext.lessonTitle}. I'm here to help you practice your ${lessonContext.targetLanguage}. What would you like to talk about?`,
      suggested_answer: "I'd like to practice conversation"
    });
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
- Provide gentle corrections when needed
- If student uses their native language (${lessonContext.nativeLanguage}), gently encourage ${lessonContext.targetLanguage} practice
- Understand both ${lessonContext.targetLanguage} and ${lessonContext.nativeLanguage} but respond primarily in ${lessonContext.targetLanguage}${promptsText}`;
}

/**
 * Checks if all conversation prompts have been addressed
 */
export function checkPromptsCompletion(
  conversationHistory: ConversationMessage[],
  conversationPrompts: ConversationPrompt[]
): boolean {
  if (conversationPrompts.length === 0) return true;

  const addressedPrompts = getAddressedPrompts(conversationHistory, conversationPrompts);
  return addressedPrompts.length === conversationPrompts.length;
}

/**
 * Gets the list of prompts that have been addressed in the conversation
 */
export function getAddressedPrompts(
  conversationHistory: ConversationMessage[],
  conversationPrompts: ConversationPrompt[]
): ConversationPrompt[] {
  if (conversationPrompts.length === 0) return [];

  const conversationText = conversationHistory
    .map((msg) => msg.parts.toLowerCase())
    .join(" ");

  return conversationPrompts.filter((prompt) => {
    // Extract key concepts from the prompt
    const promptWords = prompt.starter_text
      .toLowerCase()
      .replace(/[?!.,]/g, "")
      .split(" ")
      .filter((word) => word.length > 2);
    
    // Look for semantic matches, not just keyword matches
    const keyWords = promptWords.filter(word => 
      !['what', 'how', 'when', 'where', 'why', 'who', 'do', 'does', 'did', 
       'can', 'could', 'would', 'should', 'will', 'are', 'is', 'was', 'were',
       'the', 'and', 'or', 'but', 'for', 'with', 'about', 'your', 'you', 'like',
       'have', 'has', 'had', 'this', 'that', 'these', 'those', 'some', 'any'].includes(word)
    );
    
    if (keyWords.length === 0) return false;
    
    // Check if at least 30% of key words appear in conversation (lowered threshold)
    const matchedWords = keyWords.filter(word => conversationText.includes(word));
    const matchRatio = matchedWords.length / keyWords.length;
    
    return matchRatio >= 0.3;
  });
}

/**
 * Uses AI to detect if user addressed any conversation starters
 */
export async function detectAddressedPromptsWithAI(
  userMessage: string,
  conversationPrompts: ConversationPrompt[],
  previouslyAddressedIds: number[]
): Promise<number[]> {
  try {
    const model = getTextGenerationModel();
    
    const unaddressedPrompts = conversationPrompts.filter(p => !previouslyAddressedIds.includes(p.id));
    if (unaddressedPrompts.length === 0) return [];

    const analysisPrompt = `Analyze if this user message addresses any of the conversation starters below.

User message: "${userMessage}"

Conversation starters:
${unaddressedPrompts.map(p => `${p.id}: ${p.starter_text}`).join('\n')}

Return ONLY a JSON array of IDs that were addressed by the user's message. If none were addressed, return [].
Example: [1, 3] or []`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const addressedIds = JSON.parse(text);
    return Array.isArray(addressedIds) ? addressedIds.filter(id => typeof id === 'number') : [];
  } catch (error) {
    console.error('AI prompt detection failed:', error);
    return [];
  }
}

/**
 * Detects newly addressed prompts from the latest user message (fallback)
 */
export function detectNewlyAddressedPrompts(
  latestUserMessage: string,
  conversationHistory: ConversationMessage[],
  conversationPrompts: ConversationPrompt[],
  previouslyAddressedIds: number[]
): number[] {
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const currentlyAddressed = getAddressedPrompts(userMessages, conversationPrompts);
  const currentlyAddressedIds = currentlyAddressed.map(p => p.id);
  return currentlyAddressedIds.filter(id => !previouslyAddressedIds.includes(id));
}
