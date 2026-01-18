"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";

export default function GradeInputPage({ params }) {
    const sessionObj = useSession();
    const session = sessionObj?.data;
    const router = useRouter();
    const { examId } = params;

    const [exam, setExam] = useState(null);
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState({}); // Map student_id -> { score, feedback }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (examId) {
            fetchData();
        }
    }, [examId]);

    const fetchData = async () => {
        try {
            // 1. Fetch Exam Details
            // We need a specific endpoint or filter existing
            const resExam = await fetchWithAuth(`/api/exams?_id=${examId}`); // Assuming API supports filtering or we fetch all and find
            // Better: Create /api/exams/[id] but for speed we might have to improvise or assume the list endpoint handles query
            // Let's assume we need to implement GET /api/exams/[id] or filter client side if list is small. 
            // Actually, let's just fetch all exams and find one (not optimal but works for MVP) or assumes API supports query params

            let currentExam = null;
            if (resExam.ok) {
                const exams = await resExam.json();
                currentExam = exams.find(e => e._id === examId);
                setExam(currentExam);
            }

            if (currentExam) {
                // 2. Fetch Students in Class
                const resStudents = await fetchWithAuth(`/api/kelas/${currentExam.class_id._id}/students`);
                // Note: We need to ensure this endpoint exists. 
                // If not, we might need to fetch class details which has student_ids.
                // Let's check api/classes/[id] implementation.
                // Fallback: Fetch class details
                const resClass = await fetchWithAuth(`/api/kelas/${currentExam.class_id._id}`);
                if (resClass.ok) {
                    const classData = await resClass.json();
                    // Assuming classData.siswa_ids is populated
                    setStudents(classData.siswa_ids || []);
                }

                // 3. Fetch Existing Results
                const resResults = await fetchWithAuth(`/api/exams/results?exam_id=${examId}`);
                if (resResults.ok) {
                    const resultData = await resResults.json();
                    const resultMap = {};
                    resultData.forEach(r => {
                        resultMap[r.student_id._id || r.student_id] = { score: r.score, feedback: r.feedback };
                    });
                    setResults(resultMap);
                }
            }
        } catch (error) {
            console.error("Error loading data", error);
            toast.error("Gagal memuat data ujian");
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (studentId, score) => {
        setResults(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], score: parseInt(score) }
        }));
    };

    const handleFeedbackChange = (studentId, feedback) => {
        setResults(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], feedback }
        }));
    };

    const handleSave = async (studentId) => {
        const data = results[studentId];
        if (!data || data.score === undefined) return;

        // Optimistic UI or separate saving state per row?
        // For simplicity, global saving or silent
        try {
            const res = await fetchWithAuth("/api/exams/results", {
                method: "POST",
                body: JSON.stringify({
                    exam_id: examId,
                    student_id: studentId,
                    score: data.score,
                    feedback: data.feedback
                })
            });
            if (res.ok) {
                toast.success("Nilai tersimpan");
            } else {
                toast.error("Gagal menyimpan");
            }
        } catch (e) {
            toast.error("Error saving");
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        let successCount = 0;
        // Sequential or Parallel? Parallel is faster
        const promises = students.map(async (student) => {
            const data = results[student._id];
            if (data && data.score !== undefined) {
                const res = await fetchWithAuth("/api/exams/results", {
                    method: "POST",
                    body: JSON.stringify({
                        exam_id: examId,
                        student_id: student._id,
                        score: data.score,
                        feedback: data.feedback
                    })
                });
                if (res.ok) successCount++;
            }
        });

        await Promise.all(promises);
        setSaving(false);
        toast.success(`Berhasil menyimpan ${successCount} nilai siswa`);
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!exam) return <div className="p-6">Ujian tidak ditemukan</div>;

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <button onClick={() => router.back()} className="text-sm text-blue-600 mb-2 hover:underline">&larr; Kembali</button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{exam.title}</h1>
                    <p className="text-gray-500">Input Nilai - {exam.class_id?.nama_kelas} - {exam.subject_id?.nama_mapel}</p>
                </div>
                <div>
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                        {saving ? 'Menyimpan...' : 'Simpan Semua'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left">Nama Siswa</th>
                            <th className="px-6 py-3 text-left">NISN</th>
                            <th className="px-6 py-3 text-left w-32">Nilai (0-100)</th>
                            <th className="px-6 py-3 text-left">Feedback/Catatan</th>
                            <th className="px-6 py-3 text-left w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {students.map((student) => (
                            <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium">{student.nama}</td>
                                <td className="px-6 py-4 text-gray-500">{student.nisn || '-'}</td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-24 rounded-lg border-gray-300 dark:bg-slate-600 focus:ring-blue-500"
                                        value={results[student._id]?.score ?? ''}
                                        onChange={(e) => handleScoreChange(student._id, e.target.value)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-gray-300 dark:bg-slate-600 focus:ring-blue-500"
                                        placeholder="Catatan..."
                                        value={results[student._id]?.feedback || ''}
                                        onChange={(e) => handleFeedbackChange(student._id, e.target.value)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleSave(student._id)}
                                        className="text-blue-600 hover:text-blue-800 font-medium">
                                        Simpan
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
