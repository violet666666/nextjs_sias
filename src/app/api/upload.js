import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, uploadDir: './public/uploads', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) {
        resolve(NextResponse.json({ error: 'Gagal upload file' }, { status: 500 }));
        return;
      }
      const file = files.file;
      if (!file) {
        resolve(NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 }));
        return;
      }
      // Path file yang bisa diakses frontend
      const filePath = `/uploads/${file.newFilename}`;
      resolve(NextResponse.json({ file_path: filePath }));
    });
  });
} 