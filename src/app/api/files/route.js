import { NextResponse } from 'next/server';
import FileService from '@/lib/services/fileService';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

// GET: List files with pagination and filters
export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const currentUser = authResult.user;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const category = searchParams.get('category') || null;
    const search = searchParams.get('search') || null;
    const entityType = searchParams.get('entityType') || null;
    const entityId = searchParams.get('entityId') || null;

    let result;
    
    if (entityType && entityId) {
      // Get files by entity
      result = await FileService.getFilesByEntity(entityType, entityId, {
        page,
        limit,
        userId: currentUser.id
      });
    } else if (category) {
      // Get files by category
      result = await FileService.getFilesByCategory(category, {
        page,
        limit,
        userId: currentUser.id
      });
    } else if (search) {
      // Search files
      result = await FileService.searchFiles(search, {
        page,
        limit,
        userId: currentUser.id,
        category
      });
    } else {
      // Get user's files
      result = await FileService.getFilesByUser(currentUser.id, {
        page,
        limit,
        category,
        search
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upload file(s)
export async function POST(request) {
  let userId = null;
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    userId = currentUser.id || currentUser._id;
    
    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files');
    const category = formData.get('category') || 'other';
    const tags = formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [];
    const description = formData.get('description') || '';
    const isPublic = formData.get('isPublic') === 'true';
    const accessRoles = formData.get('accessRoles') ? formData.get('accessRoles').split(',') : [];
    const entityType = formData.get('entityType') || null;
    const entityId = formData.get('entityId') || null;
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata')) : {};

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadData = {
      uploadedBy: currentUser.id,
      category,
      tags,
      description,
      isPublic,
      accessRoles,
      relatedEntity: entityType && entityId ? { type: entityType, id: entityId } : null,
      metadata
    };

    let result;
    
    if (files.length === 1) {
      // Single file upload
      const file = files[0];
      result = await FileService.uploadFile(file, uploadData);
      await logCRUDAction(userId, 'UPLOAD_FILE', 'FILE', result?._id, { name: result?.originalname || result?.filename, category });
    } else {
      // Multiple files upload
      result = await FileService.uploadMultipleFiles(files, uploadData);
      for (const f of result) {
        await logCRUDAction(userId, 'UPLOAD_FILE', 'FILE', f?._id, { name: f?.originalname || f?.filename, category });
      }
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'UPLOAD_FILE', 'FILE', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update file metadata
export async function PATCH(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const currentUser = authResult.user;
    const body = await request.json();
    const { fileId, ...updateData } = body;
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }
    
    const result = await FileService.updateFile(fileId, updateData, currentUser.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete file(s)
export async function DELETE(request) {
  let userId = null;
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    userId = currentUser.id || currentUser._id;
    
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }
    
    let result;
    
    if (permanent) {
      result = await FileService.permanentlyDeleteFile(fileId, currentUser.id);
    } else {
      result = await FileService.deleteFile(fileId, currentUser.id);
    }
    await logCRUDAction(userId, 'DELETE_FILE', 'FILE', fileId, { permanent });
    return NextResponse.json(result);
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'DELETE_FILE', 'FILE', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 