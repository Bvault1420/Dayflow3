#!/usr/bin/env node
/** Create public game-assets bucket (policies still need SQL migration in Dashboard if missing). */
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Missing env");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.id === "game-assets");
  if (exists) {
    console.log("bucket exists");
  } else {
    const { data, error } = await admin.storage.createBucket("game-assets", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp4",
        "audio/webm",
        "audio/x-wav",
      ],
    });
    if (error) throw error;
    console.log("created bucket", data);
  }

  // Try applying storage policies via SQL if db endpoint available — otherwise print reminder
  console.log(
    "If client uploads fail with RLS, run supabase/migrations/003_game_assets_storage.sql in the SQL Editor."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
