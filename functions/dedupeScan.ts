// functions/dedupeScan.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

interface FileEntry {
  id: string;
  path: string;
  filename: string;
  modified_at: string;
  source: string;
  tags: string[];
  primary: boolean;
}

// Main function to scan and detect duplicates
async function scanForDuplicates() {
  console.log('🔍 Starting duplicate scan...');

  const { data, error } = await supabase.from('file_index').select('*');

  if (error) {
    console.error('❌ Error fetching data from Supabase:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('📭 No records found in the file_index table.');
    return;
  }

  const fileMap: Record<string, FileEntry[]> = {};

  for (const file of data as FileEntry[]) {
    if (!file.path || !file.filename) {
      console.warn(`⚠️ Skipping invalid file entry: ${JSON.stringify(file)}`);
      continue;
    }

    const key = `${file.filename}::${file.modified_at}`;
    if (!fileMap[key]) {
      fileMap[key] = [];
    }
    fileMap[key].push(file);
  }

  let duplicateCount = 0;
  for (const [key, files] of Object.entries(fileMap)) {
    if (files.length > 1) {
      duplicateCount++;
      console.log(`📌 Duplicate found for: ${key}`);
      files.forEach(f => {
        console.log(`  ➤ ${f.id} | ${f.path}`);
      });
    }
  }

  if (duplicateCount === 0) {
    console.log('✅ No duplicates found!');
  } else {
    console.log(`🟡 Total duplicate groups: ${duplicateCount}`);
  }
}

scanForDuplicates().catch(e => {
  console.error('Unhandled exception in dedupeScan:', e);
});

  const seen = new Map<string, any>();
  const duplicates: any[] = [];

  for (const file of files) {
    const key = generateDupKey(file);

    if (!seen.has(key)) {
      seen.set(key, file); // mark first seen version
    } else {
      duplicates.push(file); // mark others as dupes
    }
  }

  console.log(`Found ${duplicates.length} potential duplicates.`);

  for (const dup of duplicates) {
    const { error: updateError } = await supabase
      .from("raw_dropbox_files")
      .update({
        duplicate: true,
        is_primary: false,
        legacy_reference: true
      })
      .eq("id", dup.id); // assumes table has primary key 'id'

    if (updateError) {
      console.error(`Error updating ID ${dup.id}`, updateError);
    }
  }

  console.log("Deduplication tagging complete.");
}

scanForDuplicates();
