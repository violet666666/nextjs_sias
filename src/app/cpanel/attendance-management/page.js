"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const STATUS_OPTIONS = ["Hadir", "Izin", "Sakit", "Alfa"];

export default function AttendanceManagementPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState({ kelas_id: "", siswa_id: "", tanggal: "", status: "Hadir" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      router.push("/cpanel/dashboard");
    }
  }, [router]);

  const fetchRecords = () => {
    setLoading(true);
    fetchWithAuth("/api/kehadiran") // Ganti dengan fetchWithAuth
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .finally(() => setLoading(false));
  };

  const fetchKelas = () => {
    fetchWithAuth("/api/kelas") // Ganti dengan fetchWithAuth
      .then((res) => res.json())
      .then((data) => setKelasList(data));
  };

  const fetchSiswa = () => {
    fetchWithAuth("/api/users?role=siswa") // Ganti dengan fetchWithAuth dan filter role
      .then((res) => res.json())
      .then((data) => setSiswaList(data.filter((u) => u.role === "siswa")));
  };

  useEffect(() => {
    fetchRecords();
    fetchKelas();
    fetchSiswa();
  }, []);

  const handleAdd = () => {
    setEditRecord(null);
    setForm({ kelas_id: "", siswa_id: "", tanggal: "", status: "Hadir" });
    setShowModal(true);
    setError("");
  };

  const handleEdit = (rec) => {
    setEditRecord(rec);
    setForm({
      kelas_id: rec.kelas_id?._id || rec.kelas_id,
      siswa_id: rec.siswa_id?._id || rec.siswa_id,
      tanggal: rec.tanggal ? new Date(rec.tanggal).toISOString().slice(0, 10) : "",
      status: rec.status,
    });
    setShowModal(true);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus data kehadiran ini?")) return;
    setSaving(true);
    setError("");
    const res = await fetchWithAuth(`/api/kehadiran/${id}`, { method: "DELETE" }); // Ganti
    if (res.ok) {
      fetchRecords();
    } else {
      const data = await res.json();
      setError(data.error || "Gagal menghapus data");
    }
    setSaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (!form.kelas_id || !form.siswa_id || !form.tanggal || !form.status) {
      setError("Semua field wajib diisi");
      setSaving(false);
      return;
    }
    let res;
    if (editRecord) {
      res = await fetchWithAuth(`/api/kehadiran/${editRecord._id}`, { // Ganti
        method: "PUT",
        body: JSON.stringify(form),
      });
    } else {
      res = await fetchWithAuth("/api/kehadiran", { // Ganti
        method: "POST",
        body: JSON.stringify(form),
      });
    }
    if (res.ok) {
      setShowModal(false);
      fetchRecords();
    } else {
      const data = await res.json();
      setError(data.error || "Gagal menyimpan data");
    }
    setSaving(false);
  };

  return (
    <div className="p-6 text-black">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kehadiran Management</h1>
        <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">+ Tambah Kehadiran</button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Kelas</th>
              <th className="py-2 px-4 border-b">Siswa</th>
              <th className="py-2 px-4 border-b">Tanggal</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec._id}>
                <td className="py-2 px-4 border-b">{rec.kelas_id?.nama_kelas || "-"}</td>
                <td className="py-2 px-4 border-b">{rec.siswa_id?.nama || "-"}</td>
                <td className="py-2 px-4 border-b">{rec.tanggal ? new Date(rec.tanggal).toLocaleDateString() : "-"}</td>
                <td className="py-2 px-4 border-b">{rec.status}</td>
                <td className="py-2 px-4 border-b">
                  <button onClick={() => handleEdit(rec)} className="text-blue-500 hover:underline mr-2">Edit</button>
                  <button onClick={() => handleDelete(rec._id)} className="text-red-500 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-lg font-bold mb-4">{editRecord ? "Edit Kehadiran" : "Tambah Kehadiran"}</h2>
            <select required className="w-full mb-2 p-2 border rounded" value={form.kelas_id} onChange={e => setForm(f => ({ ...f, kelas_id: e.target.value }))}>
              <option value="">Pilih Kelas</option>
              {kelasList.map((k) => (
                <option key={k._id} value={k._id}>{k.nama_kelas}</option>
              ))}
            </select>
            <select required className="w-full mb-2 p-2 border rounded" value={form.siswa_id} onChange={e => setForm(f => ({ ...f, siswa_id: e.target.value }))}>
              <option value="">Pilih Siswa</option>
              {siswaList.map((s) => (
                <option key={s._id} value={s._id}>{s.nama}</option>
              ))}
            </select>
            <input type="date" required className="w-full mb-2 p-2 border rounded" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} />
            <select required className="w-full mb-2 p-2 border rounded" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-200 rounded">Batal</button>
              <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 