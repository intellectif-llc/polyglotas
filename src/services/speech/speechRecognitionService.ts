import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

// Assessment interfaces matching sample project exactly
export interface AssessmentResults {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number;
  pronScore: number;
  words: WordResult[];
  recognizedText: string;
  referenceText: string;
  isScripted?: boolean;
  omittedWords?: string[];
}

export interface WordResult {
  word: string;
  accuracyScore: number;
  errorType?: string;
  offset?: number;
  duration?: number;
  syllables?: SyllableResult[];
  phonemes?: PhonemeResult[];
}

export interface SyllableResult {
  syllable: string;
  grapheme?: string;
  accuracyScore: number;
  offset?: number;
  duration?: number;
  phonemes?: PhonemeResult[];
}

export interface PhonemeResult {
  phoneme: string;
  accuracyScore: number;
  offset?: number;
  duration?: number;
  nBestPhonemes?: Array<{
    phoneme: string;
    score: number;
  }>;
}

export type UIStateType =
  | "Idle"
  | "RequestingPermissions"
  | "Listening"
  | "Processing"
  | "DisplayingResults"
  | "Error";

export interface RecognizerConfig {
  success: true;
  speechConfig: SpeechSDK.SpeechConfig;
  audioConfig: SpeechSDK.AudioConfig;
  recognizer: SpeechSDK.SpeechRecognizer;
  assessmentConfig: SpeechSDK.PronunciationAssessmentConfig;
}

/**
 * Gets authentication token for Azure Speech Service using token caching
 */
export const getTokenOrRefresh = async (): Promise<{
  authToken: string;
  region: string;
}> => {
  // Check for existing token in sessionStorage (simple caching)
  const cachedToken = sessionStorage.getItem("speech-token");
  const cachedRegion = sessionStorage.getItem("speech-region");
  const cachedTime = sessionStorage.getItem("speech-token-time");

  if (cachedToken && cachedRegion && cachedTime) {
    const now = Date.now();
    const tokenAge = now - parseInt(cachedTime);
    // Tokens are valid for 10 minutes, refresh if older than 8 minutes
    if (tokenAge < 8 * 60 * 1000) {
      console.log("🔑 Using cached speech token");
      return { authToken: cachedToken, region: cachedRegion };
    }
  }

  console.log("🔑 Fetching new speech token from backend...");
  try {
    const response = await fetch("/api/speech/token");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();

    // Cache the token
    sessionStorage.setItem("speech-token", data.authToken);
    sessionStorage.setItem("speech-region", data.region);
    sessionStorage.setItem("speech-token-time", Date.now().toString());

    return { authToken: data.authToken, region: data.region };
  } catch (error) {
    console.error("❌ Error fetching speech token:", error);
    throw error;
  }
};

/**
 * Initializes the Speech SDK recognizer for pronunciation assessment - matching sample project exactly
 */
export const initializeRecognizer = async (
  referenceText: string,
  mediaStream: MediaStream | null,
  setErrorMessages: (
    messages: string[] | ((prev: string[]) => string[])
  ) => void,
  setUiState: (state: UIStateType) => void,
  UIState: Record<string, UIStateType>
): Promise<RecognizerConfig | { success: false }> => {
  console.log("🔧 Initializing recognizer for text:", referenceText);

  setErrorMessages([]); // Clear previous errors
  setUiState(UIState.RequestingPermissions);

  try {
    const { authToken, region } = await getTokenOrRefresh();
    if (!authToken || !region) {
      throw new Error("Failed to get authentication token or region.");
    }

    // Speech Config using token - exactly like sample project
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      authToken,
      region
    );

    // --- Set Segmentation Silence Timeout (Standard Method) ---
    speechConfig.setProperty(
      SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs,
      "3500"
    );
    console.log("🔧 Set Speech_SegmentationSilenceTimeoutMs: 3500ms");

    // Create audio config from default microphone - exactly like sample project
    let audioConfig;
    if (mediaStream) {
      try {
        audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      } catch (err) {
        console.error("Error creating AudioConfig from stream:", err);
        audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      }
    } else {
      audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    }

    // Pronunciation Assessment Config - exactly like sample project
    const assessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText, // Reference text for scripted mode
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true // Enable miscue for scripted mode
    );
    assessmentConfig.enableProsodyAssessment = true; // Enable prosody
    assessmentConfig.phonemeAlphabet = "IPA"; // Set phoneme alphabet to IPA

    console.log("🎯 Assessment config:", {
      referenceText,
      gradingSystem: "HundredMark",
      granularity: "Phoneme",
      enableMiscue: true,
      enableProsodyAssessment: true,
      phonemeAlphabet: "IPA",
    });

    // Create recognizer
    const recognizer = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    // Apply assessment config
    assessmentConfig.applyTo(recognizer);

    console.log("✅ Recognizer initialized successfully");

    return {
      success: true,
      speechConfig,
      audioConfig,
      recognizer,
      assessmentConfig,
    };
  } catch (error) {
    console.error("❌ Error initializing recognizer:", error);
    setErrorMessages((prev: string[]) => [
      ...prev,
      `Initialization failed: ${error}`,
    ]);
    setUiState(UIState.Error);
    return { success: false };
  }
};

/**
 * Processes the recognition result and extracts pronunciation assessment data - matching sample project exactly
 */
export const processRecognitionResult = (
  result: SpeechSDK.SpeechRecognitionResult,
  referenceText: string,
  setErrorMessages: (
    messages: string[] | ((prev: string[]) => string[])
  ) => void,
  setUiState: (state: UIStateType) => void,
  UIState: Record<string, UIStateType>
): AssessmentResults | null => {
  // Ignore trivial results - exactly like sample project
  if (!result.text || result.text.trim() === "." || result.text.trim() === "") {
    console.log("⚠️ Ignoring trivial result:", result.text);
    return null;
  }

  setUiState(UIState.Processing); // Show processing state briefly

  if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
    console.log("🎯 Processing recognized speech:", result.text);

    let processedResult: AssessmentResults | null = null;
    let overallScores: Record<string, number> = {};
    let wordsArray: WordResult[] = [];

    // Log the ENTIRE result object by stringifying it - exactly like sample project
    try {
      // Try to stringify the entire result object to get ALL properties
      const resultCopy: Record<string, unknown> = {};
      // Copy all enumerable properties
      for (const prop in result) {
        try {
          resultCopy[prop] = (result as unknown as Record<string, unknown>)[
            prop
          ];
        } catch (err) {
          resultCopy[prop] = `[Error accessing: ${(err as Error).message}]`;
        }
      }
    } catch (stringifyErr) {
      console.log("Error stringifying complete result:", stringifyErr);
      // Fallback to logging directly
      console.log("DIRECT RESULT OBJECT:", result);
    }

    // Log ALL properties of the result object including non-enumerable ones
    try {
      const allProps = Object.getOwnPropertyNames(result);
      allProps.forEach((prop) => {
        try {
          const descriptor = Object.getOwnPropertyDescriptor(result, prop);
        } catch (propErr) {
          console.log(`- ${prop}: [Error: ${(propErr as Error).message}]`);
        }
      });
    } catch (propErr) {}

    try {
      // Save the raw result to window object for debugging
      if (typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).__lastSpeechResult =
          result;
        console.log("🔍 Raw result saved to window.__lastSpeechResult");
      }
    } catch (err) {
      console.log("⚠️ Error saving result to window:", err);
    }

    // Get ALL properties from the Speech SDK PropertyId - exactly like sample project
    const allSDKProperties: Record<string, string> = {};
    for (const propName in SpeechSDK.PropertyId) {
      try {
        const propId = (
          SpeechSDK.PropertyId as unknown as Record<string, string>
        )[propName];
        const value = result.properties.getProperty(propId);
        if (value) {
          allSDKProperties[propName] = value;
        }
      } catch (err) {
        console.log(`⚠️ Error getting SDK Property ${propName}:`, err);
      }
    }

    console.log("📊 All SDK Properties:", allSDKProperties);

    // Get the raw JSON result and log it completely - exactly like sample project
    let resultJson: string | null = null;
    try {
      resultJson = result.properties.getProperty(
        SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
      );

      // Save the raw JSON to window object for debugging
      if (typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).__lastSpeechResponse =
          resultJson;
        console.log("🔍 Raw response saved to window.__lastSpeechResponse");
      }
    } catch (jsonErr) {
      console.log("❌ Error getting raw JSON result:", jsonErr);
    }

    // Attempt to parse and log with extra detail - exactly like sample project
    let parsedJsonResult: Record<string, unknown> | null = null;
    if (resultJson) {
      try {
        parsedJsonResult = JSON.parse(resultJson);
        console.log(
          "📋 COMPLETE PARSED JSON RESULT:",
          JSON.stringify(parsedJsonResult, null, 2)
        );

        // Log top level structure
        if (parsedJsonResult) {
          console.log(
            "📋 Top-level properties:",
            Object.keys(parsedJsonResult)
          );
        }

        if (
          parsedJsonResult &&
          parsedJsonResult.NBest &&
          Array.isArray(parsedJsonResult.NBest) &&
          parsedJsonResult.NBest.length > 0
        ) {
          const nBest = parsedJsonResult.NBest[0] as Record<string, unknown>;
          console.log("📋 NBest[0] structure:", Object.keys(nBest));

          if (nBest.PronunciationAssessment) {
            const pronunciation = nBest.PronunciationAssessment as Record<
              string,
              unknown
            >;
            console.log(
              "🎯 PRONUNCIATION ASSESSMENT:",
              JSON.stringify(pronunciation, null, 2)
            );

            // Extract overall scores
            overallScores = {
              accuracyScore: (pronunciation.AccuracyScore as number) || 0,
              fluencyScore: (pronunciation.FluencyScore as number) || 0,
              completenessScore:
                (pronunciation.CompletenessScore as number) || 0,
              prosodyScore: (pronunciation.ProsodyScore as number) || 0,
              pronScore: (pronunciation.PronScore as number) || 0,
            };

            console.log("📊 Overall Scores:", overallScores);

            if (nBest.Words && Array.isArray(nBest.Words)) {
              wordsArray = (nBest.Words as Record<string, unknown>[]).map(
                (word: Record<string, unknown>) => {
                  // Extract pronunciation assessment for each word
                  const wordAssessment =
                    (word.PronunciationAssessment as Record<string, unknown>) ||
                    {};

                  // Extract syllables if available
                  const syllables = (
                    (word.Syllables as Record<string, unknown>[]) || []
                  ).map((syllable) => {
                    return {
                      syllable: syllable.Syllable as string,
                      grapheme: syllable.Grapheme as string,
                      accuracyScore:
                        ((
                          syllable.PronunciationAssessment as Record<
                            string,
                            unknown
                          >
                        )?.AccuracyScore as number) || 0,
                      offset: syllable.Offset as number,
                      duration: syllable.Duration as number,
                    };
                  });

                  // Extract phonemes if available with proper format
                  const phonemes = (
                    (word.Phonemes as Record<string, unknown>[]) || []
                  ).map((phoneme) => {
                    return {
                      phoneme: phoneme.Phoneme as string,
                      accuracyScore:
                        ((
                          phoneme.PronunciationAssessment as Record<
                            string,
                            unknown
                          >
                        )?.AccuracyScore as number) || 0,
                      offset: phoneme.Offset as number,
                      duration: phoneme.Duration as number,
                    };
                  });

                  return {
                    word: word.Word as string,
                    accuracyScore:
                      (wordAssessment.AccuracyScore as number) || 0,
                    errorType: (wordAssessment.ErrorType as string) || "None",
                    offset: word.Offset as number,
                    duration: word.Duration as number,
                    syllables: syllables.length > 0 ? syllables : undefined,
                    phonemes: phonemes.length > 0 ? phonemes : undefined,
                  };
                }
              );

              console.log("📝 Words Array:", wordsArray);
            }

            // IMPROVED OMISSION DETECTION - exactly like sample project:
            // This approach reliably detects omissions regardless of what the API returns
            try {
              // Perform omission detection in scripted mode
              if (referenceText) {
                // Split reference text into words (removing punctuation)
                const referenceWords = referenceText
                  .toLowerCase()
                  .replace(/[.,!?;:]/g, "")
                  .split(/\s+/)
                  .filter((w) => w.length > 0);

                // Get words that were actually recognized
                const recognizedWords = wordsArray
                  .map((w) => w.word?.toLowerCase())
                  .filter(Boolean);

                // Find words that appear in reference but not in recognized speech
                const omittedWords = referenceWords.filter(
                  (refWord) => !recognizedWords.includes(refWord)
                );

                // Log omissions for debugging
                if (omittedWords.length > 0) {
                  console.log("DETECTED OMISSIONS:", omittedWords);
                }

                // Add the omitted words to the result
                processedResult = {
                  accuracyScore: overallScores.accuracyScore || 0,
                  fluencyScore: overallScores.fluencyScore || 0,
                  completenessScore: overallScores.completenessScore || 0,
                  prosodyScore: overallScores.prosodyScore || 0,
                  pronScore: overallScores.pronScore || 0,
                  words: wordsArray,
                  recognizedText: result.text,
                  referenceText: referenceText,
                  omittedWords,
                  isScripted: true,
                };
              } else {
                // Handle unscripted mode
                processedResult = {
                  accuracyScore: overallScores.accuracyScore || 0,
                  fluencyScore: overallScores.fluencyScore || 0,
                  completenessScore: overallScores.completenessScore || 0,
                  prosodyScore: overallScores.prosodyScore || 0,
                  pronScore: overallScores.pronScore || 0,
                  words: wordsArray,
                  recognizedText: result.text,
                  referenceText: "",
                  isScripted: false,
                };
              }
            } catch (omissionErr) {
              console.warn("Error in manual omission detection:", omissionErr);
              // Fallback without omission detection
              processedResult = {
                accuracyScore: overallScores.accuracyScore || 0,
                fluencyScore: overallScores.fluencyScore || 0,
                completenessScore: overallScores.completenessScore || 0,
                prosodyScore: overallScores.prosodyScore || 0,
                pronScore: overallScores.pronScore || 0,
                words: wordsArray,
                recognizedText: result.text,
                referenceText: referenceText,
                isScripted: true,
              };
            }

            // Set the final assessment results - exactly like sample project
            console.log("✅ Final processed result:", processedResult);
            return processedResult;
          } else {
            console.error(
              "❌ No PronunciationAssessment found in NBest result"
            );
            setErrorMessages((prev: string[]) => [
              ...prev,
              "Could not find pronunciation assessment data in the results",
            ]);
          }
        } else {
          console.error("❌ No NBest results found");
          setErrorMessages((prev: string[]) => [
            ...prev,
            "No recognition results were found",
          ]);
        }
      } catch (processingErr) {
        console.error("❌ Error processing pronunciation data:", processingErr);
        setErrorMessages((prev: string[]) => [
          ...prev,
          `Failed to process results: ${processingErr}`,
        ]);
      }
    } else {
      console.error("❌ No JSON result found");
      setErrorMessages((prev: string[]) => [
        ...prev,
        "No detailed results were returned from the speech service",
      ]);
    }
  } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
    console.log("❌ NOMATCH: Speech could not be recognized.");
    setErrorMessages((prev: string[]) => [
      ...prev,
      "No speech was recognized. Please try again.",
    ]);
  } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
    console.log(`❌ CANCELED: Reason=${result.reason}`);
    const cancelDetails = SpeechSDK.CancellationDetails.fromResult(result);
    console.log(`❌ CANCELED: ErrorCode=${cancelDetails.ErrorCode}`);
    console.log(`❌ CANCELED: ErrorDetails=${cancelDetails.errorDetails}`);
    setErrorMessages((prev: string[]) => [
      ...prev,
      `Recognition canceled: ${cancelDetails.errorDetails || "Unknown error"}`,
    ]);
  }

  setUiState(UIState.Error);
  return null;
};
