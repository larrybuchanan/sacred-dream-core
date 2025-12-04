
// syncFull.ts
import { getAllDropboxFiles } from '../utils/dropboxClient';
import { upsertFilesToSupabase } from '../utils/supabaseClient';

async function main() {
  const files = await getAllDropboxFiles();
  await upsertFilesToSupabase(files);
}

main().catch(console.error);
