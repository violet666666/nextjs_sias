"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function OrangtuaLinkPage() {
  const [orangtua, setOrangtua] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [selectedOrangtua, setSelectedOrangtua] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [nomorTelepon, setNomorTelepon] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      router.push("/cpanel/dashboard");
      return;
    }
    
    setLoading(true);
    Promise.all([
      fetchWithAuth("/api/users?role=orangtua"),
      fetchWithAuth("/api/users?role=siswa")
    ]).then(async ([resOrangtua, resSiswa]) => {
      if (!resOrangtua.ok || !resSiswa.ok) throw new Error("Gagal mengambil data user");
      const dataOrangtua = await resOrangtua.json();
      const dataSiswa = await resSiswa.json();
      setOrangtua(Array.isArray(dataOrangtua) ? dataOrangtua : []);
      setSiswa(Array.isArray(dataSiswa) ? dataSiswa : []);
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));

    // Fetch requests
    fetchWithAuth('/api/orangtua/request').then(res => {
      if (res && res.requests) setRequests(res.requests);
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
        setError("");
    const res = await fetchWithAuth("/api/orangtua", {
      method: "POST",
      body: JSON.stringify({
        user_id: selectedOrangtua,
        siswa_id: selectedSiswa,
        nomor_telepon: nomorTelepon,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Relasi berhasil ditambahkan!");
    } else {
      setError(data.error || "Gagal menambah relasi");
    }
  };

  const handleApprove = async (id) => {
    setReqLoading(true);
    await fetchWithAuth(`/api/orangtua/request/${id}/approve`, { method: 'PATCH' });
    // Refresh requests
    const res = await fetchWithAuth('/api/orangtua/request');
    if (res && res.requests) setRequests(res.requests);
    setReqLoading(false);
  };
  const handleReject = async (id) => {
    setReqLoading(true);
    await fetchWithAuth(`/api/orangtua/request/${id}/reject`, { method: 'PATCH' });
    // Refresh requests
    const res = await fetchWithAuth('/api/orangtua/request');
    if (res && res.requests) setRequests(res.requests);
    setReqLoading(false);
  };

  if (loading) return <div className="p-6 text-center">Loading data...</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow text-black">
      <h2 className="text-xl font-bold mb-4">Hubungkan Orangtua & Siswa</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500 p-2 bg-red-100 border border-red-400 rounded">{error}</div>}
        <div>
          <label className="block mb-1">Orang Tua</label>
          <select
            className="border rounded p-2 w-full"
            value={selectedOrangtua}
            onChange={e => setSelectedOrangtua(e.target.value)}
            required
          >
            <option value="">Pilih Orang Tua</option>
            {orangtua.map(o => (
              <option key={o._id} value={o._id}>{o.nama} ({o.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Siswa</label>
          <select
            className="border rounded p-2 w-full"
            value={selectedSiswa}
            onChange={e => setSelectedSiswa(e.target.value)}
            required
          >
            <option value="">Pilih Siswa</option>
            {siswa.map(s => (
              <option key={s._id} value={s._id}>{s.nama} ({s.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Nomor Telepon (opsional)</label>
          <input
            className="border rounded p-2 w-full"
            value={nomorTelepon}
            onChange={e => setNomorTelepon(e.target.value)}
            placeholder="08xxxxxxx"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Hubungkan</button>
      </form>
      {message && <div className="mt-4 text-center">{message}</div>}
      {/* Tabel request relasi */}
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Request Relasi Orangtua-Anak</h3>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Orang Tua</th>
              <th className="p-2 border">Siswa</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={4} className="text-center p-2">Belum ada request.</td></tr>
            ) : requests.map(req => (
              <tr key={req._id}>
                <td className="p-2 border">{req.orangtua_id?.nama} <br /> <span className="text-xs text-gray-500">{req.orangtua_id?.email}</span></td>
                <td className="p-2 border">{req.siswa_id?.nama} <br /> <span className="text-xs text-gray-500">{req.siswa_id?.nis}</span></td>
                <td className="p-2 border">{req.status}</td>
                <td className="p-2 border">
                  {req.status === 'pending' && (
                    <>
                      <button className="bg-green-600 text-white px-2 py-1 rounded mr-2" disabled={reqLoading} onClick={() => handleApprove(req._id)}>Approve</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" disabled={reqLoading} onClick={() => handleReject(req._id)}>Tolak</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 