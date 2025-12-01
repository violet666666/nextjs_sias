import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dbConnect from './db.js';
import User from './models/userModel.js';
import Kelas from './models/Kelas.js';
import MataPelajaran from './models/MataPelajaran.js';
import Tugas from './models/Tugas.js';
import Kehadiran from './models/Kehadiran.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

(async () => {
  await dbConnect();
  // 1. Siswa hanya satu kelas
  const siswaBanyakKelas = [];
  const allSiswa = await User.find({ role: 'siswa' });
  for (const siswa of allSiswa) {
    // Cek jika siswa punya array kelas lama (misal: siswa.kelas_ids)
    if (Array.isArray(siswa.kelas_ids) && siswa.kelas_ids.length > 1) {
      siswaBanyakKelas.push({ id: siswa._id, nama: siswa.nama, kelas_ids: siswa.kelas_ids });
      siswa.kelas_id = siswa.kelas_ids[0]; // Ambil kelas pertama
      siswa.kelas_ids = undefined;
      await siswa.save();
    } else if (Array.isArray(siswa.kelas_ids) && siswa.kelas_ids.length === 1) {
      siswa.kelas_id = siswa.kelas_ids[0];
      siswa.kelas_ids = undefined;
      await siswa.save();
    }
  }
  if (siswaBanyakKelas.length) {
    console.log('Siswa yang punya lebih dari satu kelas (perlu dicek manual):');
    console.table(siswaBanyakKelas);
  } else {
    console.log('Tidak ada siswa yang punya lebih dari satu kelas.');
  }

  // 2. Update array siswa_ids di setiap kelas
  const allKelas = await Kelas.find();
  for (const kelas of allKelas) {
    const siswaKelas = await User.find({ kelas_id: kelas._id });
    kelas.siswa_ids = siswaKelas.map(s => s._id);
    await kelas.save();
  }
  console.log('Berhasil update siswa_ids di semua kelas.');

  // 3. Update mapel, tugas, kehadiran (dummy, log saja)
  // Mapel: pastikan kelas_id dan guru_id sudah terisi
  const allMapel = await MataPelajaran.find();
  for (const mapel of allMapel) {
    if (!mapel.kelas_id && Array.isArray(mapel.kelas_ids) && mapel.kelas_ids.length) {
      mapel.kelas_id = mapel.kelas_ids[0];
      mapel.kelas_ids = undefined;
      await mapel.save();
    }
  }
  console.log('Berhasil update kelas_id di semua mapel.');

  // Tugas & Kehadiran: log data yang belum punya mapel_id
  const tugasNoMapel = await Tugas.find({ mapel_id: { $exists: false } });
  if (tugasNoMapel.length) {
    console.log('Tugas yang belum punya mapel_id (perlu update manual):');
    console.table(tugasNoMapel.map(t => ({ id: t._id, judul: t.judul, kelas_id: t.kelas_id })));
  }
  const kehadiranNoMapel = await Kehadiran.find({ mapel_id: { $exists: false } });
  if (kehadiranNoMapel.length) {
    console.log('Kehadiran yang belum punya mapel_id (perlu update manual):');
    console.table(kehadiranNoMapel.map(k => ({ id: k._id, siswa_id: k.siswa_id, kelas_id: k.kelas_id })));
  }

  mongoose.connection.close();
})(); 