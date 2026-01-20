"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/common/Toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { User, Mail, Lock, Phone, MapPin, Calendar, Save, Edit, Eye, EyeOff } from 'lucide-react';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    phone: '',
    address: '',
    birthDate: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
    fetchProfile();
  }, [router]);

  async function fetchProfile() {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`/api/users/profile`);
      if (!res.ok) throw new Error("Gagal mengambil data profil");
      const responseData = await res.json();
      // Handle both wrapped {success: true, ...data} and direct user object response formats
      const data = responseData.success !== undefined ? responseData : responseData;
      setFormData({
        nama: data.nama || '',
        email: data.email || '',
        phone: data.nomor_telepon || '',
        address: data.alamat || '',
        birthDate: data.tanggal_lahir ? data.tanggal_lahir.split('T')[0] : ''
      });
      // Update user state with profile data for role-specific displays
      if (data._id || data.id) {
        setUser(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengambil data profil' });
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async () => {
    try {
      const body = {
        nama: formData.nama,
        email: formData.email,
        nomor_telepon: formData.phone,
        alamat: formData.address,
        tanggal_lahir: formData.birthDate
      };
      const res = await fetchWithAuth(`/api/users/profile`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal update profil");
      }
      setMessage({ type: 'success', text: 'Profil berhasil diupdate' });
      // Update localStorage user
      const updated = await res.json();
      if (updated && (updated._id || updated.id)) {
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      }
      fetchProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal update profil' });
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      const res = await fetchWithAuth('/api/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengubah password');
      }
      setMessage({ type: 'success', text: 'Password berhasil diubah' });
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengubah password' });
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'guru', 'siswa', 'orangtua', 'parent']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Manage your account information and preferences</p>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
              }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Profile Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300 lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Personal Information
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Edit className="h-5 w-5" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Birth Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleProfileUpdate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Account Info */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        user.role === 'guru' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          user.role === 'siswa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                        {user.role}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </p>
                  </div>
                  {/* NISN for Siswa */}
                  {user.role === 'siswa' && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                      <span className="text-sm text-blue-600 dark:text-blue-300 font-medium">NISN</span>
                      <p className="font-bold text-blue-800 dark:text-blue-100 text-lg tracking-wider">{user.nisn || user.nis || '-'}</p>
                    </div>
                  )}
                  {/* NIP for Guru */}
                  {user.role === 'guru' && user.nip && (
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <span className="text-sm text-green-600 dark:text-green-300 font-medium">NIP</span>
                      <p className="font-bold text-green-800 dark:text-green-100 text-lg tracking-wider">{user.nip}</p>
                    </div>
                  )}
                  {/* Kelas for Siswa */}
                  {user.role === 'siswa' && user.kelas_id && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Kelas</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{user.kelas_id?.nama_kelas || user.kelas_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </h3>
                  <button
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {isChangingPassword ? 'Cancel' : 'Change'}
                  </button>
                </div>

                {isChangingPassword && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordUpdate}
                      className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
                    >
                      Update Password
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 