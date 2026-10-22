import React, { useContext, useState } from 'react';
import { AuthContext } from '../../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router';
import { 
  Camera, Mail, User as UserIcon, Phone, MapPin, Globe, Hash, 
  Edit3, Check, LayoutDashboard, Shield, CalendarDays, Lock, 
  MessageCircle, Star, Eye, EyeOff
} from 'lucide-react';
import MyMessageList from '../MyMessages/MyMessageList';
import MyMessageThread from '../MyMessages/MyMessageThread';
import MyMessageEmpty from '../MyMessages/MyMessageEmpty';
import { useMessages } from '../../../../context/useMessages.js';
import { useBookings } from '../../../../context/BookingsContext.jsx';
import MyBookings from '../MyBookings/MyBookings';
import MyReviews from '../MyReviews/MyReviews';
import PaymentPage from '../Payments/Payments';

const buildMergedConversation = (inquiries) => {
  if (!inquiries?.length) return null;
  const sorted = [...inquiries].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  const events = [];
  sorted.forEach((inquiry, index) => {
    if (index > 0) {
      events.push({
        id: `inquiry-${inquiry.id}`,
        from: 'customer',
        fromName: inquiry.customerName,
        message: inquiry.message,
        timestamp: inquiry.createdAt,
      });
    }
    (inquiry.replies || []).forEach((reply) => {
      events.push({ ...reply, inquiryId: inquiry.id });
    });
  });

  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    id: latest.id,
    customerName: latest.customerName,
    customerEmail: latest.customerEmail,
    subject: 'Support Chat',
    message: first.message,
    createdAt: first.createdAt,
    status: latest.status || 'new',
    replies: events,
    latestInquiryId: latest.id,
  };
};


function UserProfile() {
  const { user, changePassword, logout, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tab State
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard');
  const [paymentBookingId, setPaymentBookingId] = useState(location.state?.bookingId || null);
  const [toast, setToast] = useState(null);

  // Sync state from navigation (e.g. from MyBookingDetail)
  React.useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // clear the state so a page refresh doesn't force us back, or just let it be.
      window.history.replaceState({}, document.title)
    }
    if (location.state?.bookingId) {
      setPaymentBookingId(location.state.bookingId);
    }
  }, [location.state]);

  // State for profile fields (defaults to empty strings if not updated yet)
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contact_number || '',
    address: user?.street_address || '',
    country: user?.country || '',
    zipcode: user?.zipcode || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        name: profileData.name,
        contactNumber: profileData.contactNumber,
        address: profileData.address,
        country: profileData.country,
        zipcode: profileData.zipcode
      });
      setIsEditing(false);
      setToast({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setToast({ type: 'error', message: err.message || 'Failed to update profile. Please try again.' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  // Field Config for rendering mapping
  const formFields = [
    { label: 'Full Name', name: 'name', type: 'text', icon: UserIcon, placeholder: 'E.g. John Doe' },
    { label: 'Email Address', name: 'email', type: 'email', icon: Mail, placeholder: 'E.g. john@example.com' },
    { label: 'Contact Number', name: 'contactNumber', type: 'tel', icon: Phone, placeholder: 'E.g. +94 77 123 4567' },
    { label: 'Street Address', name: 'address', type: 'text', icon: MapPin, placeholder: 'E.g. 123 Main St, City' },
    { label: 'Country', name: 'country', type: 'text', icon: Globe, placeholder: 'E.g. Sri Lanka' },
    { label: 'Zip/Postal Code', name: 'zipcode', type: 'text', icon: Hash, placeholder: 'E.g. 10000' },
  ];

  // Navigation Data
  const navTabs = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'My Bookings', icon: CalendarDays },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'messages', label: 'My Messages', icon: MessageCircle },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  // ================= TABS COMPONENTS =================

  const ReviewsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <MyReviews isEmbedded={true} />
    </motion.div>
  );

  const renderDashboardTab = () => (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-8 pt-10 pb-6 flex flex-col sm:flex-row items-center justify-between border-b border-slate-100/50 relative">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden bg-slate-100 relative">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {profileData.name || 'Your Profile'}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-4 h-4" /> {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-0">
          {isEditing ? (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#EF8354] hover:bg-[#4F5D75] text-white px-6 py-2.5 rounded-full font-semibold shadow-md shadow-[#EF8354]/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Changes
            </motion.button>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-full font-semibold transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-8 sm:p-10">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Personal Information</h2>
          <p className="text-sm text-slate-500">Manage your personal details and contact information.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          {formFields.map((field, idx) => (
            <motion.div 
              key={field.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <field.icon className="w-4 h-4 text-[#EF8354]" />
                {field.label}
              </label>
              
              {isEditing ? (
                <input
                  type={field.type}
                  name={field.name}
                  value={profileData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  disabled={field.name === 'email'}
                  className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all shadow-sm outline-none ${
                    field.name === 'email'
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80'
                      : 'bg-white text-slate-800 focus:ring-2 focus:ring-[#EF8354]/50 focus:border-[#EF8354]'
                  }`}
                />
              ) : (
                <div className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm min-h-[46px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                  {profileData[field.name] ? (
                    <span className="font-medium text-slate-800">{profileData[field.name]}</span>
                  ) : (
                    <span className="text-slate-400 italic">Not set</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {!isEditing && (
           <div className="mt-10 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
             <div className="min-w-fit mt-0.5">
               <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <div>
               <h4 className="text-sm font-semibold text-blue-900">Keeping your profile updated</h4>
               <p className="text-sm text-blue-700 mt-1">
                 Make sure your contact information is accurate. This helps us communicate with you regarding your bookings and personalized tours.
               </p>
             </div>
           </div>
        )}
      </div>
    </motion.div>
  );

// Bookings Tab 
const BookingsTab = () => <MyBookings userEmail={user?.email} />;

// adding messages tab
  const MessagesTab = () => {
    const { messages, addReply } = useMessages();
 
    const merged = buildMergedConversation(
      messages.filter((m) => m.customerEmail?.toLowerCase() === user?.email?.toLowerCase())
    );
    const selectedMessage = merged || null;
 
    const handleSendFollowUp = (messageId, text) => {
      addReply(messageId, {
        from: 'customer',
        fromName: user?.name || user?.email,
        message: text,
      });
    };
 
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}
        className="p-8 sm:p-10 h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">My Messages</h2>
          <p className="text-slate-500 text-sm">View your conversations with support.</p>
        </div>
 
        {!selectedMessage ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
            <MyMessageEmpty navigate={navigate} />
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <MyMessageThread
              message={selectedMessage}
              onSendFollowUp={handleSendFollowUp}
            />
          </div>
        )}
      </motion.div>
    );
  };

  const SecurityTab = () => {
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handlePasswordChange = async (e) => {
      e.preventDefault();
      if (passwords.new !== passwords.confirm) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
      if (passwords.new.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
        return;
      }

      try {
        await changePassword(passwords.current, passwords.new);
        setMessage({ type: 'success', text: 'Password successfully updated! Please log in again.' });
        setPasswords({ current: '', new: '', confirm: '' });
        
        // Log out and redirect after short delay
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2500);
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="p-8 sm:p-10 h-full flex flex-col"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Security & Privacy</h2>
          <p className="text-slate-500">Update your password to keep your account secure.</p>
        </div>
        
        <div className="flex-1 max-w-2xl">
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#EF8354]"/> Change Password
            </h3>
            
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
                message.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
              }`}>
                {message.type === 'success' ? (
                  <Check className="w-5 h-5 text-green-500 mt-0.5 min-w-fit" />
                ) : (
                  <svg className="w-5 h-5 text-red-500 mt-0.5 min-w-fit" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <p className={`text-sm font-medium ${message.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                  {message.text}
                </p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                <input 
                  type="password" required placeholder="••••••••"
                  value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-[#EF8354]/50 focus:border-[#EF8354] outline-none transition-all"
                />
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} required placeholder="••••••••"
                    value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-[#EF8354]/50 focus:border-[#EF8354] outline-none transition-all pr-12"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Make sure it's at least 6 characters long.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} required placeholder="••••••••"
                    value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-[#EF8354]/50 focus:border-[#EF8354] outline-none transition-all pr-12"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="pt-4">
                <button type="submit" className="px-6 py-3 bg-[#EF8354] text-white font-semibold rounded-xl hover:bg-[#4F5D75] shadow-md shadow-[#EF8354]/20 transition-all cursor-pointer">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    );
  };


  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex justify-center bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-[#EF8354] to-[#4F5D75] -z-10 shadow-lg" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl z-[-1]" />
      
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 z-10">
        
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:sticky md:top-28">
            <div className="mb-8 hidden md:block">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Profile Navigation</h3>
            </div>
            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-[#EF8354] text-white shadow-md shadow-[#EF8354]/20' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && renderDashboardTab()}
            {activeTab === 'bookings' && <BookingsTab key="bookings" />}
            {activeTab === 'payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <PaymentPage 
                  bookingId={paymentBookingId} 
                  onRequestOpenTab={(tab, bId) => {
                    setActiveTab(tab);
                    if (bId) setPaymentBookingId(bId);
                  }} 
                />
              </motion.div>
            )}
            {activeTab === 'reviews' && <ReviewsTab key="reviews" />}
            {activeTab === 'messages' && <MessagesTab key="messages" />}
            {activeTab === 'security' && <SecurityTab key="security" />}
          </AnimatePresence>
        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'error' 
                ? 'bg-red-50 border-red-100 text-red-800' 
                : 'bg-green-50 border-green-100 text-green-800'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-semibold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserProfile;
