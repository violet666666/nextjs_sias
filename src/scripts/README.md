# Migration Scripts

Script-script ini digunakan untuk migrasi data dari struktur lama ke struktur baru.

## Prerequisites

1. Pastikan `MONGODB_URI` sudah di-set di file `.env.local`
2. Pastikan database sudah terhubung dan dapat diakses
3. **PENTING**: Backup database sebelum menjalankan migration!

## Scripts

### 1. migrate-nis.js

Menambahkan NIS (Nomor Induk Siswa) ke semua siswa yang belum memiliki NIS.

**Cara menjalankan:**
```bash
node src/scripts/migrate-nis.js
```

**Apa yang dilakukan:**
- Mencari semua siswa (role: 'siswa') yang belum memiliki NIS
- Generate NIS unik untuk setiap siswa dengan format: `SISWA-YYYYMMDD-XXXX`
- Contoh: `SISWA-20240101-0001`, `SISWA-20240101-0002`, dst.

**Catatan:**
- NIS akan di-generate secara otomatis
- Format: `SISWA-{tanggal}-{counter}`
- NIS bersifat unique di database

### 2. migrate-orangtua-array.js

Migrasi data Orangtua dari struktur `siswa_id` (single) ke `siswa_ids` (array).

**Cara menjalankan:**
```bash
node src/scripts/migrate-orangtua-array.js
```

**Apa yang dilakukan:**
- Mengambil semua record Orangtua
- Mengelompokkan berdasarkan `user_id`
- Menggabungkan multiple record dengan `user_id` yang sama menjadi satu record
- Mengubah `siswa_id` menjadi `siswa_ids` (array)
- Menghapus record duplikat

**Catatan:**
- **PENTING**: Script ini akan menghapus semua record lama dan membuat record baru
- Pastikan backup database sebelum menjalankan!
- Satu `user_id` akan memiliki satu record dengan array `siswa_ids`

## Urutan Eksekusi

Jalankan script-script ini dalam urutan berikut:

1. **Pertama**: `migrate-nis.js` - Menambahkan NIS ke siswa
2. **Kedua**: `migrate-orangtua-array.js` - Migrasi struktur Orangtua

## Troubleshooting

### Error: "Cannot find module"
Pastikan Anda menjalankan script dari root directory project:
```bash
cd /path/to/sias_nextjs
node src/scripts/migrate-nis.js
```

### Error: "MongoServerError"
Pastikan:
- `MONGODB_URI` sudah benar di `.env.local`
- Database dapat diakses
- User database memiliki permission yang cukup

### Error: "Duplicate key error"
Jika terjadi error duplicate key untuk NIS:
- Script akan otomatis skip dan melanjutkan ke siswa berikutnya
- Periksa log untuk melihat siswa mana yang error

## Setelah Migration

Setelah migration selesai:
1. Verifikasi data di database
2. Test aplikasi untuk memastikan semua fitur berfungsi
3. Update dokumentasi jika diperlukan

## Rollback

Jika terjadi masalah setelah migration:
1. Restore database dari backup
2. Periksa log error
3. Perbaiki masalah
4. Jalankan migration lagi

