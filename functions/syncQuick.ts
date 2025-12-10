// functions/syncQuick.ts

import Dropbox, { files } from "dropbox"; // ✅ FIXED
import { upsertFilesToSupabase } from "../utils/supabaseClient";
import "dotenv/config";

// Initialize Dropbox client
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN! });

// Type guard for FileMetadata
function isFileMetadata(entry: files.MetadataReference): entry is files.FileMetadataReference {
  return entry[".tag"] === "file";
}

export async function syncQuick() {
  try {
    console.log("⚡ Starting quick Dropbox sync...");

    const response = await dbx.filesListFolder({
      path: "",
      recursive: false,
    });

    const filesToSave = response.result.entries
      .filter(isFileMetadata)
      .map((file) => ({
        path: file.path_display!,
        filename: file.name,
        modified_at: file.server_modified,
        tags: [file.name.split(".").pop()?.toLowerCase() || "unknown"],
        source: "dropbox",
      }));

    const { data, error } = await upsertFilesToSupabase(filesToSave);
    if (error) {
      console.error("❌ Supabase upsert error:", error);
    } else {
      console.log(`✅ Synced ${data?.length ?? 0} files.`);
    }
  } catch (error) {
    console.error("❌ Dropbox syncQuick error:", error);
  }
}

// Run automatically if called directly
syncQuick();
