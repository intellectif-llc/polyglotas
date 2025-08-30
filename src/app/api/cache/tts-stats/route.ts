import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTTSCacheStats, clearTTSCache } from "@/lib/cache/ttsCache";

export async function GET() {
  try {
    // Verify user is authenticated (optional - could be admin only)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = getTTSCacheStats();
    
    return NextResponse.json({
      cacheSize: stats.size,
      totalSizeBytes: stats.totalSize,
      totalSizeMB: Math.round(stats.totalSize / (1024 * 1024) * 100) / 100,
      oldestEntry: stats.oldestEntry ? new Date(stats.oldestEntry).toISOString() : null,
    });
  } catch (error) {
    console.error("TTS cache stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Verify user is authenticated (should be admin only in production)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    clearTTSCache();
    
    return NextResponse.json({
      success: true,
      message: "TTS cache cleared successfully",
    });
  } catch (error) {
    console.error("TTS cache clear error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}