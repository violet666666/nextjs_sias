"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth"; // Impor helper
import Toast from "@/components/common/Toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import SimpleBarChart from "@/components/common/BarChart";
import SimplePieChart from "@/components/common/PieChart";
import SimpleLineChart from "@/components/common/LineChart";
import SimpleAreaChart from "@/components/common/AreaChart";
import { saveAs } from "file-saver";
import { io } from "socket.io-client";
import jsPDF from "jspdf";
import Link from "next/link";
import Swal from 'sweetalert2';
import ClassDetailSiswa from '@/components/class-detail/ClassDetailSiswa';
import ClassDetailGuru from '@/components/class-detail/ClassDetailGuru';
import ClassDetailOrangtua from '@/components/class-detail/ClassDetailOrangtua';
import ClassDetailAdmin from '@/components/class-detail/ClassDetailAdmin';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [kelas, setKelas] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true); // Loading utama untuk detail kelas & siswa
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ judul: "", deskripsi: "", tanggal_deadline: "" });
  const [taskError, setTaskError] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [isGuru, setIsGuru] = useState(false);
  const [parents, setParents] = useState([]);
  const [activeTab, setActiveTab] = useState("detail"); // Default tab
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // State untuk manajemen siswa
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [allStudentsList, setAllStudentsList] = useState([]); // Semua siswa di sistem (untuk modal)
  const [selectedStudentIdForEnrollment, setSelectedStudentIdForEnrollment] = useState("");
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState("");

  // Tambahkan state untuk submissions dan upload
  const [submissions, setSubmissions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const [attendanceData, setAttendanceData] = useState([]); // Data kehadiran real
  const [nilaiData, setNilaiData] = useState([]); // Data nilai real
  const [progressData, setProgressData] = useState([]); // Data progress tugas per siswa
  const [bulanFilter, setBulanFilter] = useState("");
  const [siswaFilter, setSiswaFilter] = useState("");

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState("");

  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [selectedBulkStudentIds, setSelectedBulkStudentIds] = useState([]);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const [errorKomentar, setErrorKomentar] = useState("");

  const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    if (user && user.role === "guru") {
      setIsGuru(true);
    }
  }, []);

  // Fungsi untuk mengambil detail kelas (termasuk pengumuman)
  const fetchKelasDetails = async () => {
    try {
      const res = await fetchWithAuth(`/api/kelas/${id}`);
      if (!res.ok) throw new Error("Gagal mengambil detail kelas");
      const data = await res.json();
      setKelas(data);
      // Pengumuman sudah termasuk dalam data kelas, tidak perlu state terpisah
    } catch (error) {
      console.error(error);
      setKelas(null);
    }
  };

  // Fungsi untuk mengambil siswa yang terdaftar di kelas
  const fetchEnrolledStudents = async () => {
    try {
      const res = await fetchWithAuth(`/api/kelas/${id}/students`);
      if (!res.ok) throw new Error("Gagal mengambil data siswa");
      const studentsData = await res.json();
      setStudents(studentsData);
    } catch (error) {
      console.error(error);
      setStudents([]);
    }
  };

  // Fungsi untuk mengambil semua siswa (untuk modal tambah siswa)
  const fetchAllStudentsForModal = async () => {
    try {
      const res = await fetchWithAuth("/api/users?role=siswa");
      if (!res.ok) throw new Error("Gagal mengambil daftar semua siswa");
      const allSiswa = await res.json();
      const enrolledIds = students.map(s => s._id);
      setAllStudentsList(allSiswa.filter(s => !enrolledIds.includes(s._id)));
    } catch (error) {
      console.error(error);
      setAllStudentsList([]);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await fetchKelasDetails();
      await fetchEnrolledStudents();
      setLoading(false);
    }
    if (id) fetchData();
  }, [id]);

  const fetchTasks = async () => {
    setTaskLoading(true);
    try {
      const res = await fetchWithAuth(`/api/tugas?kelas_id=${id}`);
      if (!res.ok) throw new Error("Gagal mengambil data tugas");
      const data = await res.json();
      setTasks(data.filter(t => (t.kelas_id?._id || t.kelas_id) === id));
    } catch (error) {
      console.error(error);
      setTasks([]);
    } finally {
      setTaskLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTasks();
  }, [id]);

  const fetchParentsData = async () => {
    if (students.length > 0) {
      try {
        const studentIdsInClass = students.map(s => s._id);
        let apiUrl = "/api/orangtua";
        // Jika yang login adalah guru, kirimkan ID siswa di kelasnya untuk filter
        if (currentUser && currentUser.role === 'guru') {
          apiUrl = `/api/orangtua?siswa_ids=${JSON.stringify(studentIdsInClass)}`;
        }
        const resParents = await fetchWithAuth(apiUrl);
        if (!resParents.ok) throw new Error("Gagal mengambil data orang tua");
        const allParentsData = await resParents.json();
        // Filter di frontend mungkin tidak diperlukan lagi jika API sudah memfilter dengan benar
        setParents(Array.isArray(allParentsData) ? allParentsData.filter(p => studentIdsInClass.includes(p.siswa_id?._id)) : []);
      } catch (error) {
        console.error("Error fetching parents data:", error);
        setParents([]); // Set ke array kosong jika ada error
      }
    }
  };

  useEffect(() => {
    if (students.length > 0) {
      fetchParentsData();
    }
  }, [students]);

  const handleAddTask = () => {
    setEditTask(null);
    setTaskForm({ judul: "", deskripsi: "", tanggal_deadline: "" });
    setShowTaskModal(true);
    setTaskError("");
  };
  const handleEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      judul: task.judul,
      deskripsi: task.deskripsi,
      tanggal_deadline: task.tanggal_deadline ? new Date(task.tanggal_deadline).toISOString().slice(0, 16) : "",
    });
    setShowTaskModal(true);
    setTaskError("");
  };
  const handleDeleteTask = async (taskId) => {
    if (!confirm("Yakin hapus tugas ini?")) return;
    setTaskSaving(true);
    setTaskError("");
    const res = await fetch(`/api/tugas/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      if (id) fetchTasks();
      setToast({ message: 'Tugas berhasil dihapus', type: 'success' });
    } else {
      const data = await res.json();
      setTaskError(data.error || "Gagal menghapus tugas");
      setToast({ message: data.error || 'Gagal menghapus tugas', type: 'error' });
    }
    setTaskSaving(false);
  };
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskSaving(true);
    setTaskError("");
    if (!taskForm.judul || !taskForm.tanggal_deadline) {
      setTaskError("Judul dan deadline wajib diisi");
      setTaskSaving(false);
      return;
    }
    let res;
    const payload = { ...taskForm, kelas_id: id };
    if (editTask) {
      res = await fetchWithAuth(`/api/tugas/${editTask._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetchWithAuth("/api/tugas", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    if (res.ok) {
      setShowTaskModal(false);
      if (id) fetchTasks();
      setToast({ message: 'Tugas berhasil disimpan', type: 'success' });
    } else {
      const data = await res.json();
      setTaskError(data.error || "Gagal menyimpan tugas");
      setToast({ message: data.error || 'Gagal menyimpan tugas', type: 'error' });
    }
    setTaskSaving(false);
  };

  const handleAddStudentClick = () => {
    setSelectedStudentIdForEnrollment("");
    setEnrollmentError("");
    fetchAllStudentsForModal();
    setShowAddStudentModal(true);
  };

  const handleEnrollStudentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentIdForEnrollment) {
      setEnrollmentError("Pilih siswa terlebih dahulu.");
      return;
    }
    setIsSubmittingEnrollment(true);
    setEnrollmentError("");
    try {
      const res = await fetchWithAuth(`/api/kelas/${id}/students`, {
        method: "POST",
        body: JSON.stringify({ siswa_id: selectedStudentIdForEnrollment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambahkan siswa ke kelas");
      }
      setShowAddStudentModal(false);
      fetchEnrolledStudents(); // Refresh daftar siswa di kelas
      setToast({ message: 'Siswa berhasil ditambahkan ke kelas', type: 'success' });
    } catch (error) {
      setEnrollmentError(error.message);
      setToast({ message: error.message, type: 'error' });
    } finally {
      setIsSubmittingEnrollment(false);
    }
  };

  const handleRemoveStudent = async (siswaIdToRemove) => {
    const result = await Swal.fire({
      title: 'Hapus Siswa?',
      text: 'Apakah Anda yakin ingin mengeluarkan siswa ini dari kelas?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    setIsSubmittingEnrollment(true);
    try {
      const res = await fetchWithAuth(`/api/kelas/${id}/students?siswa_id=${siswaIdToRemove}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengeluarkan siswa");
      }
      fetchEnrolledStudents(); // Refresh daftar siswa
      setToast({ message: 'Siswa berhasil dikeluarkan dari kelas', type: 'success' });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setIsSubmittingEnrollment(false);
    }
  };

  // Fungsi fetch submissions untuk tugas di kelas ini
  const fetchSubmissions = async () => {
    try {
      const tugasIds = tasks.map(t => t._id).join(",");
      if (!tugasIds) return setSubmissions([]);
      const res = await fetchWithAuth(`/api/submissions?tugas_id=${tugasIds}`);
      if (!res.ok) throw new Error("Gagal mengambil data submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      setSubmissions([]);
    }
  };

  useEffect(() => {
    if (tasks.length > 0) fetchSubmissions();
    // eslint-disable-next-line
  }, [tasks]);

  // Fungsi handle upload file tugas oleh siswa
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };
  const handleUpload = async (tugasId) => {
    if (!selectedFile) {
      setUploadError("Pilih file terlebih dahulu.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      // Simulasi upload file, ganti dengan API upload file jika ada
      const file_path = `/uploads/${selectedFile.name}`; // Ganti dengan hasil upload sebenarnya
      const tanggal_kumpul = new Date().toISOString();
      const res = await fetchWithAuth("/api/submissions", {
        method: "POST",
        body: JSON.stringify({ tugas_id: tugasId, siswa_id: currentUser.id, tanggal_kumpul, file_path }),
      });
      if (!res.ok) throw new Error("Gagal upload tugas");
      setToast({ message: "Tugas berhasil diupload", type: "success" });
      fetchSubmissions();
      setSelectedFile(null);
    } catch (err) {
      setUploadError(err.message);
      setToast({ message: err.message, type: "error" });
    }
    setUploading(false);
  };

  // Fungsi handle penilaian guru
  const handleNilaiFeedback = async (submissionId, nilai, feedback) => {
    try {
      const res = await fetchWithAuth(`/api/submissions/${submissionId}`, {
        method: "PUT",
        body: JSON.stringify({ nilai, feedback }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan nilai/feedback");
      setToast({ message: "Nilai/feedback berhasil disimpan", type: "success" });
      fetchSubmissions();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  // Fetch kehadiran untuk chart
  const fetchAttendanceData = async () => {
    try {
      const res = await fetchWithAuth(`/api/kehadiran?kelas_id=${id}`);
      if (!res.ok) throw new Error("Gagal mengambil data kehadiran");
      const data = await res.json();
      setAttendanceData(Array.isArray(data) ? data : []);
    } catch (err) {
      setAttendanceData([]);
    }
  };
  // Fetch nilai/progress tugas
  const fetchNilaiData = async () => {
    try {
      const tugasIds = tasks.map(t => t._id).join(",");
      if (!tugasIds) return setNilaiData([]);
      const res = await fetchWithAuth(`/api/submissions?tugas_id=${tugasIds}`);
      if (!res.ok) throw new Error("Gagal mengambil data submissions");
      const data = await res.json();
      setNilaiData(Array.isArray(data) ? data : []);
    } catch (err) {
      setNilaiData([]);
    }
  };
  // Fetch progress tugas per siswa
  useEffect(() => {
    if (id) fetchAttendanceData();
  }, [id]);
  useEffect(() => {
    if (tasks.length > 0) fetchNilaiData();
  }, [tasks]);

  // Filter bulan dan siswa
  const bulanList = Array.from(new Set(attendanceData.map(k => (k.tanggal ? new Date(k.tanggal).toLocaleString('id-ID', { month: 'short', year: 'numeric' }) : "")))).filter(Boolean);
  const siswaList = students.map(s => ({ id: s._id, nama: s.nama }));

  // Data chart real: statistik kehadiran bulanan
  const kehadiranBulanan = bulanList.map(bulan => ({
    bulan,
    hadir: attendanceData.filter(k => new Date(k.tanggal).toLocaleString('id-ID', { month: 'short', year: 'numeric' }) === bulan && k.status === "Hadir").length
  }));
  // Data chart real: distribusi status kehadiran
  const statusList = ["Hadir", "Izin", "Sakit", "Alfa"];
  const statusKehadiran = statusList.map(status => ({
    status,
    count: attendanceData.filter(k => (!bulanFilter || new Date(k.tanggal).toLocaleString('id-ID', { month: 'short', year: 'numeric' }) === bulanFilter) && k.status === status).length
  }));
  // Data chart real: distribusi nilai
  const distribusiNilai = [
    { kategori: "A (90-100)", value: nilaiData.filter(n => n.nilai >= 90).length },
    { kategori: "B (80-89)", value: nilaiData.filter(n => n.nilai >= 80 && n.nilai < 90).length },
    { kategori: "C (70-79)", value: nilaiData.filter(n => n.nilai >= 70 && n.nilai < 80).length },
    { kategori: "D (<70)", value: nilaiData.filter(n => n.nilai < 70).length },
  ];
  // Data chart real: ranking siswa
  const rankingSiswa = students.map(s => {
    const nilaiSiswa = nilaiData.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
    const total = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
    const avg = nilaiSiswa.length ? Math.round(total / nilaiSiswa.length) : 0;
    return { nama: s.nama, nilai: avg };
  }).sort((a, b) => b.nilai - a.nilai);
  // Data chart real: progress tugas per siswa (line chart)
  const tugasKeys = tasks.map(t => t.judul);
  const progressLineData = students.map(s => {
    const obj = { nama: s.nama };
    tasks.forEach(t => {
      const sub = nilaiData.find(n => (n.siswa_id === s._id || n.siswa_id?._id === s._id) && (n.tugas_id === t._id || n.tugas_id?._id === t._id));
      obj[t.judul] = sub?.nilai || 0;
    });
    return obj;
  });
  // Data chart real: pengumpulan tugas
  const pengumpulanTugas = tasks.map(t => {
    const total = students.length;
    const submitted = nilaiData.filter(n => (n.tugas_id === t._id || n.tugas_id?._id === t._id) && n.file_path).length;
    return { tugas: t.judul, submitted, belum: total - submitted };
  });

  // Export data ke CSV
  const handleExport = () => {
    let csv = "Nama Siswa,Nilai Rata-rata,Status Kehadiran\n";
    students.forEach(s => {
      const nilaiSiswa = nilaiData.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
      const total = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
      const avg = nilaiSiswa.length ? Math.round(total / nilaiSiswa.length) : 0;
      const hadir = attendanceData.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === "Hadir").length;
      csv += `${s.nama},${avg},${hadir}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `data_kelas_${kelas.nama_kelas || kelas.namaKelas}.csv`);
  };

  // Real-time socket.io dengan JWT (untuk komentar saja, pengumuman diambil dari kelas)
  useEffect(() => {
    const socket = io("http://localhost:3001", {
      auth: { token: jwtToken },
      transports: ["websocket"]
    });
    socket.emit("join_class", { classId: id, token: jwtToken });
    socket.on("comment_update", (data) => setComments(data));
    socket.on("connect_error", (err) => {
      // Fallback ke fetch API jika socket gagal
      fetchWithAuth(`/api/kelas/${id}/comments`).then(r => r.json()).then(setComments);
    });
    return () => { socket.disconnect(); };
  }, [id, jwtToken]);

  // Fetch komentar (pengumuman sudah diambil dari kelas via useKelasDetail)
  useEffect(() => {
    const fetchComments = async () => {
      setErrorKomentar("");
      try {
        const res = await fetchWithAuth(`/api/kelas/${id}/comments`);
        if (!res.ok) throw new Error("Gagal mengambil komentar");
        setComments(await res.json());
      } catch (err) {
        setErrorKomentar(err.message);
        setComments([]);
      }
    };
    
    if (id && jwtToken) {
      fetchComments();
    }
  }, [id, jwtToken]);

  // Fungsi kirim pengumuman langsung ke kelas
  const handleSendAnnouncement = async () => {
    if (!newAnnouncement || !newAnnouncement.trim()) return;
    try {
      const res = await fetchWithAuth(`/api/kelas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add-announcement',
          deskripsi: newAnnouncement.trim()
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setToast({ message: data.error || 'Gagal menambah pengumuman', type: 'error' });
      } else {
    setNewAnnouncement("");
        fetchKelasDetails(); // Refresh kelas untuk mendapatkan pengumuman terbaru
        setToast({ message: 'Pengumuman berhasil ditambahkan', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan saat menambah pengumuman', type: 'error' });
    }
  };
  const handleSendComment = () => {
    if (!newComment.trim()) return;
    const socket = io("http://localhost:3001", { auth: { token: jwtToken } });
    socket.emit("new_comment", { classId: id, text: newComment });
    setNewComment("");
    socket.disconnect();
  };

  // Export PDF tabel nilai dan grafik kehadiran
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Data Kelas: ${kelas ? (kelas.nama_kelas || kelas.namaKelas) : <span className="animate-pulse text-gray-400">Memuat nama kelas...</span>}`, 10, 10);
    let y = 20;
    doc.setFontSize(12);
    doc.text('Tabel Nilai Siswa:', 10, y);
    y += 8;
    // Header tabel
    doc.text('No', 10, y);
    doc.text('Nama', 20, y);
    doc.text('Nilai', 80, y);
    doc.text('Hadir', 110, y);
    y += 6;
    students.forEach((s, i) => {
      const nilaiSiswa = nilaiData.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
      const total = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
      const avg = nilaiSiswa.length ? Math.round(total / nilaiSiswa.length) : 0;
      const hadir = attendanceData.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === "Hadir").length;
      doc.text(`${i+1}`, 10, y);
      doc.text(s.nama, 20, y);
      doc.text(`${avg}`, 80, y);
      doc.text(`${hadir}`, 110, y);
      y += 6;
    });
    y += 8;
    // Contoh grafik kehadiran (bar chart sederhana)
    doc.text('Grafik Kehadiran:', 10, y);
    y += 6;
    const maxHadir = Math.max(...students.map(s => attendanceData.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === "Hadir").length), 1);
    students.forEach((s, i) => {
      const hadir = attendanceData.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === "Hadir").length;
      const barWidth = (hadir / maxHadir) * 60;
      doc.setFillColor(33, 150, 243);
      doc.rect(20, y + i * 6, barWidth, 5, 'F');
      doc.text(s.nama, 10, y + i * 6 + 4);
      doc.text(`${hadir}`, 85, y + i * 6 + 4);
    });
    doc.save(`data_kelas_${kelas.nama_kelas || kelas.namaKelas}.pdf`);
  };

  // Filter lanjutan
  const [tugasFilter, setTugasFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const tugasOptions = tasks.map(t => ({ id: t._id, judul: t.judul }));
  const statusOptions = ["Hadir", "Izin", "Sakit", "Alfa"];

  const handleBulkAddClick = () => {
    setSelectedBulkStudentIds([]);
    setBulkError("");
    fetchAllStudentsForModal();
    setShowBulkAddModal(true);
  };

  const handleBulkStudentChange = (id) => {
    setSelectedBulkStudentIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const handleBulkEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBulkStudentIds.length) {
      setBulkError("Pilih minimal satu siswa.");
      return;
    }
    setBulkAdding(true);
    setBulkError("");
    try {
      const res = await fetchWithAuth(`/api/kelas/${id}/students`, {
        method: "POST",
        body: JSON.stringify({ siswa_id: selectedBulkStudentIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambahkan siswa ke kelas");
      }
      setShowBulkAddModal(false);
      fetchEnrolledStudents();
      setToast({ message: 'Siswa berhasil ditambahkan ke kelas', type: 'success' });
    } catch (error) {
      setBulkError(error.message);
      setToast({ message: error.message, type: 'error' });
    } finally {
      setBulkAdding(false);
    }
  };

  // 1. Definisikan tab utama
  const MAIN_TABS = [
    { key: 'detail', label: 'Detail' },
    { key: 'siswa', label: 'Siswa' },
    { key: 'orangtua', label: 'Orang Tua' },
    { key: 'tugas', label: 'Tugas' },
    { key: 'absensi', label: 'Absensi' },
    { key: 'diskusi', label: 'Diskusi' },
  ];

  // Dispatcher: render komponen sesuai role
  if (!currentUser) {
    return <div>Memuat data pengguna...</div>;
  }
  if (currentUser.role === 'siswa') {
    return <ClassDetailSiswa kelasId={id} />;
  }
  if (currentUser.role === 'guru') {
    return <ClassDetailGuru kelasId={id} />;
  }
  if (currentUser.role === 'orangtua') {
    return <ClassDetailOrangtua kelasId={id} />;
  }
  if (currentUser.role === 'admin') {
    return <ClassDetailAdmin kelasId={id} />;
  }
  if (currentUser.role === 'admin') {
    return <ClassDetailAdmin kelasId={id} />;
  }
  return <div>Role tidak dikenali.</div>;
}
