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
    fetchWithAuth('/api/orangtua/request')
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.requests) {
            setRequests(Array.isArray(data.requests) ? data.requests : []);
          }
        }
      })
      .catch(err => console.error('Error fetching requests:', err));
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
    setError('');
    setMessage('');
    try {
      const res = await fetchWithAuth(`/api/orangtua/request/${id}/approve`, { method: 'POST' });
      if (res && res.ok) {
        const data = await res.json();
        setMessage(data.message || 'Request berhasil disetujui!');
        // Refresh requests
        const reqRes = await fetchWithAuth('/api/orangtua/request');
        if (reqRes && reqRes.ok) {
          const reqData = await reqRes.json();
          if (reqData && reqData.success && reqData.requests) {
            setRequests(Array.isArray(reqData.requests) ? reqData.requests : []);
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData?.error || 'Gagal menyetujui request.');
      }
    } catch (e) {
      console.error('Error approving request:', e);
      setError('Gagal menyetujui request.');
    } finally {
      setReqLoading(false);
    }
  };

  const handleReject = async (id) => {
    setReqLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetchWithAuth(`/api/orangtua/request/${id}/reject`, { method: 'PATCH' });
      if (res && res.ok) {
        setMessage('Request berhasil ditolak.');
        // Refresh requests
        const reqRes = await fetchWithAuth('/api/orangtua/request');
        if (reqRes && reqRes.ok) {
          const reqData = await reqRes.json();
          if (reqData && reqData.success && reqData.requests) {
            setRequests(Array.isArray(reqData.requests) ? reqData.requests : []);
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData?.error || 'Gagal menolak request.');
      }
    } catch (e) {
      console.error('Error rejecting request:', e);
      setError('Gagal menolak request.');
    } finally {
      setReqLoading(false);
    }
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
      {message && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded">
          {message}
        </div>
      )}
      {/* Tabel request relasi */}
      <div className="mt-8">
        <h3 className="font-semibold mb-4 text-lg">Request Relasi Orangtua-Anak</h3>
        {requests.length === 0 ? (
          <div className="text-center p-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded">
            Belum ada request.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-3 border text-left">Orang Tua</th>
                  <th className="p-3 border text-left">Siswa</th>
                  <th className="p-3 border text-left">NIS</th>
                  <th className="p-3 border text-left">Status</th>
                  <th className="p-3 border text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3 border">
                      <div className="font-medium">{req.orangtua_id?.nama || '-'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{req.orangtua_id?.email || '-'}</div>
                    </td>
                    <td className="p-3 border">
                      <div className="font-medium">{req.siswa_id?.nama || '-'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{req.siswa_id?.email || '-'}</div>
                    </td>
                    <td className="p-3 border">
                      <span className="font-mono text-sm">{req.siswa_id?.nis || '-'}</span>
                    </td>
                    <td className="p-3 border">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        req.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        req.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {req.status === 'pending' ? 'Menunggu' : req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="p-3 border">
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                            disabled={reqLoading} 
                            onClick={() => handleApprove(req._id)}
                          >
                            {reqLoading ? 'Memproses...' : 'Setujui'}
                          </button>
                          <button 
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                            disabled={reqLoading} 
                            onClick={() => handleReject(req._id)}
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                      {req.status === 'approved' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Sudah diproses</span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Ditolak</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 