// functions/fullTextIndex.ts

import fs from 'fs';
import path from 'path';

// @ts-ignore – ignore missing types
import mammoth from 'mammoth';

// @ts-ignore – ignore missing types
import pdf from 'pdf-parse';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Supabase client setup
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// ✅ Supported file types
const SUPPORTED_EXTENSIONS = ['.docx', '.pdf', '.txt'];

// ✅ Extract plain text from supported files
async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === '.pdf') {
    const result = await pdf(buffer);
    return result.text;
  }

  if (ext === '.txt') {
    return buffer.toString('utf-8');
  }

  return '';
}

// ✅ Index text content to Supabase
async function indexContentFromFolder(folderPath: string) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const ext = path.extname(fullPath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

    try {
      const content = await extractText(fullPath);

      const { error } = await supabase
        .from('file_index')
        .update({ content })
        .eq('filename', file);

      if (error) {
        console.error(`❌ Failed to update ${file}:`, error);
      } else {
        console.log(`✅ Indexed ${file}`);
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err);
    }
  }
}

// ✅ Run the script on a specific folder (change path if needed)
(async () => {
  await indexContentFromFolder("C:/Users/Larry/Desktop/Main project Folder/project folders/Uploads");
})();
