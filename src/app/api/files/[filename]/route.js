import { NextResponse } from 'next/server';
import FileService from '@/lib/services/fileService';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import path from 'path';

// GET: Download file
export async function GET(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const currentUser = authResult.user;
    const { filename } = params;
    
    // Find file by filename
    const file = await FileService.getFileById(filename, currentUser.id);
    
    // Get file stream
    const { stream, file: fileRecord } = await FileService.getFileStream(file._id, currentUser.id);
    
    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', fileRecord.mimeType);
    headers.set('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
    headers.set('Content-Length', fileRecord.size.toString());
    
    // Return file stream
    return new NextResponse(stream, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 