import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { languageCode } = await request.json();

    if (!languageCode) {
      return NextResponse.json({ error: "Language code is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("student_profiles")
      .update({ native_language_code: languageCode })
      .eq("profile_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update native language" },
      { status: 500 }
    );
  }
}