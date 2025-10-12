import { getTextGenerationModel } from "./client";
import type { ConversationMessage, LessonContext, ConversationPrompt } from "./conversation";

export interface MultimodalGeminiResult {
  transcript: string;
  aiResponse: string;
  suggestedAnswer: string | null;
  detectedLanguage: string;
  confidence: number;
  languageSwitch: {
    switched: boolean;
    fromLanguage: string;
    toLanguage: string;
    confidence: number;
  };
  provider: string;
}

/**
 * Single multimodal request that transcribes audio and generates conversation response
 */
export async function transcribeAndRespondWithGemini(
  audioBlob: Blob,
  conversationHistory: ConversationMessage[],
  lessonContext: LessonContext,
  conversationPrompts: ConversationPrompt[] = []
): Promise<MultimodalGeminiResult> {
  console.log('🟡 === GEMINI MULTIMODAL REQUEST INITIATED ===');
  console.log('🟡 Gemini Multimodal: Audio blob info - size:', audioBlob.size, 'type:', audioBlob.type);
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = getTextGenerationModel();

    // Convert audio blob to base64
    console.log('🟡 Gemini Multimodal: Converting audio to base64...');
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    console.log('🟡 Gemini Multimodal: Base64 conversion complete, length:', base64Audio.length);

    // Build system prompt with lesson context
    const systemPrompt = buildSystemPrompt(lessonContext, conversationPrompts);

    // Prepare conversation history for Gemini
    const history = conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    }));

    // Create multimodal prompt that does both transcription and conversation
    const multimodalPrompt = `${systemPrompt}

TASK: You will receive an audio file. Please:
1. First, transcribe the audio content accurately
2. Then, respond to the transcribed message as a helpful language learning assistant

The expected language is ${lessonContext.targetLanguage}, but the user might speak in ${lessonContext.nativeLanguage}.

Respond with ONLY a JSON object in this exact format:
{
  "transcript": "the exact transcribed text from the audio",
  "response": "your conversational response to the transcript",
  "suggested_answer": "a complete natural sentence the student could say",
  "detected_language": "language code of the transcribed audio"
}

For suggested_answer: Create a natural, complete sentence that directly answers your question. Use simple ${lessonContext.level} level vocabulary in ${lessonContext.targetLanguage}.`;

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

    // Send multimodal request with audio and prompt
    console.log('🟡 Gemini Multimodal: Sending combined transcription + conversation request...');
    const result = await chat.sendMessage([
      { text: multimodalPrompt },
      {
        inlineData: {
          mimeType: audioBlob.type || 'audio/webm',
          data: base64Audio
        }
      }
    ]);

    const response = await result.response;
    const responseText = response.text();
    
    console.log('🟡 Gemini Multimodal: Raw API response:', responseText);

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini multimodal response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const transcript = parsed.transcript?.trim() || '';
    const aiResponse = parsed.response?.trim() || '';
    const suggestedAnswer = parsed.suggested_answer?.trim() || null;
    const detectedLanguage = parsed.detected_language || lessonContext.targetLanguage;

    if (!transcript) {
      throw new Error('No transcript found in Gemini multimodal response');
    }

    if (!aiResponse) {
      throw new Error('No AI response found in Gemini multimodal response');
    }

    const multimodalResult: MultimodalGeminiResult = {
      transcript,
      aiResponse,
      suggestedAnswer,
      detectedLanguage,
      confidence: 0.85, // Estimated confidence for Gemini
      languageSwitch: {
        switched: detectedLanguage !== lessonContext.targetLanguage,
        fromLanguage: lessonContext.targetLanguage,
        toLanguage: detectedLanguage,
        confidence: 0.9,
      },
      provider: 'gemini-multimodal',
    };

    console.log('✅ Gemini Multimodal: Final result:', multimodalResult);
    return multimodalResult;

  } catch (error) {
    console.error('🟡 Gemini Multimodal: Error during processing:', error);
    throw error;
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

  const userNameContext = lessonContext.userName 
    ? `\n- Student's Name: ${lessonContext.userName}` 
    : "";

  const nameGuidelines = lessonContext.userName
    ? `\n- When transcribing audio, if you hear something similar to "${lessonContext.userName}", transcribe it as the student's actual name
- Use the student's name naturally in conversation when appropriate, but don't overuse it
- If a conversation starter asks about the student's name, don't include their name in the question (e.g., say "What's your name?" not "What's your name, ${lessonContext.userName}?")`
    : "";

  return `You are a helpful language learning assistant for a ${lessonContext.targetLanguage} lesson. 

Context:
- Lesson: ${lessonContext.lessonTitle}
- Unit: ${lessonContext.unitTitle}
- Level: ${lessonContext.level}
- Target Language: ${lessonContext.targetLanguage}
- Student's Native Language: ${lessonContext.nativeLanguage}${userNameContext}

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
- Understand both ${lessonContext.targetLanguage} and ${lessonContext.nativeLanguage} but respond primarily in ${lessonContext.targetLanguage}${nameGuidelines}${promptsText}`;
}