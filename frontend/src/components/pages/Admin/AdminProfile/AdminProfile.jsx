import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { Lock, User, Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND, STATE, FONT, getTheme } from '../AdminDashboard/adminTheme';

function AdminProfile() {
  const outletCtx = useOutletContext();
  const dark = outletCtx?.dark ?? false;
  const t = getTheme(dark);

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

  const inputStyle = {
    background: dark ? '#242838' : '#F7F7F8',
    color: t.textPrimary,
    borderColor: t.cardBorder,
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8" style={{ fontFamily: FONT.body, color: t.textPrimary }}>
      <div>
        <h1
          className="text-2xl md:text-3xl font-extrabold tracking-tight"
          style={{ color: t.textPrimary, fontFamily: FONT.heading }}
        >
          Admin Profile
        </h1>
        <p className="mt-1 text-sm font-medium" style={{ color: t.textSecondary }}>
          Manage your account credentials and system security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Info Card */}
        <div className="md:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 shadow-sm transition-all"
            style={{
              background: t.cardBg,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div
                className="h-24 w-24 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.coral}, #d96e41)`,
                }}
              >
                <Shield className="h-11 w-11 text-white" />
              </div>
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: t.textPrimary, fontFamily: FONT.heading }}
                >
                  {user?.name || 'Administrator'}
                </h3>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mt-2"
                  style={{
                    background: 'rgba(239, 131, 84, 0.12)',
                    color: BRAND.coral,
                  }}
                >
                  System Administrator
                </span>
              </div>
            </div>
            
            <div className="mt-8 space-y-3.5 pt-4" style={{ borderTop: `1px solid ${t.cardBorder}` }}>
              <div className="flex items-center" style={{ color: t.textSecondary }}>
                <Mail className="h-4 w-4 mr-3 flex-shrink-0" style={{ color: BRAND.coral }} />
                <span className="text-sm truncate font-medium">{user?.email || 'admin@ceylonbesttours.com'}</span>
              </div>
              <div className="flex items-center" style={{ color: t.textSecondary }}>
                <User className="h-4 w-4 mr-3 flex-shrink-0" style={{ color: BRAND.coral }} />
                <span className="text-sm font-medium">Role: {user?.role || 'ADMIN'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl p-6 md:p-8 shadow-sm transition-all"
            style={{
              background: t.cardBg,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239, 131, 84, 0.12)', color: BRAND.coral }}
              >
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: t.textPrimary, fontFamily: FONT.heading }}
                >
                  Change Password
                </h2>
                <p className="text-xs" style={{ color: t.textSecondary }}>
                  Update your administrator password periodically to keep access secure.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-5">
              {error && (
                <div
                  className="p-4 rounded-xl flex items-start gap-3 text-sm font-medium"
                  style={{
                    background: 'rgba(224, 72, 59, 0.1)',
                    border: '1px solid rgba(224, 72, 59, 0.25)',
                    color: STATE.danger,
                  }}
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div
                  className="p-4 rounded-xl flex items-start gap-3 text-sm font-medium"
                  style={{
                    background: 'rgba(47, 158, 68, 0.1)',
                    border: '1px solid rgba(47, 158, 68, 0.25)',
                    color: STATE.success,
                  }}
                >
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>{success}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textSecondary }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={inputStyle}
                  className="block w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354]"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textSecondary }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                  className="block w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354]"
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textSecondary }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  className="block w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354]"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 text-white font-bold text-sm rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-sm"
                  style={{
                    background: BRAND.coral,
                    fontFamily: FONT.heading,
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#d96e41'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = BRAND.coral; }}
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