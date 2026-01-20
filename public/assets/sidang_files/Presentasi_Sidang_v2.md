# Presentasi Sidang Tugas Akhir - SIAS
## Sistem Informasi Akademik Siswa Berbasis Web

---

# SLIDE 1: COVER

## SIDANG TUGAS AKHIR

### Sistem Informasi Akademik Siswa (SIAS)
### Berbasis Web Menggunakan Teknologi MERN Stack

**Studi Kasus: SMK Negeri 2 Makassar**

---

**Disusun oleh:**
- **Nama**: Ade Irawan
- **NIM**: 13203013

**Pembimbing**: [Nama Dosen Pembimbing]

**Universitas Pertamina**
Fakultas Sains dan Ilmu Komputer | Program Studi Ilmu Komputer

---

# SLIDE 2: DAFTAR ISI

## Outline Presentasi

1. **BAB I - Pendahuluan**
   - Permasalahan, Rumusan Masalah, Batasan, Tujuan & Manfaat

2. **BAB II - Tinjauan Pustaka**
   - Metode Waterfall, Tech Stack, State of The Art

3. **BAB III - Konsep Perancangan & Metodologi**
   - Diagram Alir, Business Model, Fitur, Database, ERD, API

4. **BAB IV - Hasil dan Pembahasan**
   - Implementasi, Screenshots, Pengujian

5. **BAB V - Kesimpulan dan Saran**

---

# SLIDE 3: PERMASALAHAN

## BAB I - Latar Belakang Masalah

### Permasalahan yang Ditemui di SMK Negeri 2 Makassar

**1. Proses Rekapitulasi Manual yang Tidak Efisien**

Proses pengelolaan data akademik masih sangat terfragmentasi. Setiap guru menyimpan data nilai dan absensi di file spreadsheet pribadi masing-masing, sehingga proses konsolidasi data di akhir semester menjadi **tidak efisien, memakan waktu 2-3 hari**, dan memiliki risiko tinggi terhadap kesalahan manusia (human error).

**2. Keterbatasan Akses Informasi bagi Orang Tua**

Orang tua mengalami kesenjangan informasi yang signifikan. Mereka tidak memiliki akses real-time untuk memantau perkembangan akademik dan kehadiran anak, serta harus secara proaktif menghubungi wali kelas untuk mendapat informasi.

**3. Data Tidak Terintegrasi**

Tidak ada sistem terpusat yang mengintegrasikan data akademik dari semua guru, menyebabkan inkonsistensi data dan kesulitan dalam proses pelaporan.

---

# SLIDE 4: RUMUSAN MASALAH

## BAB I - Rumusan Masalah

### Berdasarkan latar belakang, rumusan masalah penelitian ini:

**1.** Bagaimana **rancangan arsitektur sistem informasi akademik** yang mampu mengintegrasikan data siswa, nilai, dan presensi secara terpusat?

**2.** Bagaimana **mengimplementasikan fitur monitoring akademik berbasis web** yang dapat diakses secara real-time oleh orang tua siswa untuk meningkatkan transparansi pendidikan?

---

# SLIDE 5: BATASAN MASALAH

## BAB I - Batasan Masalah

### Agar penelitian lebih terarah, ditetapkan batasan:

1. Sistem dibangun menggunakan **tumpukan teknologi MERN Stack**:
   - MongoDB, Express.js, React.js (Next.js), Node.js

2. **Fitur sistem mencakup**:
   - Manajemen data siswa dan guru
   - Pencatatan presensi
   - Penginputan nilai mata pelajaran
   - Dashboard monitoring untuk orang tua

3. Sistem **tidak menangani**:
   - Proses administrasi keuangan (SPP)
   - Manajemen aset sekolah

---

# SLIDE 6: TUJUAN DAN MANFAAT

## BAB I - Tujuan & Manfaat Penelitian

### Tujuan Penelitian

1. Menghasilkan **SIAS yang mengintegrasikan** manajemen data nilai, presensi, dan data siswa dalam satu basis data terpusat

2. Menghasilkan **aplikasi web menggunakan MERN Stack** dengan antarmuka akses khusus bagi guru, siswa, dan orang tua

### Manfaat Penelitian

| Bagi | Manfaat |
|------|---------|
| **Akademik** | Kontribusi literatur pengembangan SI pendidikan dengan Next.js & NoSQL |
| **Sekolah** | Efisiensi waktu rekapitulasi, keamanan data terpusat |
| **Orang Tua** | Akses real-time informasi akademik anak tanpa batasan waktu/tempat |
| **Siswa** | Memantau riwayat nilai dan kehadiran untuk evaluasi diri |

---

# SLIDE 7: METODE WATERFALL

## BAB II - Tinjauan Pustaka: Metodologi

### Model Waterfall (Sommerville, 2014)

[PLACEHOLDER: Gambar Diagram Waterfall dari Anda]

**Tahapan Waterfall:**

1. **Requirements Definition** → Elisitasi kebutuhan melalui wawancara
2. **System & Software Design** → Perancangan arsitektur, database, UI
3. **Implementation** → Penulisan kode program
4. **Integration & System Testing** → Pengujian modul terintegrasi
5. **Operation & Maintenance** → Pemeliharaan pasca-implementasi

**Alasan Pemilihan:**
- Kebutuhan sistem stabil (kurikulum baku)
- Dokumentasi lengkap untuk tugas akhir
- Scope proyek jelas dan terukur

---

# SLIDE 8: TECH STACK

## BAB II - Tinjauan Pustaka: Teknologi Pengembangan

### MERN Stack + Next.js

| Teknologi | Peran | Keunggulan |
|-----------|-------|------------|
| **MongoDB** | Database NoSQL | Schema fleksibel, skalabilitas horizontal |
| **Express.js** | Backend Framework | Lightweight, middleware support |
| **React.js** | Frontend Library | Component-based, virtual DOM |
| **Next.js** | React Framework | SSR, API Routes, optimisasi performa |
| **Node.js** | Runtime | Non-blocking I/O, concurrent requests |

### Teknologi Pendukung

- **JWT** - Authentication & Authorization
- **Mongoose** - ODM untuk MongoDB
- **Socket.io** - Real-time notifications
- **Bcrypt** - Password encryption
- **Vercel** - Deployment platform

---

# SLIDE 9: STATE OF THE ART

## BAB II - Tinjauan Penelitian Terdahulu

| Peneliti | Metode & Teknologi | Fokus | Keterbatasan |
|----------|-------------------|-------|--------------|
| Lutviana, dkk. (2023) | Waterfall, PHP, MySQL | SIA Sekolah Dasar | Belum ada notifikasi real-time |
| Kamal & Gunaryati (2023) | Prototype, MERN Stack | SIA Web | Belum spesifik untuk SMK |
| Haryati (2019) | Waterfall, PHP | SIA SMP Boarding | Arsitektur monolitik |
| Agustin, dkk. (2022) | RUP, PHP, MySQL | SIA SMK | Belum ada portal orang tua |
| **Penelitian Ini** | **Waterfall, Next.js, MongoDB** | **SIA SMK + Portal Ortu** | **Mengisi celah dengan NoSQL + real-time** |

### Research Gap yang Diisi:
- Penerapan **NoSQL** untuk fleksibilitas data kurikulum SMK
- **Portal monitoring real-time** untuk orang tua

---

# SLIDE 10: METODOLOGI PENELITIAN

## BAB III - Konsep Perancangan

### Metodologi Pengembangan

Penelitian mengadopsi **Model Waterfall** dengan tahapan:

```
Requirements Definition (April 2024)
        ↓
System & Software Design (Mei-Juni 2024)
        ↓
Implementation (Juli-September 2024)
        ↓
Integration & Testing (Oktober 2024)
        ↓
Deployment (November 2024)
```

### Justifikasi Pemilihan Waterfall:
1. **Stabilitas Requirement** - Kurikulum baku tidak berubah
2. **Data Integrity** - Perencanaan database matang di awal
3. **Dokumentasi Akademik** - Milestone jelas per tahap
4. **Scope Terukur** - Risiko scope creep minimal

---

# SLIDE 11: DIAGRAM ALIR PERANCANGAN

## BAB III - Diagram Alir Perancangan

[PLACEHOLDER: Gambar Diagram Alir dari Anda]

**Alur Perancangan Sistem:**

1. **Elisitasi Kebutuhan**
   - Wawancara stakeholder
   - Analisis proses bisnis

2. **Perancangan**
   - Use Case Diagram
   - Class Diagram / ERD
   - UI/UX Design

3. **Implementasi**
   - Frontend (Next.js)
   - Backend (API Routes)
   - Database (MongoDB)

4. **Testing**
   - Unit Test, Integration, System Test

5. **Deployment**
   - Vercel + MongoDB Atlas

---

# SLIDE 12: ANALISIS BUSINESS PROCESS

## BAB III - Analisis Existing Business Model

### Proses Bisnis Berjalan (As-Is)

**1. Pengelolaan Tugas dan Nilai oleh Guru**
```
Guru membuat tugas → Siswa mengumpulkan → 
Guru menilai manual → Data disimpan file lokal
```
❌ Masalah: Data tersebar, risiko kehilangan

**2. Pencatatan Kehadiran**
```
Guru mencatat absen manual → Daftar absen kertas → 
Rekapitulasi manual akhir bulan
```
❌ Masalah: Waktu lama, human error

**3. Permintaan Informasi Orang Tua**
```
Ortu menghubungi guru → Guru cek data manual → 
Informasi lisan/tertulis
```
❌ Masalah: Tidak real-time, butuh waktu

---

# SLIDE 13: FITUR PER ROLE

## BAB III - Fitur Sistem per Role

### 4 Role Pengguna

| Role | Fitur Utama |
|------|-------------|
| **Admin** | Manajemen user, kelas, mapel, backup, audit log |
| **Guru** | Input nilai, kehadiran, tugas, pengumuman, rekap |
| **Siswa** | Lihat nilai, kehadiran, upload tugas, notifikasi |
| **Orang Tua** | Monitoring real-time: nilai, kehadiran, tugas anak |

### Total Functional Requirements: **111 FR** dalam **16 Modul**

| Modul | FR Count |
|-------|----------|
| Authentication | 5 |
| User Management | 9 |
| Class Management | 16 |
| Assignment | 5 |
| Attendance | 11 |
| Grades | 8 |
| Notification | 5 |
| Dan lainnya... | ... |

---

# SLIDE 14: SKEMA DATABASE MONGODB

## BAB III - Perancangan Database

### MongoDB Schema Design

**Strategi Hybrid: Embedding + Referencing**

**1. Embedding (Data tightly-coupled, volume kecil)**
```javascript
// StudentGrade - grade components embedded
{
  siswa_id: ObjectId,
  mapel_id: ObjectId,
  components: {
    UTS: { bobot: 30, nilai: 85 },
    UAS: { bobot: 40, nilai: 90 },
    Tugas: { bobot: 20, nilai: 88 }
  },
  total_grade: 87.8
}
```

**2. Referencing (High-volume, volatile data)**
```javascript
// Separate collection for attendance
{ siswa_id, session_id, status, tanggal, kelas_id }
// Indexed: siswa_id + kelas_id + tanggal
```

---

# SLIDE 15: ENTITY RELATIONSHIP

## BAB III - Notasi ERD

[PLACEHOLDER: Gambar ERD dari dokumentasi Anda]

### Entitas Utama

| Entitas | Atribut Utama | Relasi |
|---------|---------------|--------|
| **User** | _id, nama, email, role, password | 1:N dengan Kelas, Submission |
| **Kelas** | _id, nama, guru_id, tahun_ajaran | 1:N dengan Siswa, Tugas |
| **Tugas** | _id, judul, kelas_id, deadline | 1:N dengan Submission |
| **Submission** | _id, siswa_id, tugas_id, nilai | N:1 dengan User, Tugas |
| **Kehadiran** | _id, siswa_id, session_id, status | N:1 dengan User, Session |
| **Notification** | _id, user_id, title, message, read | N:1 dengan User |
| **Orangtua** | _id, parent_id, children[] | 1:N dengan User (siswa) |

---

# SLIDE 16: TECH STACK IMPLEMENTATION

## BAB III - Teknologi yang Diimplementasikan

### Frontend Stack
- **React 18.3.1** - UI components
- **Next.js 14.2.3** - SSR, routing, API routes
- **Recharts** - Data visualization
- **Lucide-react** - Icons

### Backend Stack
- **Node.js 20.14.0** - Runtime
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload

### Database & Deployment
- **MongoDB Atlas** - Cloud database
- **Vercel** - Frontend hosting + serverless
- **GitHub** - Version control + CI/CD

---

# SLIDE 17: DEPLOYMENT & ENVIRONMENT

## BAB III - Lingkungan Development & Production

### Development Environment
- **IDE**: VS Code + Cursor
- **Runtime**: Node.js v20.x, npm v9.x
- **Database**: MongoDB Atlas sandbox
- **Version Control**: Git + GitHub
- **Testing**: Jest framework

### Production Environment
- **Frontend**: Vercel (auto-deploy dari GitHub)
- **Backend**: Vercel Serverless Functions
- **Database**: MongoDB Atlas production cluster
- **CDN**: Vercel Global CDN
- **Monitoring**: Vercel Analytics + MongoDB Atlas

### CI/CD Pipeline
```
Push → GitHub Actions → Build → Test → Deploy Vercel
```

---

# SLIDE 18: API ARCHITECTURE

## BAB III - Arsitektur API

### RESTful API Structure

```
/api/
├── auth/           → Authentication (login, logout, register)
├── users/          → User Management (CRUD)
├── kelas/          → Class Management
├── subjects/       → Subject Master Data
├── tugas/          → Assignment Management
├── submissions/    → Assignment Submission
├── kehadiran/      → Attendance Records
├── grades/         → Grade Management
├── notifications/  → Notification System
├── buletin/        → Announcements
├── orangtua/       → Parent-Child Relationship
├── dashboard/      → Dashboard Analytics
├── audit-logs/     → Audit Trail
└── health/         → System Health Check
```

**Setiap endpoint mengimplementasikan:**
- JWT token verification
- Role-based access control (RBAC)
- Input validation
- Error handling
- Audit logging

---

# SLIDE 19: HASIL IMPLEMENTASI

## BAB IV - Hasil dan Pembahasan

### Statistik Implementasi

| Metrik | Hasil |
|--------|-------|
| Functional Requirements | **111** |
| Modul API | **16** |
| Test Cases | **128** |
| Success Rate | **100%** |

### Halaman yang Diimplementasikan

1. **Login Page** - Authentication untuk semua role
2. **Admin Dashboard** - Overview statistik sistem
3. **Guru Dashboard** - Manajemen kelas, nilai, kehadiran
4. **Siswa Dashboard** - Lihat nilai, tugas, presensi
5. **Orang Tua Dashboard** - Monitoring anak real-time
6. **Manajemen Nilai** - Input dan rekap nilai
7. **Manajemen Kehadiran** - Pencatatan presensi

---

# SLIDE 20: SCREENSHOTS

## BAB IV - Tampilan Aplikasi

[PLACEHOLDER: Screenshot 1 - Login Page]

[PLACEHOLDER: Screenshot 2 - Admin Dashboard]

[PLACEHOLDER: Screenshot 3 - Guru Dashboard / Manajemen Nilai]

[PLACEHOLDER: Screenshot 4 - Orang Tua Dashboard]

[PLACEHOLDER: Screenshot 5 - Siswa Dashboard / Tugas]

**Saran Screenshot Prioritas:**
1. Login Page
2. Admin Dashboard (overview)
3. Guru - Manajemen Nilai/Kehadiran
4. Orang Tua - Monitoring Anak
5. Siswa - Upload Tugas

---

# SLIDE 21: HASIL PENGUJIAN OVERVIEW

## BAB IV - Hasil Pengujian

### Strategi Testing Dua Tahap

**Tahap 1: Development Testing**
- Unit Testing dengan Jest
- Integration Testing
- Black-Box Testing

**Tahap 2: Production Testing**
- Performance Testing
- User Acceptance Testing (UAT)
- Stability Monitoring

### Ringkasan Hasil

| Jenis Testing | Hasil |
|--------------|-------|
| Unit Test | ✓ Pass |
| Integration Test | ✓ Pass |
| Black-Box Test | 128/128 (100%) |
| Performance | Avg 200ms (<2s target) |
| Usability | 4.64/5.0 |

---

# SLIDE 22: UNIT TESTING

## BAB IV - Hasil Unit Testing

### Jest Framework Testing

**Modul yang Diuji:**
- Login, Logout, Register, Refresh Token, Verify Token

```javascript
describe('API Autentikasi - Login', () => {
  it('berhasil login dengan kredensial valid', async () => {
    // Arrange - Mock user
    // Act - Call POST /api/auth/login
    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('token');
    expect(data.user.role).toBe('guru');
  });

  it('gagal (400) jika format email tidak valid', async () => {
    expect(response.status).toBe(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });
});
```

[PLACEHOLDER: Screenshot hasil Jest Testing]

---

# SLIDE 23: INTEGRATION TESTING

## BAB IV - Hasil Integration Testing

### API Integration Testing

**Testing dilakukan pada:**
- Login → Dashboard flow
- CRUD operations across modules
- Real-time notification delivery

[PLACEHOLDER: Screenshot Integrated Testing - Login Dashboard]

[PLACEHOLDER: Screenshot Integrated Testing - Get Kelas]

### Hasil Integration Test

| Endpoint | Status | Response |
|----------|--------|----------|
| POST /api/auth/login | ✓ Pass | 200 OK |
| GET /api/kelas | ✓ Pass | 200 OK |
| POST /api/tugas | ✓ Pass | 201 Created |
| GET /api/grades/by-class | ✓ Pass | 200 OK |
| POST /api/kehadiran | ✓ Pass | 201 Created |

---

# SLIDE 24: SYSTEM TESTING

## BAB IV - System Testing Sample

### Black-Box Testing - Sample Test Cases

| TC | Modul | Skenario | Expected | Actual | Status |
|----|-------|----------|----------|--------|--------|
| TC-01 | Auth | Login valid | JWT token returned | JWT token | ✓ |
| TC-02 | Auth | Login invalid pwd | Error 401 | Error 401 | ✓ |
| TC-09 | User | Create user | User created | Created | ✓ |
| TC-20 | Class | Create class | Class created | Created | ✓ |
| TC-27 | Class | Add student | Student added | Added | ✓ |

### Total Test Cases: **128**
- Positive scenarios (happy path)
- Negative scenarios (error handling)
- Edge cases

**Success Rate: 100% (128/128 Pass)**

---

# SLIDE 25: PERFORMANCE & USABILITY

## BAB IV - Pengujian Performa & Kegunaan

### Performance Testing

| Endpoint | Response Time | Status |
|----------|---------------|--------|
| Login API | 150 ms | ✓ |
| Get Users | 180 ms | ✓ |
| Get Classes | 200 ms | ✓ |
| Get Grades | 250 ms | ✓ |
| Dashboard | 280 ms | ✓ |
| **Average** | **200 ms** | **< 2s target ✓** |

### Usability Testing

| Kriteria | Rating (1-5) |
|----------|--------------|
| Kemudahan Navigasi | 4.6 |
| Kemudahan Pembelajaran | 4.5 |
| Efisiensi Penggunaan | 4.7 |
| Responsiveness | 4.8 |
| **Rata-rata** | **4.64** |

---

# SLIDE 26: EVALUASI EFISIENSI

## BAB IV - Peningkatan Efisiensi

### Perbandingan Before vs After

| Proses | Before (Manual) | After (Sistem) | Peningkatan |
|--------|-----------------|----------------|-------------|
| Rekapitulasi Nilai | 2-3 hari | 30 menit | **90%** |
| Pencatatan Kehadiran | 5-10 min/kelas | 1-2 min/kelas | **80%** |
| Akses Info Ortu | Berhari-hari | Real-time 24/7 | **100%** |

### Metrik Keberhasilan

| Metrik | Target | Hasil | Status |
|--------|--------|-------|--------|
| Test Case Success | 100% | 100% | ✓ |
| Response Time | <2s | 200ms | ✓ |
| System Uptime | >99% | 99.95% | ✓ |
| User Satisfaction | >4.5 | 4.64 | ✓ |
| Time Saving | >70% | 85% | ✓ |
| Data Accuracy | >90% | 98% | ✓ |

---

# SLIDE 27: KESIMPULAN

## BAB V - Kesimpulan

### Pencapaian Tujuan Penelitian

**✓ Tujuan 1 - TERCAPAI**
Berhasil menghasilkan **SIAS yang mengintegrasikan** manajemen data nilai, presensi, dan data siswa dalam **satu basis data terpusat** menggunakan MongoDB Atlas.

**✓ Tujuan 2 - TERCAPAI**
Berhasil menghasilkan **aplikasi web menggunakan MERN Stack + Next.js** dengan antarmuka akses khusus untuk **4 role** (Admin, Guru, Siswa, Orang Tua).

### Kontribusi Penelitian

1. Implementasi **NoSQL (MongoDB)** untuk fleksibilitas data kurikulum SMK
2. **Portal monitoring real-time** meningkatkan transparansi pendidikan
3. **Efisiensi 85%** dibanding proses manual
4. **111 FR dengan 100% test coverage** terpenuhi

---

# SLIDE 28: SARAN

## BAB V - Saran Pengembangan

### Pengembangan Jangka Pendek
- 📱 Implementasi notifikasi push mobile
- 📅 Integrasi sistem jadwal pelajaran
- 📄 Fitur ekspor rapor digital (e-rapor)
- 📊 Dashboard analytics lebih komprehensif

### Pengembangan Jangka Panjang
- 📲 Aplikasi mobile native (iOS/Android)
- 🏛️ Integrasi dengan Dapodik Kemendikbud
- 🎥 Fitur video conference pembelajaran
- 🤖 AI-based analytics prediksi performa

---

# SLIDE 29: TERIMA KASIH

## Terima Kasih

# Sesi Tanya Jawab

---

**Ade Irawan**
NIM: 13203013

📧 ade.irawan@student.universitaspertamina.ac.id

---

*Universitas Pertamina*
*Fakultas Sains dan Ilmu Komputer*

---

# SLIDE 30+: LAMPIRAN

## Lampiran yang Disarankan

### Lampiran A: Functional Requirements Detail
- Daftar lengkap 111 FR per modul

### Lampiran B: Test Case Document
- 128 test cases dengan detail input/output

### Lampiran C: API Documentation
- Endpoint list dengan request/response format

### Lampiran D: Source Code Snippets
- Contoh kode kritis (authentication, grade calculation)

### Lampiran E: Database Schema
- Complete MongoDB schema dengan field descriptions

### Lampiran F: Deployment Guide
- Langkah deployment ke Vercel + MongoDB Atlas

### Lampiran G: User Manual
- Panduan penggunaan per role
