import connectDB from '../db';
import File from '../models/File';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import validator from 'validator';

class FileService {
  // Upload directory configuration
  static UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  // Initialize upload directory
  static async initializeUploadDir() {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  // Helper untuk error response
  static error(message) {
    const err = new Error(message);
    err.isCustom = true;
    return err;
  }

  // Validate file
  static validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check mime type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      errors.push('File type not allowed');
    }

    return errors;
  }

  // Generate unique filename
  static generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    let name = path.basename(originalName, ext);
    // Sanitasi nama file
    name = validator.whitelist(name, 'a-zA-Z0-9-_');
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `${name}_${timestamp}_${uuid}${ext}`;
  }

  // Upload single file
  static async uploadFile(file, uploadData) {
    await connectDB();
    await this.initializeUploadDir();

    // Validate file
    const errors = this.validateFile(file);
    if (errors.length > 0) {
      throw this.error(errors.join(', '));
    }

    // Generate unique filename
    const filename = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.UPLOAD_DIR, filename);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Create file record in database
    const fileRecord = await File.create({
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: filePath,
      url: `/api/files/${filename}`,
      uploadedBy: uploadData.uploadedBy,
      category: uploadData.category || 'other',
      tags: uploadData.tags || [],
      description: uploadData.description,
      isPublic: uploadData.isPublic || false,
      accessRoles: uploadData.accessRoles || [],
      relatedEntity: uploadData.relatedEntity || null,
      metadata: uploadData.metadata || {}
    });

    return fileRecord;
  }

  // Upload multiple files
  static async uploadMultipleFiles(files, uploadData) {
    const uploadPromises = files.map(file => this.uploadFile(file, uploadData));
    return await Promise.all(uploadPromises);
  }

  // Get file by ID
  static async getFileById(fileId, userId = null) {
    await connectDB();
    
    const query = { _id: fileId, isDeleted: false };
    
    // If user is not admin, check access permissions
    if (userId) {
      query.$or = [
        { uploadedBy: userId },
        { isPublic: true },
        { accessRoles: { $in: ['admin'] } }
      ];
    }

    const file = await File.findOne(query).populate('uploadedBy', 'nama email role');
    
    if (!file) {
      throw this.error('File not found or access denied');
    }

    return file;
  }

  // Get files by user
  static async getFilesByUser(userId, options = {}) {
    await connectDB();
    
    const {
      page = 1,
      limit = 20,
      category = null,
      search = null
    } = options;

    const query = { uploadedBy: userId, isDeleted: false };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'nama email role'),
      File.countDocuments(query)
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get files by category
  static async getFilesByCategory(category, options = {}) {
    await connectDB();
    
    const {
      page = 1,
      limit = 20,
      userId = null
    } = options;

    const query = { category, isDeleted: false };
    
    // Add access control
    if (userId) {
      query.$or = [
        { uploadedBy: userId },
        { isPublic: true },
        { accessRoles: { $in: ['admin'] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'nama email role'),
      File.countDocuments(query)
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get files by entity
  static async getFilesByEntity(entityType, entityId, options = {}) {
    await connectDB();
    
    const {
      page = 1,
      limit = 20,
      userId = null
    } = options;

    const query = {
      'relatedEntity.type': entityType,
      'relatedEntity.id': entityId,
      isDeleted: false
    };
    
    // Add access control
    if (userId) {
      query.$or = [
        { uploadedBy: userId },
        { isPublic: true },
        { accessRoles: { $in: ['admin'] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'nama email role'),
      File.countDocuments(query)
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Search files
  static async searchFiles(searchTerm, options = {}) {
    await connectDB();
    
    const {
      page = 1,
      limit = 20,
      userId = null,
      category = null
    } = options;

    const query = {
      isDeleted: false,
      $or: [
        { filename: { $regex: searchTerm, $options: 'i' } },
        { originalName: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    };
    
    if (category) query.category = category;
    
    // Add access control
    if (userId) {
      query.$or = [
        { uploadedBy: userId },
        { isPublic: true },
        { accessRoles: { $in: ['admin'] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'nama email role'),
      File.countDocuments(query)
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update file metadata
  static async updateFile(fileId, updateData, userId) {
    await connectDB();
    
    const file = await File.findOne({ _id: fileId, uploadedBy: userId, isDeleted: false });
    
    if (!file) {
      throw this.error('File not found or access denied');
    }

    const allowedFields = ['description', 'tags', 'isPublic', 'accessRoles', 'category'];
    const updateFields = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });

    Object.assign(file, updateFields);
    await file.save();
    
    return file;
  }

  // Delete file (soft delete)
  static async deleteFile(fileId, userId) {
    await connectDB();
    
    const file = await File.findOne({ _id: fileId, uploadedBy: userId, isDeleted: false });
    
    if (!file) {
      throw this.error('File not found or access denied');
    }

    await file.softDelete(userId);
    return file;
  }

  // Permanently delete file
  static async permanentlyDeleteFile(fileId, userId) {
    await connectDB();
    
    const file = await File.findOne({ _id: fileId, uploadedBy: userId });
    
    if (!file) {
      throw this.error('File not found or access denied');
    }

    // Delete file from disk
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
    }

    // Delete from database
    await File.findByIdAndDelete(fileId);
    
    return { success: true };
  }

  // Restore deleted file
  static async restoreFile(fileId, userId) {
    await connectDB();
    
    const file = await File.findOne({ _id: fileId, uploadedBy: userId, isDeleted: true });
    
    if (!file) {
      throw this.error('File not found or access denied');
    }

    await file.restore();
    return file;
  }

  // Get file statistics
  static async getFileStats(userId = null) {
    await connectDB();
    
    const query = { isDeleted: false };
    if (userId) {
      query.uploadedBy = userId;
    }

    const stats = await File.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          byCategory: {
            $push: {
              category: '$category',
              size: '$size'
            }
          },
          byMimeType: {
            $push: {
              mimeType: '$mimeType',
              size: '$size'
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        byCategory: {},
        byMimeType: {}
      };
    }

    const stat = stats[0];
    
    // Group by category
    const byCategory = {};
    stat.byCategory.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { count: 0, size: 0 };
      }
      byCategory[item.category].count++;
      byCategory[item.category].size += item.size;
    });

    // Group by mime type
    const byMimeType = {};
    stat.byMimeType.forEach(item => {
      if (!byMimeType[item.mimeType]) {
        byMimeType[item.mimeType] = { count: 0, size: 0 };
      }
      byMimeType[item.mimeType].count++;
      byMimeType[item.mimeType].size += item.size;
    });

    return {
      totalFiles: stat.totalFiles,
      totalSize: stat.totalSize,
      byCategory,
      byMimeType
    };
  }

  // Get file stream for download
  static async getFileStream(fileId, userId = null) {
    const file = await this.getFileById(fileId, userId);
    
    try {
      const stream = fs.createReadStream(file.path);
      await file.incrementDownload();
      return { stream, file };
    } catch (error) {
      throw this.error('File not found on disk');
    }
  }

  // Generate thumbnail for images
  static async generateThumbnail(fileId) {
    // Implementation for image thumbnail generation
    // This would require additional libraries like sharp
    throw this.error('Thumbnail generation not implemented');
  }

  // Cleanup orphaned files
  static async cleanupOrphanedFiles() {
    await connectDB();
    
    const files = await File.find({ isDeleted: true });
    const deletedFiles = [];
    
    for (const file of files) {
      try {
        await fs.access(file.path);
        await fs.unlink(file.path);
        await File.findByIdAndDelete(file._id);
        deletedFiles.push(file._id);
      } catch (error) {
        // File doesn't exist on disk, remove from database
        await File.findByIdAndDelete(file._id);
        deletedFiles.push(file._id);
      }
    }
    
    return deletedFiles;
  }
}

export default FileService; 