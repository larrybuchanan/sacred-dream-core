// functions/syncFull.ts

import Dropbox from 'dropbox-sdk'; // ✅ Correct package
import dotenv from 'dotenv';
import { upsertFilesToSupabase } from '../utils/supabaseClient';

dotenv.config();

const ACCESS_TOKEN = process.env.DROPBOX_TOKEN;
if (!ACCESS_TOKEN) {
  throw new Error("❌ Missing DROPBOX_TOKEN in .env");
}

const dbx = new Dropbox({ accessToken: ACCESS_TOKEN });

async function listAllFiles(cursor?: string): Promise<any[]> {
  let files: any[] = [];

  if (cursor) {
    const res = await dbx.filesListFolderContinue({ cursor });
    files = res.result.entries;
    if (res.result.has_more) {
      files = files.concat(await listAllFiles(res.result.cursor));
    }
  } else {
    const res = await dbx.filesListFolder({ path: '', recursive: true });
    files = res.result.entries;
    if (res.result.has_more) {
      files = files.concat(await listAllFiles(res.result.cursor));
    }
  }

  return files;
}

async function syncDropboxFiles() {
  try {
    console.log("🚀 Starting full Dropbox sync...");
    const allFiles = await listAllFiles();

    const filesToSave = allFiles
      .filter((file: any) =>
        file[".tag"] === "file" &&
        typeof file.path_display === "string" &&
        typeof file.name === "string" &&
        typeof file.server_modified === "string"
      )
      .map((file: any) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        return {
          path: file.path_display.replace(/\\/g, '/'),
          filename: file.name,
          modified_at: file.server_modified,
          tags: [ext],
          source: 'dropbox',
        };
      });

    const skippedCount = allFiles.length - filesToSave.length;
    if (skippedCount > 0) {
      console.log(`⚠️ Skipped ${skippedCount} invalid or incomplete entries.`);
    }

    const result = await upsertFilesToSupabase(filesToSave);

    if (result?.error) {
      console.error("❌ Error inserting files:", result.error);
    } else {
      console.log(`✅ Synced ${filesToSave.length} files to Supabase.`);
    }

  } catch (error) {
    console.error("❌ Error during Dropbox sync:", error);
  }
}

syncDropboxFiles();
