"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "react-hot-toast";

export default function AcademicSettingsPage() {
    const [weights, setWeights] = useState({
        tugas: 20,
        uh: 30,
        uts: 20,
        uas: 30
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetchWithAuth("/api/settings?key=grade_weights");
            if (res.ok) {
                const data = await res.json();
                if (data) setWeights(data);
            }
            // If not found, use defaults (state init)
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setWeights(prev => ({
            ...prev,
            [key]: parseInt(value) || 0
        }));
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    const handleSave = async () => {
        if (totalWeight !== 100) {
            toast.error(`Total bobot harus 100%. Saat ini: ${totalWeight}%`);
            return;
        }

        setSaving(true);
        try {
            const res = await fetchWithAuth("/api/settings", {
                method: "POST",
                body: JSON.stringify({
                    key: "grade_weights",
                    value: weights,
                    description: "Bobot penilaian akademik (Tugas, UH, UTS, UAS)"
                })
            });

            if (res.ok) {
                toast.success("Pengaturan berhasil disimpan");
            } else {
                toast.error("Gagal menyimpan pengaturan");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Pengaturan Akademik</h1>
            <p className="text-gray-500 mb-6">Konfigurasi bobot penilaian dan parameter akademik lainnya.</p>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Bobot Nilai (Persentase)</h2>

                <div className="grid gap-6">
                    {['tugas', 'uh', 'uts', 'uas'].map((key) => (
                        <div key={key} className="flex items-center gap-4">
                            <label className="w-32 font-medium capitalize dark:text-slate-300">
                                {key === 'uh' ? 'Ulangan Harian' : key.toUpperCase()}
                            </label>
                            <div className="flex-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={weights[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                />
                            </div>
                            <div className="w-20 relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={weights[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full pl-3 pr-8 py-1 rounded border border-gray-300 dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 ring-blue-500"
                                />
                                <span className="absolute right-3 top-1 text-gray-500">%</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <div className={`text-lg font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-500'}`}>
                            Total: {totalWeight}%
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-6 py-2 rounded-lg text-white font-medium transition-colors
                                ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                    {totalWeight !== 100 && (
                        <p className="text-sm text-red-500 mt-2">
                            Total bobot harus tepat 100% untuk dapat disimpan.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
