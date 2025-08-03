/**
 * Helper utilities for audio device handling
 */

/**
 * Requests microphone access and sets up a media stream
 * @returns Promise with success flag and the media stream
 */
export const setupMicrophoneStream = async (): Promise<{
  success: boolean;
  mediaStream: MediaStream | null;
}> => {
  try {
    // Request microphone access explicitly
    const constraints = { audio: true, video: false };
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    return {
      success: true,
      mediaStream,
    };
  } catch (err) {
    console.error("Error getting microphone access:", err);
    return {
      success: false,
      mediaStream: null,
    };
  }
};

/**
 * Cleans up audio resources
 * @param mediaStream - The media stream to clean up
 * @param audioConfig - The Speech SDK audio configuration
 */
export const closeAudioResources = (
  mediaStream: MediaStream | null,
  audioConfig: { close?: () => void } | null
): void => {
  // Stop the browser's MediaStream if we have a reference
  if (mediaStream) {
    try {
      // Stop all tracks in the MediaStream
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
    } catch (mediaErr) {
      console.error("Error stopping MediaStream:", mediaErr);
    }
  }

  if (audioConfig) {
    try {
      // Before closing, get a direct reference to the internal audio stream if available
      let audioStream = null;
      try {
        // This is implementation-specific and might not be accessible
        audioStream = (audioConfig as unknown as { privAudioConfig?: { audioDeviceInfo?: { stop?: () => void } } })?.privAudioConfig?.audioDeviceInfo;
      } catch {
        // Silent catch - just a best-effort attempt
      }

      // Close the audio config
      if (audioConfig.close) {
        audioConfig.close();
      }

      // Force browser audio API cleanup if possible via stream reference
      if (audioStream && typeof audioStream.stop === "function") {
        try {
          audioStream.stop();
        } catch {
          // Silent catch
        }
      }
    } catch (audioCloseErr) {
      console.error("Error closing AudioConfig:", audioCloseErr);
    }
  }
};
