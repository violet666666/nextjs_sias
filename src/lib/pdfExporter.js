import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

/**
 * PDF Export Utility for Student Academic Information System
 * Uses jspdf-autotable with correct ESM import syntax: autoTable(doc, options)
 */

// Helper function to format date
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to format time
const formatTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Export attendance report to PDF
 */
export const exportAttendancePDF = async (attendanceData, className, sessionDate) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('LAPORAN KEHADIRAN SISWA', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Kelas: ${className}`, 20, 35);
  doc.text(`Tanggal: ${formatDate(sessionDate)}`, 20, 45);
  doc.text(`Total Siswa: ${attendanceData.length}`, 20, 55);

  // Table data
  const tableData = attendanceData.map((attendance, index) => [
    index + 1,
    attendance.siswa?.nama || attendance.siswa_id || 'N/A',
    attendance.status,
    formatTime(attendance.timestamp),
    attendance.keterangan || '-'
  ]);

  // Create table using correct autoTable syntax
  autoTable(doc, {
    startY: 70,
    head: [['No', 'Nama Siswa', 'Status', 'Waktu', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10
    },
    styles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 40 }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  return doc;
};

/**
 * Export grades report to PDF
 */
export const exportGradesPDF = async (gradesData, className, taskTitle) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('LAPORAN NILAI TUGAS', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Kelas: ${className}`, 20, 35);
  doc.text(`Tugas: ${taskTitle}`, 20, 45);
  doc.text(`Total Siswa: ${gradesData.length}`, 20, 55);

  // Calculate statistics
  const submittedCount = gradesData.filter(g => g.nilai !== null && g.nilai !== undefined).length;
  const averageScore = submittedCount > 0 ? gradesData.reduce((sum, g) => sum + (g.nilai || 0), 0) / submittedCount : 0;

  doc.text(`Tugas Dikumpulkan: ${submittedCount}`, 20, 65);
  doc.text(`Rata-rata Nilai: ${averageScore.toFixed(2)}`, 20, 75);

  // Table data
  const tableData = gradesData.map((grade, index) => [
    index + 1,
    grade.siswa?.nama || grade.siswa_id || 'N/A',
    grade.nilai !== null && grade.nilai !== undefined ? grade.nilai : 'Belum dinilai',
    grade.feedback || '-',
    formatDate(grade.submitted_at)
  ]);

  // Create table using correct autoTable syntax
  autoTable(doc, {
    startY: 90,
    head: [['No', 'Nama Siswa', 'Nilai', 'Feedback', 'Tanggal Submit']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [46, 204, 113],
      textColor: 255,
      fontSize: 10
    },
    styles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 40 },
      4: { cellWidth: 35 }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  return doc;
};

/**
 * Export student list to PDF
 */
export const exportStudentListPDF = async (students, className) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('DAFTAR SISWA', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Kelas: ${className}`, 20, 35);
  doc.text(`Total Siswa: ${students.length}`, 20, 45);
  doc.text(`Tanggal Export: ${formatDate(new Date())}`, 20, 55);

  // Table data
  const tableData = students.map((student, index) => [
    index + 1,
    student.nisn || '-',
    student.nama,
    student.email,
    student.nomor_telepon || '-',
    formatDate(student.tanggal_lahir)
  ]);

  // Create table using correct autoTable syntax
  autoTable(doc, {
    startY: 70,
    head: [['No', 'NISN', 'Nama', 'Email', 'Telepon', 'Tanggal Lahir']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [155, 89, 182],
      textColor: 255,
      fontSize: 10
    },
    styles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  return doc;
};

/**
 * Export class schedule to PDF
 */
export const exportClassSchedulePDF = async (classes) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('JADWAL KELAS', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Total Kelas: ${classes.length}`, 20, 35);
  doc.text(`Tanggal Export: ${formatDate(new Date())}`, 20, 45);

  // Table data
  const tableData = classes.map((kelas, index) => [
    index + 1,
    kelas.nama_kelas,
    kelas.guru?.nama || kelas.guru_id || 'N/A',
    kelas.tahun_ajaran,
    kelas.status_kelas,
    formatDate(kelas.createdAt)
  ]);

  // Create table using correct autoTable syntax
  autoTable(doc, {
    startY: 60,
    head: [['No', 'Nama Kelas', 'Guru', 'Tahun Ajaran', 'Status', 'Tanggal Dibuat']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [230, 126, 34],
      textColor: 255,
      fontSize: 10
    },
    styles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  return doc;
};

/**
 * Export dashboard summary to PDF
 */
export const exportDashboardSummaryPDF = async (summaryData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('RINGKASAN DASHBOARD', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Tanggal Export: ${formatDate(new Date())}`, 20, 35);

  // Summary statistics
  let yPosition = 50;
  doc.setFontSize(14);
  doc.text('Statistik Sistem:', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.text(`Total Siswa: ${summaryData.totalSiswa || 0}`, 30, yPosition);
  yPosition += 10;
  doc.text(`Total Guru: ${summaryData.totalGuru || 0}`, 30, yPosition);
  yPosition += 10;
  doc.text(`Total Kelas: ${summaryData.totalKelas || 0}`, 30, yPosition);
  yPosition += 10;
  doc.text(`Total Tugas: ${summaryData.totalTugas || 0}`, 30, yPosition);
  yPosition += 10;
  doc.text(`Total Orangtua: ${summaryData.totalOrangtua || 0}`, 30, yPosition);

  // Recent activities
  yPosition += 20;
  doc.setFontSize(14);
  doc.text('Aktivitas Terbaru:', 20, yPosition);
  yPosition += 15;

  if (summaryData.recentActivities && summaryData.recentActivities.length > 0) {
    const activityData = summaryData.recentActivities.slice(0, 10).map((activity, index) => [
      index + 1,
      activity.action,
      activity.user?.nama || 'N/A',
      formatDate(activity.timestamp)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['No', 'Aktivitas', 'User', 'Tanggal']],
      body: activityData,
      theme: 'grid',
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 10
      },
      styles: {
        fontSize: 9
      }
    });
  } else {
    doc.setFontSize(12);
    doc.text('Tidak ada aktivitas terbaru', 30, yPosition);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  return doc;
};

/**
 * Generic function to save PDF
 */
export const savePDF = (doc, filename) => {
  doc.save(filename);
};

/**
 * Generic function to download PDF as blob
 */
export const downloadPDF = (doc, filename) => {
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};