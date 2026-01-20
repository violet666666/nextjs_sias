# Presentasi Sidang Tugas Akhir
## Sistem Informasi Akademik Siswa (SIAS) Berbasis Web

---

# SLIDE 1: COVER

## SIDANG TUGAS AKHIR

### Sistem Informasi Akademik Siswa (SIAS) Berbasis Web Menggunakan Teknologi MERN Stack

**Studi Kasus: SMK Negeri 2 Makassar**

---

**Disusun oleh:**
- **Nama**: Ade Irawan
- **NIM**: 13203013

**Pembimbing**: [Nama Dosen Pembimbing]

---

**Universitas Pertamina**
Fakultas Sains dan Ilmu Komputer
Program Studi Ilmu Komputer

---

# SLIDE 2: OUTLINE

## Outline Presentasi

### Bagian Pertama
1. BAB I: Pendahuluan & Latar Belakang
2. BAB II: Tinjauan Pustaka
3. BAB III: Metodologi & Perancangan

### Bagian Kedua
4. BAB IV: Hasil & Pembahasan
5. BAB V: Kesimpulan & Saran
6. Demo Aplikasi

---

# SLIDE 3: LATAR BELAKANG

## BAB I - Latar Belakang Masalah

### Kondisi Saat Ini (As-Is) di SMK Negeri 2 Makassar

❌ Rekapitulasi nilai manual menggunakan spreadsheet

❌ Data terfragmentasi di file masing-masing guru

❌ Orang tua tidak memiliki akses real-time

❌ Risiko kehilangan data dan human error tinggi

❌ Proses konsolidasi nilai semester memakan waktu **2-3 hari**

### Kebutuhan Solusi

✅ Sistem terpusat untuk manajemen data akademik

✅ Platform monitoring real-time untuk orang tua

✅ Otomatisasi perhitungan nilai dan kehadiran

✅ Akses multi-role (Admin, Guru, Siswa, Orang Tua)

---

# SLIDE 4: RUMUSAN MASALAH & TUJUAN

## BAB I - Rumusan Masalah & Tujuan

### Rumusan Masalah

1. **Bagaimana rancangan arsitektur sistem informasi akademik yang mampu mengintegrasikan data siswa, nilai, dan presensi secara terpusat?**

2. **Bagaimana mengimplementasikan fitur monitoring akademik berbasis web yang dapat diakses secara real-time oleh orang tua siswa?**

### Tujuan Penelitian

1. Menghasilkan SIAS yang mengintegrasikan manajemen data nilai, presensi, dan data siswa dalam satu basis data terpusat

2. Menghasilkan aplikasi web menggunakan MERN Stack dengan antarmuka akses khusus bagi guru, siswa, dan orang tua

---

# SLIDE 5: TINJAUAN PUSTAKA

## BAB II - State of The Art

| Peneliti | Teknologi | Fokus | Keterbatasan |
|----------|-----------|-------|--------------|
| Lutviana, dkk. (2023) | PHP, MySQL | SIA Sekolah Dasar | Belum ada notifikasi real-time |
| Kamal & Gunaryati (2023) | MERN Stack | SIA Web | Belum diterapkan pada SMK |
| Haryati (2019) | PHP Framework | SIA SMP | Arsitektur monolitik |
| **Penelitian Ini** | **Next.js, MongoDB** | **SIA SMK + Monitoring Ortu** | **Mengisi celah dengan NoSQL + real-time** |

### Research Gap yang Diisi
- Penerapan NoSQL untuk fleksibilitas data kurikulum SMK
- Portal monitoring real-time untuk orang tua

---

# SLIDE 6: METODOLOGI

## BAB III - Metodologi Pengembangan

### Model Waterfall

```
1. Requirements Definition
   ↓
2. System Design
   ↓
3. Implementation
   ↓
4. Integration & Testing
   ↓
5. Deployment
```

### Alasan Pemilihan Waterfall

| Alasan | Penjelasan |
|--------|------------|
| Stabilitas Requirement | Kurikulum dan prosedur penilaian bersifat baku |
| Dokumentasi Lengkap | Sesuai standar laporan tugas akhir |
| Scope Jelas | Kebutuhan terdefinisi dengan baik sejak awal |

---

# SLIDE 7: ARSITEKTUR TEKNOLOGI

## BAB III - Tech Stack

### Frontend
- ⚛️ **React.js 18** - Library UI berbasis komponen
- ▲ **Next.js 14** - Server-Side Rendering, API Routes

### Backend
- 🟢 **Node.js 20** - Runtime JavaScript server-side
- 🍃 **MongoDB Atlas** - Database NoSQL cloud

### Security & Deployment
- 🔐 **JWT** - Authentication & Authorization
- 🚀 **Vercel** - Hosting & CI/CD

### Keunggulan MongoDB (NoSQL)
- Schema fleksibel untuk data nilai dinamis
- Skalabilitas horizontal dengan sharding
- Performance tinggi untuk read-heavy operations

### Keunggulan Next.js
- Server-Side Rendering untuk performa
- API Routes untuk backend terintegrasi
- Optimisasi otomatis (bundling, caching)

---

# SLIDE 8: FITUR PER ROLE

## BAB III - Fitur Sistem per Role

### 👨‍💼 Admin
- Manajemen pengguna
- Manajemen kelas & mata pelajaran
- Laporan & backup sistem

### 👨‍🏫 Guru
- Input nilai & kehadiran
- Manajemen tugas
- Pengumuman kelas

### 👨‍🎓 Siswa
- Lihat nilai & kehadiran
- Upload tugas
- Notifikasi & pengumuman

### 👪 Orang Tua
- **Monitoring real-time:**
  - Nilai anak
  - Kehadiran anak
  - Status tugas anak
- Notifikasi otomatis

---

# SLIDE 9: HASIL IMPLEMENTASI

## BAB IV - Hasil Pengembangan

### Statistik Implementasi

| Metrik | Nilai |
|--------|-------|
| Functional Requirements | **111** |
| Modul API | **16** |
| Test Cases | **128** |
| Success Rate | **100%** |

### Modul yang Diimplementasikan

1. ✅ Authentication
2. ✅ User Management
3. ✅ Class Management
4. ✅ Subject Management
5. ✅ Assignment Management
6. ✅ Submission Management
7. ✅ Attendance Management
8. ✅ Grade Management
9. ✅ Reports/Rekap
10. ✅ Notification
11. ✅ Bulletin
12. ✅ Parent-Child Relationship
13. ✅ File Management
14. ✅ Discussion
15. ✅ Analytics/Dashboard
16. ✅ System (Audit, Backup, Health)

---

# SLIDE 10: HASIL PENGUJIAN

## BAB IV - Hasil Pengujian

### Pengujian Fungsionalitas (Black-Box)

| Modul | Test Cases | Pass | Rate |
|-------|-----------|------|------|
| Authentication | 7 | 7 | 100% |
| User Management | 11 | 11 | 100% |
| Class Management | 11 | 11 | 100% |
| Grade Management | 8 | 8 | 100% |
| Attendance | 11 | 11 | 100% |
| **Total** | **128** | **128** | **100%** |

### Pengujian Performa

| Endpoint | Response Time |
|----------|---------------|
| Login API | 150 ms |
| Get Kelas | 200 ms |
| Get Grades | 250 ms |
| Dashboard | 280 ms |
| **Average** | **200 ms** (target <2000 ms) ✅ |

---

# SLIDE 11: USABILITY TESTING

## BAB IV - Pengujian Kegunaan

### Hasil Rating dari Pengguna (Skala 1-5)

| Kriteria | Rating |
|----------|--------|
| Kemudahan Navigasi | ⭐ 4.6 |
| Kemudahan Pembelajaran | ⭐ 4.5 |
| Efisiensi Penggunaan | ⭐ 4.7 |
| Responsiveness | ⭐ 4.8 |
| Kepuasan Pengguna | ⭐ 4.6 |

### Rata-rata Kepuasan Pengguna

# 4.64 / 5.0 ⭐

*Berdasarkan feedback dari guru, siswa, dan orang tua*

---

# SLIDE 12: PENINGKATAN EFISIENSI

## BAB IV - Perbandingan Before vs After

### ❌ BEFORE (Manual)

| Proses | Waktu |
|--------|-------|
| Rekapitulasi nilai semester | 2-3 hari |
| Pencatatan kehadiran + rekapitulasi | 5-10 min/kelas + 2-3 jam/bulan |
| Akses informasi oleh orang tua | Berhari-hari menunggu |

### ✅ AFTER (Sistem SIAS)

| Proses | Waktu |
|--------|-------|
| Rekapitulasi nilai semester | 30 menit - 1 jam |
| Pencatatan kehadiran | 1-2 menit/kelas |
| Akses informasi oleh orang tua | Real-time 24/7 |

### Peningkatan

| Metrik | Hasil |
|--------|-------|
| Penghematan Waktu | **85%** |
| Akurasi Data | **98%** |
| System Uptime | **99.95%** |
| Transparansi Informasi | **100%** |

---

# SLIDE 13: KESIMPULAN

## BAB V - Kesimpulan

### Pencapaian Tujuan Penelitian

#### ✅ Tujuan 1: TERCAPAI
Berhasil menghasilkan SIAS yang mengintegrasikan manajemen data nilai, presensi, dan data siswa dalam satu basis data terpusat menggunakan MongoDB Atlas.

#### ✅ Tujuan 2: TERCAPAI
Berhasil menghasilkan aplikasi web menggunakan MERN Stack + Next.js dengan antarmuka akses khusus untuk 4 role (Admin, Guru, Siswa, Orang Tua).

### Kontribusi Penelitian

1. Implementasi arsitektur NoSQL (MongoDB) untuk fleksibilitas data kurikulum SMK
2. Portal monitoring real-time untuk orang tua meningkatkan transparansi pendidikan
3. Efisiensi proses administratif meningkat **85%** dibanding proses manual
4. **111 Functional Requirements** dengan **100% test coverage** terpenuhi

---

# SLIDE 14: SARAN

## BAB V - Saran Pengembangan

### Pengembangan Jangka Pendek
- 📱 Implementasi fitur notifikasi push untuk mobile
- 📅 Integrasi dengan sistem jadwal pelajaran
- 📄 Fitur ekspor rapor digital (e-rapor)
- 📊 Dashboard analytics yang lebih komprehensif

### Pengembangan Jangka Panjang
- 📲 Aplikasi mobile native (iOS/Android)
- 🏛️ Integrasi dengan Dapodik Kemendikbud
- 🎥 Fitur video conference untuk pembelajaran online
- 🤖 AI-based analytics untuk prediksi performa siswa

---

# SLIDE 15: TERIMA KASIH

## Terima Kasih

# Sesi Tanya Jawab

---

**Ade Irawan**
NIM: 13203013

📧 ade.irawan@student.universitaspertamina.ac.id

---

*Universitas Pertamina*
*Fakultas Sains dan Ilmu Komputer*
*Program Studi Ilmu Komputer*

---

# CATATAN UNTUK PRESENTASI

## Tips Presentasi Sidang

1. **Durasi**: Target 15-20 menit untuk presentasi
2. **Fokus**: Tekankan pada kontribusi dan hasil penelitian
3. **Demo**: Siapkan demo aplikasi yang sudah berjalan
4. **Backup**: Siapkan screenshot jika demo gagal
5. **Q&A**: Siapkan jawaban untuk pertanyaan umum

## Pertanyaan yang Sering Diajukan

1. Mengapa memilih MongoDB dibanding MySQL?
2. Mengapa menggunakan Waterfall bukan Agile?
3. Bagaimana sistem menangani concurrent users?
4. Apa keunggulan sistem ini dibanding yang sudah ada?
5. Bagaimana roadmap pengembangan selanjutnya?
