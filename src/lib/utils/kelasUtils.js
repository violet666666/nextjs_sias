/**
 * Utility functions for Kelas (Class) operations
 */

/**
 * Menghitung jumlah siswa dalam kelas
 * @param {Object} kelas - Object kelas yang memiliki siswa_ids
 * @returns {number} Jumlah siswa dalam kelas
 */
export function getJumlahSiswa(kelas) {
  if (!kelas) return 0;
  
  // Jika siswa_ids adalah array, return panjangnya
  if (Array.isArray(kelas.siswa_ids)) {
    return kelas.siswa_ids.length;
  }
  
  // Jika siswa_ids adalah array yang sudah di-populate dengan object
  if (kelas.siswa_ids && typeof kelas.siswa_ids === 'object') {
    // Cek apakah ini array of objects
    if (Array.isArray(kelas.siswa_ids)) {
      return kelas.siswa_ids.filter(s => s !== null && s !== undefined).length;
    }
  }
  
  return 0;
}

/**
 * Menghitung jumlah siswa dari ID array
 * @param {Array} siswaIds - Array of student IDs
 * @returns {number} Jumlah siswa
 */
export function countSiswaFromIds(siswaIds) {
  if (!Array.isArray(siswaIds)) return 0;
  return siswaIds.filter(id => id !== null && id !== undefined).length;
}

