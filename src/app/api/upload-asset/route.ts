import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  AUDIO_TYPES,
  IMAGE_TYPES,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  copyrightRiskHint,
} from "@/lib/assets";

export const runtime = "nodejs";

const BUCKET = "game-assets";

async function ensureBucket() {
  const admin = createServiceClient();
  const { data } = await admin.storage.listBuckets();
  if ((data || []).some((b) => b.id === BUCKET)) return;
  await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_AUDIO_BYTES,
    allowedMimeTypes: [...IMAGE_TYPES, ...AUDIO_TYPES],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload assets" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "");
  const rights = String(form.get("rightsConfirmed") || "") === "true";
  const label = String(form.get("label") || "");

  if (!rights) {
    return NextResponse.json(
      { error: "Confirm you have the rights to this file before uploading." },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (kind !== "image" && kind !== "audio") {
    return NextResponse.json({ error: "Invalid asset kind" }, { status: 400 });
  }

  if (kind === "image") {
    if (!IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 3 MB)" }, { status: 400 });
    }
  } else {
    if (!AUDIO_TYPES.has(file.type) && !/\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name)) {
      return NextResponse.json({ error: "Unsupported audio type" }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio too large (max 5 MB)" }, { status: 400 });
    }
  }

  const risk = copyrightRiskHint(file.name, label);
  if (risk) {
    return NextResponse.json({ error: risk, code: "copyright_risk" }, { status: 400 });
  }

  await ensureBucket();

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    (kind === "image" ? "png" : "mp3");
  const path = `${user.id}/${kind}-${crypto.randomUUID()}.${ext}`;
  const admin = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || (kind === "image" ? "image/png" : "audio/mpeg"),
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({
    url: data.publicUrl,
    path,
    kind,
    contentType: file.type,
  });
}
