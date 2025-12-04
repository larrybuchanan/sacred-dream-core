
// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function upsertFilesToSupabase(files) {
  const formatted = files.map(file => ({
    path: file.path_display,
    filename: file.name,
    modified_at: file.server_modified,
    tags: [],
    source: 'dropbox',
  }));

  const { data, error } = await supabase.from('file_index').upsert(formatted, { onConflict: ['path'] });
  if (error) console.error('Supabase error:', error);
  return data;
}
