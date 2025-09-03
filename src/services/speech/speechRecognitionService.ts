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
      return { authToken: cachedToken, region: cachedRegion };
    }
  }
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

    // Create audio config from default microphone - exactly like sample project
    let audioConfig;
    if (mediaStream) {
      try {
        audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      } catch {
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

    // Create recognizer
    const recognizer = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    // Apply assessment config
    assessmentConfig.applyTo(recognizer);

    return {
      success: true,
      speechConfig,
      audioConfig,
      recognizer,
      assessmentConfig,
    };
  } catch (error) {
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
    return null;
  }

  setUiState(UIState.Processing); // Show processing state briefly

  if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {

    let processedResult: AssessmentResults | null = null;
    let overallScores: Record<string, number> = {};
    let wordsArray: WordResult[] = [];



    // Get the raw JSON result
    let resultJson: string | null = null;
    try {
      resultJson = result.properties.getProperty(
        SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
      );
    } catch {
      // Handle error silently
    }

    // Attempt to parse the JSON result
    let parsedJsonResult: Record<string, unknown> | null = null;
    if (resultJson) {
      try {
        parsedJsonResult = JSON.parse(resultJson);

        if (
          parsedJsonResult &&
          parsedJsonResult.NBest &&
          Array.isArray(parsedJsonResult.NBest) &&
          parsedJsonResult.NBest.length > 0
        ) {
          const nBest = parsedJsonResult.NBest[0] as Record<string, unknown>;

          if (nBest.PronunciationAssessment) {
            const pronunciation = nBest.PronunciationAssessment as Record<
              string,
              unknown
            >;

            // Extract overall scores
            overallScores = {
              accuracyScore: (pronunciation.AccuracyScore as number) || 0,
              fluencyScore: (pronunciation.FluencyScore as number) || 0,
              completenessScore:
                (pronunciation.CompletenessScore as number) || 0,
              prosodyScore: (pronunciation.ProsodyScore as number) || 0,
              pronScore: (pronunciation.PronScore as number) || 0,
            };

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
            } catch {
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

            // Set the final assessment results
            return processedResult;
          } else {
            setErrorMessages((prev: string[]) => [
              ...prev,
              "Could not find pronunciation assessment data in the results",
            ]);
          }
        } else {
          setErrorMessages((prev: string[]) => [
            ...prev,
            "No recognition results were found",
          ]);
        }
      } catch (processingErr) {
        setErrorMessages((prev: string[]) => [
          ...prev,
          `Failed to process results: ${processingErr}`,
        ]);
      }
    } else {
      setErrorMessages((prev: string[]) => [
        ...prev,
        "No detailed results were returned from the speech service",
      ]);
    }
  } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
    setErrorMessages((prev: string[]) => [
      ...prev,
      "No speech was recognized. Please try again.",
    ]);
  } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
    const cancelDetails = SpeechSDK.CancellationDetails.fromResult(result);
    setErrorMessages((prev: string[]) => [
      ...prev,
      `Recognition canceled: ${cancelDetails.errorDetails || "Unknown error"}`,
    ]);
  }

  setUiState(UIState.Error);
  return null;
};
