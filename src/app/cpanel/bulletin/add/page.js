"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from '@/lib/auth/client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback } from 'react';

function SuccessToast({ show, onClose, message }) {
  if (!show) return null;
  return (
    <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded shadow-lg flex items-center space-x-3 animate-fade-in">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white font-bold">×</button>
    </div>
  );
}

function TipTapEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Toolbar actions
  const setLink = useCallback(() => {
    const url = window.prompt('Masukkan URL');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return <div>Loading editor...</div>;
  return (
    <div className="border rounded bg-white">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'font-bold text-blue-700' : ''}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'italic text-blue-700' : ''}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'underline text-blue-700' : ''}>U</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'font-bold text-lg text-blue-700' : ''}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'font-bold text-blue-700' : ''}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'text-blue-700' : ''}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'text-blue-700' : ''}>1. List</button>
        <button type="button" onClick={setLink} className={editor.isActive('link') ? 'text-blue-700 underline' : ''}>Link</button>
        <button type="button" onClick={() => {
          const url = window.prompt('Masukkan URL gambar');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}>Img</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()}>Left</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()}>Center</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()}>Right</button>
      </div>
      <EditorContent editor={editor} className="min-h-[120px] p-2" />
    </div>
  );
}

export default function AddBulletinPage() {
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [gambar, setGambar] = useState(null);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [buletins, setBuletins] = useState([]);
  const [editId, setEditId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const router = useRouter();
  const user = typeof window !== 'undefined' ? getUser() : null;

  // Fetch bulletins
  useEffect(() => {
    fetch('/api/buletin')
      .then(res => res.json())
      .then(data => setBuletins(data));
  }, [success]);

  // Filter bulletins by user (or show all if admin)
  const filteredBuletins = user?.role === 'admin'
    ? buletins
    : buletins.filter(b => b.author?._id === user?.id || b.author === user?.id);

  // Edit handler
  const handleEdit = (b) => {
    setEditId(b._id);
    setJudul(b.judul);
    setIsi(b.isi);
    setTanggal(b.tanggal?.slice(0, 10) || '');
    setGambar(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus buletin ini?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/buletin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Gagal menghapus buletin');
      setSuccess(true);
      setEditId(null);
      setJudul('');
      setIsi('');
      setTanggal(new Date().toISOString().slice(0, 10));
      setGambar(null);
      setBuletins(buletins.filter(b => b._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update handleSubmit for edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!judul.trim() || !isi.trim()) {
      setError("Judul dan isi wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let res, data;
      if (editId) {
        res = await fetch('/api/buletin', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editId, judul, isi, tanggal }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengupdate buletin');
        setEditId(null);
      } else {
        const formData = new FormData();
        formData.append('judul', judul);
        formData.append('isi', isi);
        formData.append('tanggal', tanggal);
        if (gambar) formData.append('gambar', gambar);
        res = await fetch('/api/buletin', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menambah buletin');
      }
      setSuccess(true);
      setJudul('');
      setIsi('');
      setGambar(null);
      setTanggal(new Date().toISOString().slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <SuccessToast show={success} onClose={() => setSuccess(false)} message="Buletin berhasil ditambahkan!" />
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Tambah Buletin</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold mb-1">Judul</label>
          <input type="text" className="w-full border rounded px-3 py-2" value={judul} onChange={e => setJudul(e.target.value)} required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Isi</label>
          <TipTapEditor value={isi} onChange={setIsi} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Gambar (opsional)</label>
          <input type="file" accept="image/*" onChange={e => setGambar(e.target.files[0])} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Tanggal</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={tanggal} onChange={e => setTanggal(e.target.value)} required />
        </div>
        {error && <div className="text-red-600 font-semibold">{error}</div>}
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold" disabled={loading}>
          {loading ? "Menyimpan..." : "Tambah Buletin"}
        </button>
      </form>
      <h2 className="text-xl font-bold mt-10 mb-4 text-blue-700">Daftar Buletin Saya</h2>
      <div className="space-y-4">
        {filteredBuletins.length === 0 ? (
          <div className="text-gray-500">Belum ada buletin.</div>
        ) : (
          filteredBuletins.map(b => (
            <div key={b._id} className="bg-white border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4 shadow">
              <div className="flex-1">
                <div className="font-semibold text-blue-800">{b.judul}</div>
                <div className="text-xs text-gray-500 mb-1">{new Date(b.tanggal).toLocaleDateString('id-ID')} oleh {b.author?.nama || 'Admin'}</div>
                <div className="text-gray-700 line-clamp-2">{b.isi.length > 100 ? b.isi.slice(0, 100) + '...' : b.isi}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(b)} className="px-3 py-1 rounded bg-yellow-400 text-white font-semibold hover:bg-yellow-500">Edit</button>
                <button onClick={() => handleDelete(b._id)} className="px-3 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600">Hapus</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 