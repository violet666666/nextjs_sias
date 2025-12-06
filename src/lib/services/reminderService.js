import connectDB from '../db';
import Tugas from '../models/Tugas';
import Kelas from '../models/Kelas';
import Notification from '../models/Notification';
import Orangtua from '../models/Orangtua';
import User from '../models/userModel';

/**
 * Kirim reminder otomatis ke siswa (dan orangtua) untuk tugas yang akan deadline < 24 jam
 */
export async function sendAssignmentReminders() {
  await connectDB();
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Cari tugas yang deadline dalam 24 jam ke depan
  const tugasList = await Tugas.find({
    tanggal_deadline: { $gte: now, $lte: next24h }
  }).populate('kelas_id', 'nama_kelas');

  for (const tugas of tugasList) {
    // Cari siswa yang terdaftar di kelas tugas tsb
    const kelas = await Kelas.findById(tugas.kelas_id._id).populate('siswa_ids', 'nama email');
    if (!kelas || !kelas.siswa_ids) continue;
    for (const siswa of kelas.siswa_ids) {
      const siswaId = siswa._id || siswa;
      // Cek apakah siswa sudah dapat notifikasi untuk tugas ini (hindari duplikat)
      const existing = await Notification.findOne({
        user_id: siswaId,
        'metadata.tugas_id': tugas._id,
        type: 'task',
        category: 'academic',
        title: { $regex: tugas.judul, $options: 'i' }
      });
      if (!existing) {
        // Kirim notifikasi ke siswa
        await Notification.create({
          user_id: siswaId,
          title: `Reminder: Deadline Tugas "${tugas.judul}"` ,
          message: `Tugas "${tugas.judul}" untuk kelas ${tugas.kelas_id.nama_kelas} akan berakhir pada ${new Date(tugas.tanggal_deadline).toLocaleString('id-ID')}. Segera kumpulkan sebelum deadline!`,
          type: 'task',
          priority: 'high',
          category: 'academic',
          metadata: { tugas_id: tugas._id, kelas_id: tugas.kelas_id._id, deadline: tugas.tanggal_deadline },
          expiresAt: tugas.tanggal_deadline
        });
      }
      // Cari orangtua dari siswa (jika ada)
      const orangtuaLinks = await Orangtua.find({ siswa_ids: siswaId });
      for (const ortu of orangtuaLinks) {
        const existingOrtu = await Notification.findOne({
          user_id: ortu.user_id,
          'metadata.tugas_id': tugas._id,
          type: 'task',
          category: 'academic',
          title: { $regex: tugas.judul, $options: 'i' }
        });
        if (!existingOrtu) {
          await Notification.create({
            user_id: ortu.user_id,
            title: `Reminder: Deadline Tugas Anak "${tugas.judul}"` ,
            message: `Tugas "${tugas.judul}" untuk kelas ${tugas.kelas_id.nama_kelas} akan berakhir pada ${new Date(tugas.tanggal_deadline).toLocaleString('id-ID')}. Mohon pantau anak Anda untuk segera mengumpulkan tugas.`,
            type: 'task',
            priority: 'high',
            category: 'academic',
            metadata: { tugas_id: tugas._id, kelas_id: tugas.kelas_id._id, deadline: tugas.tanggal_deadline, anak_id: siswaId },
            expiresAt: tugas.tanggal_deadline
          });
        }
      }
    }
  }
  return { success: true, tugasCount: tugasList.length };
}

// Untuk eksekusi manual (misal: node reminderService.js)
if (require.main === module) {
  sendAssignmentReminders().then(res => {
    console.log('Reminder tugas selesai:', res);
    process.exit(0);
  }).catch(err => {
    console.error('Error reminder tugas:', err);
    process.exit(1);
  });
} 