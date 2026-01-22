# Fitur Aplikasi Sesuai Role (Hak Akses)

Berikut adalah daftar fitur yang tersedia untuk masing-masing role pengguna dalam sistem SIAS.

## 1. Role: Administrator (Admin)

Admin memiliki akses penuh terhadap manajemen sistem, pengguna, dan data master.

| No | Fitur | Deskripsi | URL Path |
|----|-------|-----------|----------|
| 1 | Dashboard Admin | Menampilkan statistik ringkas (total siswa, guru, kelas aktif) & grafik tren. | `/cpanel/dashboard` |
| 2 | Manajemen User | Mengelola (CRUD) data pengguna (Admin, Guru, Siswa, Orangtua). | `/cpanel/user-management` |
| 3 | Link Orangtua-Anak | Menghubungkan akun orangtua dengan akun siswa mereka. | `/cpanel/orangtua-link` |
| 4 | Manajemen Kelas | Membuat dan mengelola data kelas & plot wali kelas. | `/cpanel/class-management` |
| 5 | Manajemen Mapel | Mengelola data mata pelajaran & guru pengampu. | `/cpanel/subjects` |
| 6 | Tahun Ajaran | Mengatur tahun ajaran aktif. | `/cpanel/academic-years` |
| 7 | Monitoring Absensi | Memantau absensi seluruh sekolah secara real-time. | `/cpanel/monitoring` |
| 8 | Rekap Absensi | Melihat dan export laporan absensi (Harian/Bulanan). | `/cpanel/rekap-absensi` |
| 9 | Manajemen Buletin | Membuat pengumuman sekolah. | `/cpanel/bulletin-management` |
| 10 | Audit Logs | Melihat riwayat aktivitas sistem untuk keamanan. | `/cpanel/audit-logs` |
| 11 | Backup & Restore | Melakukan backup database sistem. | `/cpanel/backup` |
| 12 | Pengaturan Sistem | Mengonfigurasi pengaturan global aplikasi. | `/cpanel/settings` |

## 2. Role: Guru

Guru fokus pada kegiatan belajar mengajar, absensi kelas, dan penilaian.

| No | Fitur | Deskripsi | URL Path |
|----|-------|-----------|----------|
| 1 | Dashboard Guru | Statistik kelas ajar, tugas aktif, dan siswa perlu perhatian. | `/cpanel/dashboard` |
| 2 | Kelas Saya | Melihat daftar kelas yang diajar & detail siswa per kelas. | `/cpanel/classes` |
| 3 | Manajemen Absensi | Membuka/menutup sesi absensi & input absensi manual. | `/cpanel/attendance` |
| 4 | Manajemen Tugas | Membuat, mengedit, dan menghapus tugas untuk siswa. | `/cpanel/task-management` |
| 5 | Input Nilai (Grades) | Memeriksa submission siswa dan memberikan nilai. | `/cpanel/planes/exams/[id]/grade` |
| 6 | Ujian (Exams) | Membuat jadwal ujian dan input nilai ujian. | `/cpanel/exams` |
| 7 | Rekap Nilai | Melihat rekap nilai siswa di kelas yang diajar. | `/cpanel/rekap-nilai` |
| 8 | Prestasi Siswa | Mencatat prestasi akademik/non-akademik siswa. | `/cpanel/achievements` |
| 9 | Laporan Absensi | Mencetak laporan absensi kelas wali. | `/cpanel/attendance-reports` |

## 3. Role: Siswa

Siswa menggunakan sistem untuk melihat materi, mengerjakan tugas, dan melakukan absensi.

| No | Fitur | Deskripsi | URL Path |
|----|-------|-----------|----------|
| 1 | Dashboard Siswa | Ringkasan tugas "deadline mendatang", absensi hari ini, & pengumuman. | `/cpanel/dashboard` |
| 2 | Daftar Tugas | Melihat semua tugas (aktif/selesai) dan status pengumpulan. | `/cpanel/tasks` |
| 3 | Submit Tugas | Mengunggah file/link tugas sebelum deadline. | `/cpanel/tasks/[id]` |
| 4 | Absensi Mandiri | Melakukan check-in kehadiran saat sesi kelas dibuka guru. | `/cpanel/attendance` |
| 5 | Riwayat Absensi | Melihat sejarah kehadiran pribadi. | `/cpanel/attendance` |
| 6 | Daftar Nilai | Melihat nilai yang diberikan guru untuk setiap tugas/ujian. | `/cpanel/grades` |
| 7 | Profil Saya | Mengelola profil pribadi & password. | `/cpanel/profile` |

## 4. Role: Orangtua

Orangtua memiliki akses pasif untuk memantau perkembangan akademik anak.

| No | Fitur | Deskripsi | URL Path |
|----|-------|-----------|----------|
| 1 | Dashboard Monitoring | Ringkasan performa semua anak yang terhubung. | `/cpanel/dashboard` |
| 2 | Detail Anak | Melihat detail spesifik per anak (Mapel, Wali Kelas). | `/cpanel/children/[id]` |
| 3 | Pantau Absensi | Melihat kehadiran harian anak (Hadir/Sakit/Izin/Alfa). | `/cpanel/children/[id]` (Tab Absensi) |
| 4 | Pantau Tugas | Melihat daftar tugas anak dan status pengerjaannya (Sudah/Belum). | `/cpanel/children/[id]` (Tab Tugas) |
| 5 | Pantau Nilai | Melihat nilai tugas dan ujian anak. | `/cpanel/children/[id]` (Tab Nilai) |
| 6 | Rekap Laporan | Mengunduh rekap nilai atau absensi anak. | `/cpanel/rekap-nilai` |

---
*Dokumen ini dibuat secara otomatis berdasarkan struktur navigasi aplikasi SIAS.*
