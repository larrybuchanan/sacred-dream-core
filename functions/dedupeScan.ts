// functions/dedupeScan.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

interface FileEntry {
  id: string;
  path: string;
  filename: string;
  modified_at: string;
  source: string;
  tags: string[];
  primary: boolean;
}

// Generate a composite key for duplication check
function generateDupKey(file: FileEntry): string {
  return `${file.filename}::${file.modified_at}`;
}

// Main function to scan and tag duplicates
async function scanForDuplicates() {
  console.log('🔍 Starting duplicate scan...');

  const { data: files, error } = await supabase.from('file_index').select('*');

  if (error) {
    console.error('❌ Error fetching data from Supabase:', error);
    return;
  }

  if (!files || files.length === 0) {
    console.log('📭 No records found in file_index.');
    return;
  }

  const seen = new Map<string, FileEntry>();
  const duplicates: FileEntry[] = [];

  for (const file of files) {
    if (!file.filename || !file.modified_at) continue;

    const key = generateDupKey(file);

    if (!seen.has(key)) {
      seen.set(key, file); // First one seen
    } else {
      duplicates.push(file); // Mark duplicates
    }
  }

  console.log(`🟡 Found ${duplicates.length} potential duplicates.`);

  for (const dup of duplicates) {
    const { error: updateError } = await supabase
      .from('file_index')
      .update({
        duplicate: true,
        is_primary: false,
        legacy_reference: true, // ✅ Fixed comma here
        tags: [...(dup.tags || []), 'duplicate'],
        primary: false
      })
      .eq('id', dup.id);

    if (updateError) {
      console.error(`❌ Error updating ID ${dup.id}`, updateError);
    }
  }

  console.log('✅ Deduplication tagging complete.');
}

scanForDuplicates().catch((e) => {
  console.error('🔥 Unhandled exception in dedupeScan:', e);
});
