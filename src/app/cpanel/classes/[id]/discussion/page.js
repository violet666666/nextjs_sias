"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function ClassDiscussionPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id;
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [saving, setSaving] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch user
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Fetch threads
  const fetchThreads = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/discussions?kelas_id=${kelasId}`);
      if (!res.ok) throw new Error(await res.text());
      setThreads(await res.json());
    } catch (e) {
      setError("Gagal memuat diskusi kelas.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (kelasId) fetchThreads(); }, [kelasId]);

  // Fetch comments for selected thread
  const fetchComments = async (threadId) => {
    setCommentLoading(true);
    try {
      const res = await fetchWithAuth(`/api/discussions/comments?thread_id=${threadId}`);
      if (!res.ok) throw new Error(await res.text());
      setComments(await res.json());
    } catch {
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  // Open thread detail
  const openThread = (thread) => {
    setSelectedThread(thread);
    fetchComments(thread._id);
  };

  // Add thread
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (!form.title || !form.body) {
      setError("Judul dan isi wajib diisi.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetchWithAuth("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelas_id: kelasId, ...form }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal membuat thread.");
      setModalOpen(false);
      setForm({ title: "", body: "" });
      fetchThreads();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Add comment
  const handleComment = async (e) => {
    e.preventDefault();
    setCommentSaving(true);
    if (!commentBody) {
      setCommentSaving(false);
      return;
    }
    try {
      const res = await fetchWithAuth("/api/discussions/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: selectedThread._id, body: commentBody }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menambah komentar.");
      setCommentBody("");
      fetchComments(selectedThread._id);
    } catch {}
    setCommentSaving(false);
  };

  return (
    <ProtectedRoute requiredRoles={['admin','guru','siswa']}>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Diskusi Kelas</h1>
          <Button onClick={() => setModalOpen(true)} color="primary">Buat Thread</Button>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            {threads.length === 0 ? (
              <div className="text-gray-500">Belum ada diskusi. Jadilah yang pertama!</div>
            ) : (
              threads.map(thread => (
                <div key={thread._id} className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => openThread(thread)}>
                  <div className="font-semibold text-lg">{thread.title}</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm mb-1">oleh {thread.user_id?.nama || '-'} pada {new Date(thread.createdAt || thread.created_at).toLocaleString('id-ID')}</div>
                  <div className="text-gray-800 dark:text-gray-100">{thread.body.slice(0, 120)}{thread.body.length > 120 ? '...' : ''}</div>
                </div>
              ))
            )}
          </div>
        )}
        {/* Modal tambah thread */}
        {modalOpen && (
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <h2 className="text-xl font-bold mb-2">Buat Thread Baru</h2>
              <Input label="Judul" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <textarea className="w-full border rounded px-3 py-2" rows={5} placeholder="Isi thread..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required />
              {error && <div className="text-red-500">{error}</div>}
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => setModalOpen(false)} variant="outline">Batal</Button>
                <Button type="submit" color="primary" loading={saving}>Buat</Button>
              </div>
            </form>
          </Modal>
        )}
        {/* Modal detail thread & komentar */}
        {selectedThread && (
          <Modal open={!!selectedThread} onClose={() => setSelectedThread(null)}>
            <div className="p-4 space-y-4">
              <div className="font-bold text-lg mb-1">{selectedThread.title}</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm mb-2">oleh {selectedThread.user_id?.nama || '-'} pada {new Date(selectedThread.createdAt || selectedThread.created_at).toLocaleString('id-ID')}</div>
              <div className="mb-4 text-gray-800 dark:text-gray-100">{selectedThread.body}</div>
              <div className="font-semibold mb-2">Komentar:</div>
              {commentLoading ? <div>Loading komentar...</div> : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {comments.length === 0 ? <div className="text-gray-500">Belum ada komentar.</div> : comments.map(c => (
                    <div key={c._id} className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                      <div className="text-sm font-medium">{c.user_id?.nama || '-'}</div>
                      <div className="text-xs text-gray-500 mb-1">{new Date(c.createdAt || c.created_at).toLocaleString('id-ID')}</div>
                      <div>{c.body}</div>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleComment} className="mt-4 flex gap-2">
                <input className="flex-1 border rounded px-3 py-2" placeholder="Tulis komentar..." value={commentBody} onChange={e => setCommentBody(e.target.value)} required disabled={commentSaving} />
                <Button type="submit" color="primary" loading={commentSaving}>Kirim</Button>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </ProtectedRoute>
  );
} 