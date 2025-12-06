# Skema Assignment Guru ke Kelas untuk Mata Pelajaran

## Overview

Skema ini memungkinkan admin untuk mengassign guru spesifik ke kelas spesifik untuk mata pelajaran tertentu. Contoh:
- Mapel IPA di kelas 12A diajar oleh Guru A
- Mapel IPA di kelas 12B diajar oleh Guru B

## Struktur Collection MataPelajaran

```javascript
{
  _id: ObjectId,
  nama: String,
  kode: String,
  deskripsi: String,
  total_jam_per_minggu: Number,
  kelas_ids: [ObjectId],  // Array kelas yang mengikuti mapel ini
  guru_ids: [ObjectId],   // Array guru yang bisa mengajar mapel ini
  guru_kelas_assignments: [  // Array assignment spesifik
    {
      _id: ObjectId,
      guru_id: ObjectId,   // Guru yang di-assign
      kelas_id: ObjectId   // Kelas yang di-assign
    }
  ]
}
```

## Cara Kerja

### 1. Setup Awal
1. Admin membuat mata pelajaran (contoh: "IPA")
2. Admin menambahkan kelas ke mata pelajaran (contoh: "12A", "12B")
3. Admin menambahkan guru ke mata pelajaran (contoh: "Guru A", "Guru B")

### 2. Assignment Spesifik
Admin mengassign guru ke kelas spesifik:
- Guru A → Mapel IPA → Kelas 12A
- Guru B → Mapel IPA → Kelas 12B

### 3. Validasi Tugas
Ketika guru membuat tugas:
- Sistem mengecek apakah ada assignment spesifik
- Jika ada: Hanya guru yang di-assign ke kelas tersebut yang bisa membuat tugas
- Jika tidak ada: Fallback ke validasi lama (guru harus ada di `guru_ids`)

## API Endpoints

### GET `/api/subjects/[id]/assignments`
Mendapatkan semua assignment untuk mata pelajaran tertentu.

### POST `/api/subjects/[id]/assignments`
Menambahkan assignment baru.
```json
{
  "guru_id": "ObjectId",
  "kelas_id": "ObjectId"
}
```

### DELETE `/api/subjects/[id]/assignments?assignment_id=ObjectId`
Menghapus assignment.

## Validasi

1. **Guru harus terdaftar di mata pelajaran**
   - `guru_id` harus ada di `mapel.guru_ids`

2. **Kelas harus terdaftar di mata pelajaran**
   - `kelas_id` harus ada di `mapel.kelas_ids`

3. **Tidak boleh duplicate**
   - Kombinasi `guru_id` + `kelas_id` harus unik per mata pelajaran

## UI Flow

1. Di halaman `/cpanel/subjects`:
   - Admin melihat daftar mata pelajaran
   - Untuk setiap mata pelajaran yang sudah punya guru dan kelas, muncul tombol "Assign"
   - Klik tombol "Assign" → Modal terbuka

2. Di Modal Assign:
   - Tampilkan daftar assignment yang sudah ada
   - Form untuk menambah assignment baru (pilih guru + kelas)
   - Tombol hapus untuk setiap assignment

## Backward Compatibility

Jika tidak ada assignment spesifik (`guru_kelas_assignments` kosong), sistem akan menggunakan validasi lama:
- Guru harus ada di `guru_ids`
- Kelas harus ada di `kelas_ids`

Ini memastikan sistem tetap bekerja untuk mata pelajaran yang belum di-assign secara spesifik.


