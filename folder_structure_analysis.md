# 📁 Analisis Struktur Folder SIAS (Sistem Informasi Akademik)

> **Tujuan**: Dokumen ini membantu Anda memahami arsitektur proyek untuk sidang akhir, menemukan lokasi kode dengan cepat, dan mengantisipasi pertanyaan teknikal dari dosen.

---

## 📋 Ringkasan Proyek

| Aspek | Detail |
|-------|--------|
| **Framework** | Next.js 16.1.3 (App Router) |
| **Frontend** | React 19.0.0 + TailwindCSS |
| **Database** | MongoDB dengan Mongoose |
| **Auth** | NextAuth.js + JWT |
| **Real-time** | Socket.IO |
| **Visualisasi** | Chart.js, Recharts |

---

## 🗂️ Struktur Folder Utama

```
nextjs_sias-main/
├── 📁 public/              # Asset statis (gambar, manifest PWA)
├── 📁 src/                 # Source code utama
│   ├── 📁 app/             # Pages & API Routes (App Router)
│   ├── 📁 components/      # React components yang reusable
│   ├── 📁 lib/             # Utilities, models, services
│   ├── 📁 models/          # Model tambahan
│   ├── 📁 scripts/         # Script utilities
│   └── 📁 docs/            # Dokumentasi
├── 📄 next.config.js       # Konfigurasi Next.js
├── 📄 tailwind.config.cjs  # Konfigurasi TailwindCSS
└── 📄 package.json         # Dependencies & scripts
```

---

## 🔍 Detail Setiap Folder

### 1️⃣ `src/app/` - Pages & API Routes

Folder ini mengikuti **Next.js App Router** convention.

#### 📄 Core Files
| File | Fungsi |
|------|--------|
| `page.js` | Landing page utama (homepage) |
| `layout.js` | Root layout dengan metadata & providers |
| `globals.css` | Style global CSS |

#### 📂 Halaman Publik
| Folder | Fungsi | Lokasi |
|--------|--------|--------|
| `/login` | Halaman login | `src/app/login/page.js` |
| `/register` | Registrasi user baru | `src/app/register/page.js` |
| `/bulletin` | Pengumuman publik | `src/app/bulletin/` |
| `/search` | Pencarian global | `src/app/search/page.js` |

#### 📂 `/cpanel/` - Dashboard Utama (37+ Halaman)

> [!IMPORTANT]
> Ini adalah **inti sistem** dengan 37+ halaman terproteksi berdasarkan role.

| Kategori | Folder | Fungsi |
|----------|--------|--------|
| **Dashboard** | `/cpanel/dashboard` | Overview statistik per role |
| **Manajemen User** | `/cpanel/users`, `/cpanel/user-management` | CRUD pengguna (admin) |
| **Manajemen Kelas** | `/cpanel/classes`, `/cpanel/class-management` | Kelola kelas & siswa |
| **Mata Pelajaran** | `/cpanel/subjects`, `/cpanel/my-subjects` | Kelola mata pelajaran |
| **Kehadiran** | `/cpanel/attendance`, `/cpanel/attendance-sessions`, `/cpanel/attendance-reports` | Sistem absensi siswa |
| **Nilai** | `/cpanel/grades`, `/cpanel/rekap-nilai`, `/cpanel/report-card` | Input & rekap nilai |
| **Tugas** | `/cpanel/tasks`, `/cpanel/task-management`, `/cpanel/assignments` | Manajemen tugas |
| **Ujian** | `/cpanel/exams` | Jadwal & hasil ujian |
| **Orang Tua** | `/cpanel/children`, `/cpanel/orangtua-link`, `/cpanel/monitoring` | Fitur untuk orang tua |
| **Komunikasi** | `/cpanel/chat`, `/cpanel/notifications`, `/cpanel/bulletin` | Real-time chat & notifikasi |
| **Laporan** | `/cpanel/reports`, `/cpanel/analytics` | Laporan & analitik |
| **Pengaturan** | `/cpanel/settings`, `/cpanel/backup`, `/cpanel/audit-logs` | Konfigurasi sistem |

#### 📂 `/api/` - Backend REST API (28+ Endpoint)

> [!TIP]
> Semua API mengikuti pola **Route Handlers** Next.js di folder `route.js`.

| Kategori | Path API | Fungsi |
|----------|----------|--------|
| **Auth** | `/api/auth/[...nextauth]` | NextAuth.js authentication |
| **Users** | `/api/users/` | CRUD pengguna |
| **Classes** | `/api/kelas/` | CRUD kelas |
| **Subjects** | `/api/subjects/` | CRUD mata pelajaran |
| **Grades** | `/api/grades/` | Input & rekap nilai |
| **Attendance** | `/api/kehadiran/` | Sistem absensi |
| **Notifications** | `/api/notifications/` | Sistem notifikasi |
| **Files** | `/api/files/` | Upload/download file |
| **Analytics** | `/api/analytics/` | Data analitik |
| **Audit** | `/api/audit-logs/` | Logging aktivitas |

---

### 2️⃣ `src/components/` - React Components (77 Files)

Berisi **komponen reusable** yang terorganisir berdasarkan fungsi.

#### 📂 `components/ui/` - Komponen UI Dasar (12 files)
| File | Fungsi |
|------|--------|
| `Button.js` | Tombol dengan variants |
| `Card.js` | Container card |
| `Modal.js` | Dialog modal |
| `Input.js` | Form input |
| `Table.js`, `DataTable.js` | Tabel data |
| `Badge.js` | Label/tag |
| `Skeleton.js` | Loading placeholder |
| `Grid.js` | Layout grid |
| `AdvancedForm.js` | Form builder |

#### 📂 `components/common/` - Komponen Umum (18 files)
| File | Fungsi |
|------|--------|
| `ProtectedRoute.js` | Route guard (auth) |
| `RoleBasedNav.js` | Navigasi berdasarkan role |
| `NotificationCenter.js` | Pusat notifikasi |
| `FileManager.js` | Manajemen file |
| `SearchBar.js` | Komponen pencarian |
| `StatCard.js` | Kartu statistik |
| `Toast.js` | Notifikasi toast |
| `ErrorBoundary.js` | Error handling |
| `AreaChart.js`, `BarChart.js`, `PieChart.js`, `LineChart.js` | Chart visualisasi |

#### 📂 `components/cpanel-components/` - Komponen CPanel
| File | Fungsi |
|------|--------|
| `Sidebar.js` | Navigasi sidebar (role-based) |
| `CpanelNavbar.js` | Navbar utama dengan notifikasi |
| `ActivityFeed.js` | Feed aktivitas real-time |
| `dashboard/` | Widget dashboard per role |

#### 📂 Komponen Fitur Lainnya
| Folder | Fungsi |
|--------|--------|
| `class-detail/` | Komponen detail kelas (12 files) |
| `grades/` | Komponen nilai (3 files) |
| `subjects/` | Komponen mata pelajaran (3 files) |
| `chat/` | Real-time chat |
| `files/` | File management |
| `analytics/` | Dashboard analytics |

---

### 3️⃣ `src/lib/` - Libraries & Utilities (61 Files)

> [!IMPORTANT]
> Ini adalah **otak** dari aplikasi - berisi logika bisnis utama.

#### 📂 `lib/models/` - Database Models (29 files)

**Schema MongoDB dengan Mongoose**:

| Model | Fungsi | File |
|-------|--------|------|
| `userModel.js` | User/akun | Menyimpan admin, guru, siswa, ortu |
| `Kelas.js` | Kelas | Data kelas |
| `MataPelajaran.js` | Mata pelajaran | Daftar mapel |
| `Kehadiran.js` | Absensi | Record kehadiran |
| `GradeRecord.js` | Nilai | Record nilai siswa |
| `GradeComponent.js` | Komponen nilai | Bobot nilai |
| `Tugas.js` | Tugas | Data tugas |
| `Submission.js` | Pengumpulan | Hasil tugas siswa |
| `Exam.js`, `ExamResult.js` | Ujian | Jadwal & hasil ujian |
| `Enrollment.js` | Enrollment | Pendaftaran siswa ke kelas |
| `Notification.js` | Notifikasi | Sistem notifikasi |
| `AuditLog.js` | Audit | Logging aktivitas |
| `File.js` | File | Metadata file upload |
| `DiscussionThread.js`, `DiscussionComment.js` | Diskusi | Forum diskusi |
| `Orangtua.js`, `ParentChildRequest.js` | Orang tua | Hubungan ortu-siswa |
| `Role.js`, `Permission.js` | RBAC | Role & permission |
| `AcademicYear.js` | Tahun ajaran | Manajemen tahun ajaran |
| `Setting.js` | Pengaturan | Konfigurasi sistem |
| `Buletin.js`, `Announcement.js` | Pengumuman | Berita/buletin |

#### 📂 `lib/auth/` - Authentication System
| File | Fungsi |
|------|--------|
| `middleware.js` | Auth middleware |
| `roles.js` | Role definitions (admin, guru, siswa, ortu) |
| `client.js` | Auth client utilities |

#### 📂 `lib/services/` - Business Logic Services
| File | Fungsi |
|------|--------|
| `analyticsService.js` | Logika analytics & statistik |
| `notificationService.js` | Logika pengiriman notifikasi |
| `gradeCalculator.js` | Kalkulasi nilai |
| `fileService.js` | Operasi file |
| `reminderService.js` | Sistem pengingat |

#### 📄 Core Utilities
| File | Fungsi |
|------|--------|
| `db.js`, `mongodb.js` | Koneksi database |
| `authMiddleware.js` | Middleware autentikasi |
| `auditLogger.js` | Logging audit trail |
| `pdfExporter.js` | Export PDF (rapor, rekap) |
| `fetchWithAuth.js` | HTTP client dengan auth |
| `roles.js` | Role & permission utilities |

---

### 4️⃣ `public/` - Static Assets

| Folder/File | Fungsi |
|-------------|--------|
| `assets/` | Gambar & ikon (11 files) |
| `uploads/` | File yang diupload user |
| `data/` | Data statis |
| `manifest.json` | PWA manifest |
| `sw.js` | Service Worker (offline) |
| `offline.html` | Halaman offline |

---

## 🎯 Quick Reference: "Di Mana Mencari?"

### Pertanyaan Umum Sidang

| Pertanyaan | Lokasi Jawaban |
|------------|----------------|
| **"Bagaimana proses login bekerja?"** | `src/app/api/auth/[...nextauth]/route.js` + `src/lib/auth/` |
| **"Di mana database schema?"** | `src/lib/models/*.js` (29 file Mongoose schema) |
| **"Bagaimana role-based access control?"** | `src/lib/roles.js` + `src/lib/auth/roles.js` + `src/components/common/ProtectedRoute.js` |
| **"Bagaimana sistem nilai bekerja?"** | `src/lib/services/gradeCalculator.js` + `src/app/api/grades/` |
| **"Di mana logic absensi?"** | `src/app/api/kehadiran/` + `src/app/cpanel/attendance*/` |
| **"Bagaimana notifikasi real-time?"** | `src/lib/services/notificationService.js` + Socket.IO di `server.cjs` |
| **"Export PDF raport?"** | `src/lib/pdfExporter.js` |
| **"Bagaimana file upload?"** | `src/lib/services/fileService.js` + `src/app/api/files/` |
| **"Di mana komponen UI?"** | `src/components/ui/` |
| **"Bagaimana dashboard berbeda per role?"** | `src/components/cpanel-components/dashboard/` |

---

## ❓ Antisipasi Pertanyaan Teknikal

### 🟢 Pertanyaan Umum (Basic)

#### Q1: "Jelaskan arsitektur aplikasi ini!"
**Jawaban**: 
- **Frontend**: React 19 dengan Next.js App Router
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MongoDB dengan Mongoose ODM
- **Auth**: NextAuth.js dengan JWT
- **Pattern**: Monolithic fullstack dengan separation of concerns

#### Q2: "Mengapa memilih Next.js?"
**Jawaban**:
- Server-side rendering untuk SEO & performa
- API routes terintegrasi (tidak perlu backend terpisah)
- Image optimization built-in
- App Router dengan React Server Components
- Mudah deploy ke Vercel

#### Q3: "Jelaskan flow autentikasi!"
**Jawaban**:
```
1. User input credentials → /login
2. POST ke /api/auth/[...nextauth] 
3. NextAuth verify dengan MongoDB
4. Generate JWT token + session
5. ProtectedRoute check session di setiap halaman
6. Role-based redirect ke dashboard sesuai role
```

#### Q4: "Bagaimana Anda menghandle role berbeda?"
**Jawaban**:
- 4 Role: `admin`, `guru`, `siswa`, `orangtua`
- Definisi di: `src/lib/roles.js`
- Middleware check di: `src/lib/authMiddleware.js`
- UI conditional di: `src/components/common/RoleBasedNav.js`
- Dashboard berbeda di: `src/components/cpanel-components/dashboard/`

---

### 🟡 Pertanyaan Menengah (Intermediate)

#### Q5: "Jelaskan relasi antar entitas/model!"
**Jawaban**:
```
User (siswa) ←── Enrollment ──→ Kelas
                                  │
                                  ├── MataPelajaran ──→ Tugas
                                  │                      │
                                  │                      └── Submission
                                  │
                                  ├── Kehadiran
                                  │
                                  └── GradeRecord ←── GradeComponent

User (orangtua) ←── ParentChildRequest ──→ User (siswa)

User (guru) ──→ MataPelajaran (mengajar)
         ──→ Kelas (wali kelas)
```

#### Q6: "Bagaimana sistem notifikasi bekerja?"
**Jawaban**:
- Model: `src/lib/models/Notification.js`
- Service: `src/lib/services/notificationService.js`
- Real-time: Socket.IO (`server.cjs` + `socket.io-client`)
- UI: `src/components/common/NotificationCenter.js`
- Role-based filtering di `CpanelNavbar.js`

#### Q7: "Jelaskan sistem kalkulasi nilai!"
**Jawaban**:
- Komponen nilai (bobot): `GradeComponent.js`
- Record nilai: `GradeRecord.js`
- Kalkulasi: `src/lib/services/gradeCalculator.js`
- API: `src/app/api/grades/`
- Rumus: Weighted average berdasarkan komponen (tugas, UTS, UAS, dll)

#### Q8: "Bagaimana sistem absensi?"
**Jawaban**:
- Session absensi: `AttendanceSession.js`
- Record kehadiran: `Kehadiran.js`
- Status: hadir, izin, sakit, alpha
- Bulk input oleh guru
- Rekap per kelas/siswa di `/cpanel/attendance-reports`

---

### 🔴 Pertanyaan Advanced (Expert)

#### Q9: "Bagaimana Anda handle race condition di database?"
**Jawaban**:
- Mongoose transactions untuk operasi kompleks
- Optimistic locking dengan version field
- Atomic operations (`$inc`, `$push`)
- Rate limiting di API dengan middleware

#### Q10: "Bagaimana security implementasinya?"
**Jawaban**:
- **Authentication**: NextAuth.js dengan bcrypt password hashing
- **Authorization**: Role-based middleware
- **JWT**: Signed tokens dengan secret
- **CSRF**: Built-in NextAuth protection
- **XSS**: React auto-escaping + sanitization
- **Audit Trail**: `AuditLog.js` mencatat semua aktivitas sensitif

#### Q11: "Bagaimana Anda handle file upload secara aman?"
**Jawaban**:
- Library: Formidable
- Validasi: File type, size limit
- Storage: `/public/uploads/` atau cloud storage
- Metadata: `File.js` model
- Access control: Check permission sebelum serve

#### Q12: "Jelaskan strategi caching!"
**Jawaban**:
- Next.js automatic page caching
- API response caching dengan revalidation
- Mongoose query caching
- Service Worker untuk offline (`sw.js`)

#### Q13: "Bagaimana scalability aplikasi ini?"
**Jawaban**:
- Serverless deployment (Vercel)
- MongoDB Atlas untuk managed database
- Stateless API design
- Socket.IO dengan Redis adapter (jika scaling horizontal)
- CDN untuk static assets

---

### 🟣 Pertanyaan Nyeleneh/Unexpected

#### Q14: "Apa kekurangan sistem ini?"
**Jawaban** (jujur & solutif):
- Testing coverage masih minimal (proposal: tambah Jest unit tests)
- Tidak ada pagination besar di beberapa list (proposal: infinite scroll)
- Real-time hanya notifikasi (proposal: extend ke grade updates)

#### Q15: "Kalau ada 10.000 siswa, apa yang harus diubah?"
**Jawaban**:
- Database indexing optimization
- Pagination & virtual scrolling
- API response pagination
- Redis caching layer
- MongoDB sharding atau Atlas clustering

#### Q16: "Mengapa tidak pakai TypeScript?"
**Jawaban**:
- Trade-off development speed vs type safety
- JSDoc dapat digunakan untuk autocomplete
- Proposal: Migrasi bertahap ke TypeScript

---

## 🛠️ Perintah Pengembangan

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint

# Testing
npm run test         # Run Jest tests
```

---

## 📊 Statistik Proyek

| Metrik | Jumlah |
|--------|--------|
| **Total Files di src/** | ~280 files |
| **API Endpoints** | 28+ routes |
| **CPanel Pages** | 37+ pages |
| **Database Models** | 29 schemas |
| **UI Components** | 12+ reusable |
| **Common Components** | 18 files |
| **Services** | 5 business logic |

---

## 🎓 Tips Sidang

1. **Buka IDE** sebelum sidang dimulai untuk demo cepat
2. **Bookmark** file-file penting yang sering ditanya
3. **Siapkan MongoDB Compass** untuk menunjukkan struktur data
4. **Demo flow utama**: Login → Dashboard → Input Nilai → Lihat Rapor
5. **Jangan panik** jika ditanya kode yang tidak ingat - buka langsung filenya!

---

> **Dokumen ini dibuat**: 20 Januari 2026
