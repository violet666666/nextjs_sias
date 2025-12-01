import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

let serverStart = Date.now();

export async function GET() {
  let dbStatus = 'unknown';
  try {
    await mongoose.connection.db.admin().ping();
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'disconnected';
  }
  return NextResponse.json({
    status: 'ok',
    db: dbStatus,
    uptime: Math.floor((Date.now() - serverStart) / 1000)
  });
} 