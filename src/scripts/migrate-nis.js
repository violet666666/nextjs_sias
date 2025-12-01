/**
 * Migration Script: Menambahkan NIS ke data siswa yang sudah ada
 * 
 * Cara menjalankan:
 * 1. Pastikan MONGODB_URI sudah di-set di .env.local
 * 2. Jalankan: node src/scripts/migrate-nis.js
 * 
 * Script ini akan:
 * - Menambahkan NIS unik untuk setiap siswa yang belum memiliki NIS
 * - Format NIS: SISWA-YYYYMMDD-XXXX (contoh: SISWA-20240101-0001)
 */

import mongoose from 'mongoose';
import User from '../lib/models/userModel.js';
import connectDB from '../lib/db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

async function migrateNIS() {
  try {
    console.log('🔄 Memulai migrasi NIS...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Terhubung ke database');

    // Ambil semua siswa yang belum memiliki NIS
    const siswaWithoutNIS = await User.find({ 
      role: 'siswa',
      $or: [
        { nis: { $exists: false } },
        { nis: null },
        { nis: '' }
      ]
    });

    console.log(`📊 Ditemukan ${siswaWithoutNIS.length} siswa tanpa NIS`);

    if (siswaWithoutNIS.length === 0) {
      console.log('✅ Semua siswa sudah memiliki NIS');
      process.exit(0);
    }

    // Generate NIS untuk setiap siswa
    let counter = 1;
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    for (const siswa of siswaWithoutNIS) {
      // Format: SISWA-YYYYMMDD-XXXX
      const nis = `SISWA-${dateStr}-${String(counter).padStart(4, '0')}`;
      
      // Cek apakah NIS sudah ada (untuk memastikan unique)
      const existing = await User.findOne({ nis });
      if (existing) {
        // Jika sudah ada, coba dengan counter yang berbeda
        counter++;
        continue;
      }

      siswa.nis = nis;
      await siswa.save();
      console.log(`✅ Siswa ${siswa.nama} (${siswa.email}) mendapat NIS: ${nis}`);
      counter++;
    }

    console.log('✅ Migrasi NIS selesai!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error saat migrasi:', error);
    process.exit(1);
  }
}

// Jalankan migrasi
migrateNIS();

