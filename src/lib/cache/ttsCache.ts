import { TTSOptions } from "@/lib/elevenlabs/tts";
import crypto from "crypto";

interface CacheEntry {
  audio: ArrayBuffer;
  timestamp: number;
  ttl: number;
}

// In-memory cache for TTS responses
const ttsCache = new Map<string, CacheEntry>();

// Cache cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Generate cache key for TTS request
 */
export function generateTTSCacheKey(text: string, options: TTSOptions = {}): string {
  const keyData = {
    text: text.trim().toLowerCase(),
    voice: options.voice || process.env.ELEVENLABS_VOICE_ID || "default",
    stability: options.stability || 0.5,
    similarity_boost: options.similarity_boost || 0.8,
    language: options.language || "en",
  };
  
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(keyData))
    .digest("hex");
}

/**
 * Get cached TTS audio
 */
export async function getCachedTTS(key: string): Promise<ArrayBuffer | null> {
  const entry = ttsCache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check if entry has expired
  if (Date.now() > entry.timestamp + entry.ttl) {
    ttsCache.delete(key);
    return null;
  }
  
  return entry.audio;
}

/**
 * Cache TTS audio
 */
export async function cacheTTS(
  key: string, 
  audio: ArrayBuffer, 
  ttlSeconds: number = 3600 // 1 hour default
): Promise<void> {
  const entry: CacheEntry = {
    audio,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000,
  };
  
  ttsCache.set(key, entry);
  
  // Start cleanup timer if not already running
  if (!cleanupTimer) {
    startCleanupTimer();
  }
}

/**
 * Clear expired cache entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, entry] of ttsCache.entries()) {
    if (now > entry.timestamp + entry.ttl) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => ttsCache.delete(key));
  
  if (keysToDelete.length > 0) {
    console.log(`Cleaned up ${keysToDelete.length} expired TTS cache entries`);
  }
}

/**
 * Start periodic cleanup of expired entries
 */
function startCleanupTimer(): void {
  cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
}

/**
 * Stop cleanup timer (for testing or shutdown)
 */
export function stopCleanupTimer(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Clear all cached entries
 */
export function clearTTSCache(): void {
  ttsCache.clear();
}

/**
 * Get cache statistics
 */
export function getTTSCacheStats(): {
  size: number;
  totalSize: number;
  oldestEntry: number | null;
} {
  let totalSize = 0;
  let oldestTimestamp: number | null = null;
  
  for (const entry of ttsCache.values()) {
    totalSize += entry.audio.byteLength;
    if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
    }
  }
  
  return {
    size: ttsCache.size,
    totalSize,
    oldestEntry: oldestTimestamp,
  };
}