"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SEMESTERS, EXAM_TYPES } from "@/lib/constants";
import DataTable from "@/components/ui/DataTable";

export default function ExamManagementPage() {
    const sessionObj = useSession();
    const session = sessionObj?.data;
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Get user role from localStorage as fallback (session may be slow to load)
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    // Data for Form
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        type: EXAM_TYPES.UH,
        subject_id: "",
        class_id: "",
        academic_year_id: "",
        semester: SEMESTERS.GANJIL,
        date: "",
        description: ""
    });

    useEffect(() => {
        fetchExams();
        fetchDropdowns();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await fetchWithAuth("/api/exams");
            if (res.ok) {
                const data = await res.json();
                setExams(data);
            }
        } catch (error) {
            console.error("Error fetching exams:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        // Parallel fetch for speed
        const [resYear] = await Promise.all([
            fetchWithAuth("/api/academic-years?status=Active"),
        ]);

        const resClasses = await fetchWithAuth("/api/kelas");
        if (resYear.ok) setAcademicYears(await resYear.json());
        if (resClasses.ok) setClasses(await resClasses.json());
    };

    // Dynamic fetch for custom dependency logic
    const handleClassChange = async (classId) => {
        setFormData(prev => ({ ...prev, class_id: classId, subject_id: "" }));
        // Fetch subjects for this class
        try {
            const res = await fetchWithAuth(`/api/subjects?kelas_id=${classId}`);
            if (res.ok) setSubjects(await res.json());
        } catch (e) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth("/api/exams", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Ujian berhasil dibuat");
                setShowModal(false);
                setFormData({ title: "", type: EXAM_TYPES.UH, subject_id: "", class_id: "", academic_year_id: "", semester: SEMESTERS.GANJIL, date: "", description: "" });
                fetchExams();
            } else {
                const data = await res.json();
                toast.error(data.error || "Gagal membuat ujian");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        }
    };

    // Table Config
    const columns = [
        {
            key: 'title',
            label: 'Judul',
            render: (val, item) => (
                <div>
                    <div className="font-medium">{val}</div>
                    <div className="text-xs text-gray-500">{item.academic_year_id?.name} ({item.semester})</div>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Tipe',
            render: (val) => (
                <span className={`px-2 py-1 text-xs rounded-full font-semibold
                    ${val === 'UH' ? 'bg-blue-100 text-blue-800' :
                        val === 'UTS' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                    {val}
                </span>
            )
        },
        {
            key: 'class_id',
            label: 'Kelas & Mapel',
            render: (val, item) => (
                <div>
                    <div>{val?.nama_kelas || '-'}</div>
                    <div className="text-xs opacity-75">{item.subject_id?.nama_mapel || '-'}</div>
                </div>
            )
        },
        {
            key: 'date',
            label: 'Tanggal',
            render: (val) => val ? new Date(val).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'
        }
    ];

    const actions = [
        {
            label: 'Input Nilai',
            icon: <span className="text-blue-500 font-medium text-sm">Input Nilai &rarr;</span>,
            onClick: (item) => window.location.href = `/cpanel/exams/${item._id}/grade`
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manajemen Ujian</h1>
                    <p className="text-gray-500 text-sm">Kelola Ulangan Harian, UTS, dan UAS</p>
                </div>

                {(session?.user?.role === 'guru' || session?.user?.role === 'admin' || currentUser?.role === 'guru' || currentUser?.role === 'admin') && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Ujian Baru
                    </button>
                )}
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <DataTable
                    data={exams}
                    columns={columns}
                    actions={actions}
                    searchable
                    pagination
                />
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    {/* Modal Content */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Buat Ujian Baru</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Judul Ujian</label>
                                <input required type="text" className="w-full rounded-lg border-gray-300 dark:bg-slate-700"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: UH 1 Aljabar" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tipe</label>
                                    <select className="w-full rounded-lg border-gray-300 dark:bg-slate-700"
                                        value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value={EXAM_TYPES.UH}>Ulangan Harian ({EXAM_TYPES.UH})</option>
                                        <option value={EXAM_TYPES.UTS}>{EXAM_TYPES.UTS}</option>
                                        <option value={EXAM_TYPES.UAS}>{EXAM_TYPES.UAS}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tanggal</label>
                                    <input required type="date" className="w-full rounded-lg border-gray-300 dark:bg-slate-700"
                                        value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tahun Ajaran</label>
                                    <select required className="w-full rounded-lg border-gray-300 dark:bg-slate-700"
                                        value={formData.academic_year_id} onChange={e => setFormData({ ...formData, academic_year_id: e.target.value })}>
                                        <option value="">Pilih Tahun</option>
                                        {academicYears.map(y => <option key={y._id} value={y._id}>{y.name} ({y.status})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Semester</label>
                                    <select className="w-full rounded-lg border-gray-300 dark:bg-slate-700"
                                        value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                        <option value={SEMESTERS.GANJIL}>{SEMESTERS.GANJIL}</option>
                                        <option value={SEMESTERS.GENAP}>{SEMESTERS.GENAP}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Kelas</label>
                                <select required className="w-full rounded-lg border-gray-300 dark:bg-slate-700"
                                    value={formData.class_id} onChange={e => handleClassChange(e.target.value)}>
                                    <option value="">Pilih Kelas</option>
                                    {classes.map(c => <option key={c._id} value={c._id}>{c.nama_kelas}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Mata Pelajaran</label>
                                <select required className="w-full rounded-lg border-gray-300 dark:bg-slate-700"
                                    value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}>
                                    <option value="">Pilih Mapel</option>
                                    {subjects.map(s => <option key={s._id} value={s._id}>{s.nama_mapel}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
