/**
 * Migration Script: Migrasi data Orangtua dari siswa_id ke siswa_ids (array)
 * 
 * Cara menjalankan:
 * 1. Pastikan MONGODB_URI sudah di-set di .env.local
 * 2. Jalankan: node src/scripts/migrate-orangtua-array.js
 * 
 * Script ini akan:
 * - Menggabungkan multiple records Orangtua dengan user_id yang sama menjadi satu record
 * - Mengubah siswa_id menjadi siswa_ids (array)
 * - Menghapus record duplikat setelah migrasi
 */

import mongoose from 'mongoose';
import Orangtua from '../lib/models/Orangtua.js';
import connectDB from '../lib/db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

async function migrateOrangtuaArray() {
  try {
    console.log('🔄 Memulai migrasi data Orangtua...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Terhubung ke database');

    // Ambil semua record Orangtua yang masih menggunakan siswa_id (bukan array)
    // Kita akan menggunakan aggregation untuk mengelompokkan berdasarkan user_id
    const allOrangtua = await Orangtua.find({});
    
    console.log(`📊 Ditemukan ${allOrangtua.length} record Orangtua`);

    if (allOrangtua.length === 0) {
      console.log('✅ Tidak ada data Orangtua untuk dimigrasi');
      process.exit(0);
    }

    // Kelompokkan berdasarkan user_id
    const groupedByUser = {};
    
    for (const record of allOrangtua) {
      const userId = record.user_id.toString();
      
      if (!groupedByUser[userId]) {
        groupedByUser[userId] = {
          user_id: record.user_id,
          siswa_ids: [],
          nomor_telepon: record.nomor_telepon || '',
          alamat: record.alamat || '',
          pekerjaan: record.pekerjaan || '',
          timestamps: {
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          }
        };
      }
      
      // Tambahkan siswa_id ke array (jika belum ada)
      const siswaId = record.siswa_id ? record.siswa_id.toString() : null;
      if (siswaId && !groupedByUser[userId].siswa_ids.includes(siswaId)) {
        groupedByUser[userId].siswa_ids.push(siswaId);
      }
      
      // Update metadata jika perlu
      if (record.updatedAt > groupedByUser[userId].timestamps.updatedAt) {
        groupedByUser[userId].timestamps.updatedAt = record.updatedAt;
      }
    }

    console.log(`📊 Ditemukan ${Object.keys(groupedByUser).length} user_id unik`);

    // Hapus semua record lama
    await Orangtua.deleteMany({});
    console.log('🗑️  Record lama dihapus');

    // Buat record baru dengan struktur array
    let created = 0;
    for (const userId in groupedByUser) {
      const data = groupedByUser[userId];
      
      // Convert siswa_ids string ke ObjectId
      const siswaIds = data.siswa_ids.map(id => new mongoose.Types.ObjectId(id));
      
      const newRecord = await Orangtua.create({
        user_id: data.user_id,
        siswa_ids: siswaIds,
        nomor_telepon: data.nomor_telepon || undefined,
        alamat: data.alamat || undefined,
        pekerjaan: data.pekerjaan || undefined,
        createdAt: data.timestamps.createdAt,
        updatedAt: data.timestamps.updatedAt
      });
      
      created++;
      console.log(`✅ Record untuk user_id ${userId} dibuat dengan ${siswaIds.length} anak`);
    }

    console.log(`✅ Migrasi selesai! ${created} record baru dibuat`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error saat migrasi:', error);
    process.exit(1);
  }
}

// Jalankan migrasi
migrateOrangtuaArray();

