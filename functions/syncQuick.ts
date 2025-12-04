
// syncQuick.ts
import { getDropboxFilesModifiedAfter } from '../utils/dropboxClient';
import { upsertFilesToSupabase } from '../utils/supabaseClient';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

async function main() {
  const cutoffTime = new Date(Date.now() - FIFTEEN_MINUTES);
  const files = await getDropboxFilesModifiedAfter(cutoffTime);
  await upsertFilesToSupabase(files);
}

main().catch(console.error);
