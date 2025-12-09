import { Dropbox } from 'dropbox';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

const ACCESS_TOKEN = process.env.DROPBOX_TOKEN;

if (!ACCESS_TOKEN) {
  throw new Error("❌ Missing DROPBOX_TOKEN in .env");
}

export const dbx = new Dropbox({ accessToken: ACCESS_TOKEN });
