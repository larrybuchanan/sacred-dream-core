
// dropboxClient.ts
import { Dropbox } from 'dropbox';

const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });

export async function getDropboxFilesModifiedAfter(date: Date) {
  const entries = await listFiles();
  return entries.filter(file => new Date(file.server_modified) > date);
}

export async function getAllDropboxFiles() {
  return listFiles();
}

async function listFiles(path = '') {
  let response = await dbx.filesListFolder({ path, recursive: true });
  let files = response.result.entries.filter(entry => entry['.tag'] === 'file');
  return files;
}
