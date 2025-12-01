import AuditLog from './models/AuditLog.js';
import connectDB from './db.js';

let ioInstance = null;
export const setAuditLoggerIO = (io) => { ioInstance = io; };

/**
 * Utility function untuk mencatat audit log
 * @param {Object} params - Parameter untuk audit log
 * @param {string} params.user_id - ID user yang melakukan aksi
 * @param {string} params.action - Jenis aksi (CREATE_USER, UPDATE_USER, dll)
 * @param {string} params.resource_type - Jenis resource (USER, KELAS, dll)
 * @param {string} params.resource_id - ID resource (optional)
 * @param {Object} params.details - Detail tambahan (optional)
 * @param {string} params.ip_address - IP address (optional)
 * @param {string} params.user_agent - User agent (optional)
 * @param {string} params.status - Status aksi (SUCCESS, FAILED, PENDING)
 * @param {string} params.error_message - Pesan error jika gagal (optional)
 */
export const logAudit = async (params) => {
  try {
    await connectDB();
    
    const auditEntry = new AuditLog({
      user_id: params.user_id,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      details: params.details,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
      status: params.status || 'SUCCESS',
      error_message: params.error_message,
      timestamp: new Date()
    });

    await auditEntry.save();
    // Emit real-time activity feed update
    if (ioInstance) {
      const recent = await AuditLog.find().sort({ timestamp: -1 }).limit(10).populate('user_id', 'nama email role').lean();
      ioInstance.emit('activity_feed_update', recent);
    }
    return auditEntry;
  } catch (error) {
    console.error('Error logging audit:', error);
    // Don't throw error to avoid breaking main functionality
    return null;
  }
};

/**
 * Helper function untuk mencatat aksi user
 */
export const logUserAction = async (userId, action, resourceType, resourceId = null, details = null, status = 'SUCCESS', errorMessage = null) => {
  return await logAudit({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    status,
    error_message: errorMessage
  });
};

/**
 * Helper function untuk mencatat login/logout
 */
export const logAuthAction = async (userId, action, status = 'SUCCESS', errorMessage = null, ipAddress = null, userAgent = null) => {
  return await logAudit({
    user_id: userId,
    action,
    resource_type: 'SYSTEM',
    details: { auth_action: action },
    status,
    error_message: errorMessage,
    ip_address: ipAddress,
    user_agent: userAgent
  });
};

/**
 * Helper function untuk mencatat aksi CRUD
 */
export const logCRUDAction = async (userId, action, resourceType, resourceId, details = null, status = 'SUCCESS', errorMessage = null) => {
  return await logAudit({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    status,
    error_message: errorMessage
  });
};

/**
 * Helper function untuk mencatat bulk action
 */
export const logBulkAction = async (userId, action, resourceType, resourceIds, details = null, status = 'SUCCESS', errorMessage = null) => {
  return await logAudit({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: null, // Tidak mengirim resource_id untuk bulk action
    details: {
      ...details,
      affected_resources: resourceIds,
      count: resourceIds.length
    },
    status,
    error_message: errorMessage
  });
};

/**
 * Helper function untuk mencatat export/import data
 */
export const logDataAction = async (userId, action, resourceType, details = null, status = 'SUCCESS', errorMessage = null) => {
  return await logAudit({
    user_id: userId,
    action,
    resource_type: resourceType,
    details,
    status,
    error_message: errorMessage
  });
};

/**
 * Middleware untuk mencatat request secara otomatis
 */
export const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      const userId = req.user?.id || req.user?._id;
      const status = res.statusCode >= 400 ? 'FAILED' : 'SUCCESS';
      const errorMessage = res.statusCode >= 400 ? data : null;
      
      logUserAction(
        userId,
        action,
        resourceType,
        req.params?.id || req.body?.id,
        { method: req.method, path: req.path, statusCode: res.statusCode },
        status,
        errorMessage
      );
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      const userId = req.user?.id || req.user?._id;
      const status = res.statusCode >= 400 ? 'FAILED' : 'SUCCESS';
      const errorMessage = res.statusCode >= 400 ? (data?.error || data?.message) : null;
      
      logUserAction(
        userId,
        action,
        resourceType,
        req.params?.id || req.body?.id,
        { method: req.method, path: req.path, statusCode: res.statusCode },
        status,
        errorMessage
      );
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}; 