# Script Membuat 20 Siswa

Script ini digunakan untuk membuat 20 siswa dummy dengan data berikut:
- Nama: Siswa 1 sampai Siswa 20
- Email: siswa1@example.com sampai siswa20@example.com
- NIS: 2024001 sampai 2024020 (format: tahun + nomor urut 3 digit)
- Password default: `siswa123`
- Role: `siswa`

## Cara Menjalankan

### 1. Pastikan Environment Variables Sudah Diatur
Pastikan file `.env.local` ada di root project dan berisi:
```
MONGODB_URI=mongodb://localhost:27017/nama-database
```
atau
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### 2. Jalankan Script

**Menggunakan npm:**
```bash
npm run create-students
```

**Atau langsung dengan node:**
```bash
node scripts/create-students.js
```

## Output

Script akan menampilkan:
- Status koneksi database
- Progress pembuatan setiap siswa
- Ringkasan siswa yang berhasil dibuat
- Informasi login (email dan password)

## Catatan

- Script akan melewati siswa yang sudah ada (berdasarkan email atau NIS)
- Password default untuk semua siswa adalah `siswa123`
- NIS di-generate otomatis dengan format: `{tahun}{nomor urut 3 digit}`
- Email menggunakan format: `siswa{nomor}@example.com`

## Contoh Output

```
✅ Terhubung ke MongoDB

📝 Membuat 20 siswa...

✅ Siswa 1 berhasil dibuat:
   Nama: Siswa 1
   Email: siswa1@example.com
   NIS: 2024001
   Password: siswa123

✅ Siswa 2 berhasil dibuat:
   Nama: Siswa 2
   Email: siswa2@example.com
   NIS: 2024002
   Password: siswa123

...

✨ Selesai! Total 20 siswa berhasil dibuat.

📋 Ringkasan:
   - Total siswa dibuat: 20
   - Password default: siswa123
   - Format email: siswa1@example.com - siswa20@example.com
   - Format NIS: 2024001 - 2024020

🔌 Koneksi database ditutup
```

## Troubleshooting

### Error: MONGODB_URI tidak ditemukan
- Pastikan file `.env.local` ada di root project
- Pastikan variabel `MONGODB_URI` sudah diisi dengan benar

### Error: Email sudah terdaftar
- Script akan otomatis melewati siswa yang sudah ada
- Tidak akan membuat duplikat

### Error: NIS sudah terdaftar
- Script akan otomatis melewati siswa yang sudah ada
- Tidak akan membuat duplikat


