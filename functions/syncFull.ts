// functions/syncFull.ts

import { Dropbox, files } from "dropbox";
import dotenv from "dotenv";
import { upsertFilesToSupabase } from "../utils/supabaseClient";

dotenv.config();

const ACCESS_TOKEN = process.env.DROPBOX_TOKEN;
if (!ACCESS_TOKEN) {
  throw new Error("❌ Missing DROPBOX_TOKEN in .env");
}

const dbx = new Dropbox({ accessToken: ACCESS_TOKEN });

async function listAllFiles(cursor?: string): Promise<files.FileMetadataReference[]> {
  let entries: files.MetadataReference[] = [];

  if (cursor) {
    const res = await dbx.filesListFolderContinue({ cursor });
    entries = res.result.entries;
    if (res.result.has_more) {
      const moreEntries = await listAllFiles(res.result.cursor);
      entries = entries.concat(moreEntries);
    }
  } else {
    const res = await dbx.filesListFolder({ path: "", recursive: true });
    entries = res.result.entries;
    if (res.result.has_more) {
      const moreEntries = await listAllFiles(res.result.cursor);
      entries = entries.concat(moreEntries);
    }
  }

  return entries.filter((entry): entry is files.FileMetadataReference => entry[".tag"] === "file");
}

async function syncDropboxFiles() {
  try {
    console.log("🚀 Starting full Dropbox sync...");
    const allFiles = await listAllFiles();

    const filesToSave = allFiles.map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      return {
        path: file.path_display!.replace(/\\/g, '/'),
        filename: file.name,
        modified_at: file.server_modified!,
        tags: [ext],
        source: 'dropbox',
      };
    });

    const result = await upsertFilesToSupabase(filesToSave);

    if (result?.error) {
      console.error("❌ Supabase upsert error:", result.error);
    } else {
      console.log(`✅ Synced ${filesToSave.length} files to Supabase.`);
    }

  } catch (error) {
    console.error("❌ Error during Dropbox sync:", error);
  }
}

syncDropboxFiles();
