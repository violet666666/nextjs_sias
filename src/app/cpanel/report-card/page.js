"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useSession } from "next-auth/react";
import { SEMESTERS } from "@/lib/constants";

export default function ReportCardPage() {
    const sessionObj = useSession();
    const session = sessionObj?.data;
    const [grades, setGrades] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSemester, setSelectedSemester] = useState(SEMESTERS.GANJIL);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDropdowns();
    }, []);

    useEffect(() => {
        if (selectedYear && selectedSemester) {
            fetchGrades();
        }
    }, [selectedYear, selectedSemester]);

    const fetchDropdowns = async () => {
        try {
            const res = await fetchWithAuth("/api/academic-years?status=Active");
            if (res.ok) {
                const data = await res.json();
                setAcademicYears(data);
                // Default to active one
                const active = data.find(y => y.isCurrent);
                if (active) {
                    setSelectedYear(active._id);
                    setSelectedSemester(active.semester);
                } else if (data.length > 0) {
                    setSelectedYear(data[0]._id);
                    setSelectedSemester(data[0].semester);
                }
            }
        } catch (error) {
            console.error("Error fetching defaults", error);
        }
    };

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const studentId = session?.user?.id;
            const res = await fetchWithAuth(`/api/reports/student?academic_year_id=${selectedYear}&semester=${selectedSemester}`);
            if (res.ok) {
                const data = await res.json();
                // Check if data is array (old format) or object (new format)
                if (Array.isArray(data)) {
                    setGrades({ grades: data, attendance: { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 } });
                } else {
                    setGrades(data);
                }
            }
        } catch (error) {
            console.error("Error fetching grades", error);
        } finally {
            setLoading(false);
        }
    };

    const gradesList = grades.grades || [];
    const attendance = grades.attendance || { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hasil Studi (Rapor)</h1>
                    <p className="text-gray-500">Lihat pencapaian akademikmu</p>
                </div>

                <div className="flex gap-2">
                    <select
                        className="rounded-lg border-gray-300 dark:bg-slate-700"
                        value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                        <option value="">Pilih Tahun</option>
                        {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
                    </select>
                    <select
                        className="rounded-lg border-gray-300 dark:bg-slate-700"
                        value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                        <option value={SEMESTERS.GANJIL}>{SEMESTERS.GANJIL}</option>
                        <option value={SEMESTERS.GENAP}>{SEMESTERS.GENAP}</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 font-bold text-lg dark:text-white">
                    Nilai Akademik
                </div>
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading data rapor...</div>
                ) : gradesList.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Belum ada data nilai untuk semester ini.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500 dark:text-slate-400">Mata Pelajaran</th>
                                <th className="px-6 py-3 text-center uppercase text-xs font-bold text-gray-500 dark:text-slate-400">KKM</th>
                                <th className="px-6 py-3 text-center uppercase text-xs font-bold text-gray-500 dark:text-slate-400">Nilai Akhir</th>
                                <th className="px-6 py-3 text-center uppercase text-xs font-bold text-gray-500 dark:text-slate-400">Predikat</th>
                                <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500 dark:text-slate-400">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {gradesList.map((g) => (
                                <tr key={g._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {g.subject_id?.nama_mapel}
                                        <div className="text-xs text-gray-500">{g.subject_id?.kode_mapel}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">75</td>
                                    <td className="px-6 py-4 text-center text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {g.final_score}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold 
                             ${g.letter_grade === 'A' ? 'bg-green-100 text-green-800' :
                                                g.letter_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                                    g.letter_grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                            {g.letter_grade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-300">
                                        {g.description || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Attendance Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 font-bold text-lg dark:text-white">
                    Ketidakhadiran
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 max-w-lg">
                        <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg text-center">
                            <div className="text-sm text-gray-500 dark:text-slate-400">Sakit</div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{attendance.Sakit}</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-slate-700 p-4 rounded-lg text-center">
                            <div className="text-sm text-gray-500 dark:text-slate-400">Izin</div>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{attendance.Izin}</div>
                        </div>
                        <div className="bg-red-50 dark:bg-slate-700 p-4 rounded-lg text-center">
                            <div className="text-sm text-gray-500 dark:text-slate-400">Tanpa Keterangan</div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{attendance.Alfa}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
