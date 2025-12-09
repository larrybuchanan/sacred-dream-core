
// utils/supabaseClient.ts

import dotenv from 'dotenv';
dotenv.config(); // 🔥 Load .env when this file runs

import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env");
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Strict validator
function isValidDropboxFile(file: any): boolean {
  return (
    file &&
    typeof file.path_display === "string" &&
    typeof file.name === "string" &&
    typeof file.server_modified === "string"
  );
}

export async function upsertFilesToSupabase(files: any[]) {
  const filtered = files.filter(isValidDropboxFile);

  const formatted = filtered.map(file => ({
    path: file.path_display,
    filename: file.name,
    modified_at: file.server_modified,
    tags: [],
    source: 'dropbox',
  }));

  if (formatted.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('file_index')
    .upsert(formatted, { onConflict: 'path' });

  return { data, error };
}
