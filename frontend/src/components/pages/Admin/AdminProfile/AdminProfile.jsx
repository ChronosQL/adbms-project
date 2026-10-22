import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { Lock, User, Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

function AdminProfile() {
  const { user, changePassword } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess("Password changed successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and change your password.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Info Card */}
        <div className="md:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#242424] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-24 w-24 bg-gradient-to-br from-[#00b0a5] to-[#008f86] rounded-full flex items-center justify-center shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name || 'Admin'}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00b0a5]/10 text-[#00b0a5] mt-2">
                  Administrator
                </span>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Mail className="h-5 w-5 mr-3 text-slate-400" />
                <span className="text-sm truncate">{user?.email || 'admin@example.com'}</span>
              </div>
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <User className="h-5 w-5 mr-3 text-slate-400" />
                <span className="text-sm">Role: {user?.role || 'ADMIN'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#242424] rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center mb-6">
              <Lock className="h-6 w-6 text-[#00b0a5] mr-3" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700">{success}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00b0a5] focus:border-transparent transition-all outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00b0a5] focus:border-transparent transition-all outline-none"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00b0a5] focus:border-transparent transition-all outline-none"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-[#00b0a5] hover:bg-[#008f86] text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00b0a5] disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-sm shadow-[#00b0a5]/20"
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default AdminProfile;