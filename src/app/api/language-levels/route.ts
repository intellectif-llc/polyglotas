import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: levels, error } = await supabase
      .from("language_levels")
      .select("level_code, level_name, sort_order")
      .eq("is_available", true)
      .order("sort_order");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(levels);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch language levels" },
      { status: 500 }
    );
  }
}