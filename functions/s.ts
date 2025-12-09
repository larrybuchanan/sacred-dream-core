// functions/s.ts

import { upsertFilesToSupabase } from "../utils/supabaseClient";
import { Dropbox } from "dropbox";
import type { files } from "dropbox";
import "dotenv/config"; // Load environment variables

// ✅ Validate token presence
if (!process.env.DROPBOX_TOKEN) {
  throw new Error("❌ DROPBOX_TOKEN is missing from .env");
}

async function syncDropbox() {
  const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN! });

  try {
    console.log("🚀 Starting Dropbox sync...");

    const response = await dbx.filesListFolder({ path: "", recursive: true });

    const filesToUpsert = response.result.entries
      .filter((entry): entry is files.FileMetadataReference => entry[".tag"] === "file")
      .map((file) => ({
        path: file.path_display!,
        filename: file.name,
        modified_at: file.server_modified!,
        tags: [file.name.split(".").pop()?.toLowerCase() || "unknown"], // Tag by extension
        source: "dropbox",
      }));

    const { data, error } = await upsertFilesToSupabase(filesToUpsert);

    if (error) {
      console.error("❌ Supabase Upsert Error:", error);
    } else {
      console.log(`✅ Upsert complete: ${data?.length ?? 0} files.`);
    }
  } catch (err) {
    console.error("❌ Dropbox Sync Error:", err);
  }
}

syncDropbox();
