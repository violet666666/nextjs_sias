import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AuditLog from '@/lib/models/AuditLog';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { connectDB as mongoConnectDB } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    let limit = parseInt(searchParams.get('limit')) || 10;
    if (limit > 50) limit = 50;
    const skip = (page - 1) * limit;
    
    // Filtering
    const user_id = searchParams.get('user_id');
    const action = searchParams.get('action');
    const resource_type = searchParams.get('resource_type');
    const status = searchParams.get('status');
    const date_start = searchParams.get('date_start');
    const date_end = searchParams.get('date_end');
    const search = searchParams.get('search');
    
    // Build query
    const query = {};
    
    if (user_id) query.user_id = user_id;
    if (action) query.action = action;
    if (resource_type) query.resource_type = resource_type;
    if (status) query.status = status;
    
    if (date_start || date_end) {
      query.timestamp = {};
      if (date_start) query.timestamp.$gte = new Date(date_start);
      if (date_end) query.timestamp.$lte = new Date(date_end + 'T23:59:59.999Z');
    }
    
    if (search) {
      query.$or = [
        { 'details.message': { $regex: search, $options: 'i' } },
        { error_message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with population
    const [auditLogs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user_id', 'nama email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      data: auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await request.json();
    
    const { user_id, action, resource_type, resource_id, details, ip_address, user_agent, status, error_message } = body;
    
    if (!user_id || !action || !resource_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const auditLog = new AuditLog({
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent,
      status: status || 'SUCCESS',
      error_message,
      timestamp: new Date()
    });
    
    await auditLog.save();
    
    return NextResponse.json({ message: 'Audit log created successfully', data: auditLog }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function getLatestLogs(request) {
  try {
    await mongoConnectDB();
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit')) || 10;
    if (limit > 50) limit = 50;
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user_id', 'nama email role');
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 