import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useGoogleLogin } from '@react-oauth/google';
import authBg from '../../../assets/auth-bg.png';
import { AuthContext } from '../../../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error,  setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, loginWithGoogle } = useContext(AuthContext);

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        setError('');
        await loginWithGoogle(codeResponse.code);
        navigate('/');
      } catch (err) {
        setError(err.message || 'Google registration failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: errorResponse => setError('Google registration failed.'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('1. Button clicked');
    console.log('formData:', formData);  // ← ADD THIS
    setError('');

    if (formData.password !== formData.confirmPassword) {
      console.log('BLOCKED: passwords dont match');  // ← ADD THIS
      setError("Passwords don't match. Please try again.");
      return;
    }

    if (formData.password.length < 6) {
      console.log('BLOCKED: password too short, length:', formData.password.length);  // ← ADD THIS
      setError("Password must be at least 6 characters.");
      return;
    }
    
    console.log('2. Validation passed, calling register...');
    console.log('3. register function is:', typeof register);
    setLoading(true);
    try {
      await register(formData.fullName, formData.email, formData.password);
      console.log('4. Register succeeded!');
      navigate('/');
    } catch (err) {
      console.log('5. Error caught:', err.message);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

// const handleRegister = async (e) => {
//     e.preventDefault();
//     setError('');
 
//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords don't match. Please try again.");
//       return;
//     }
 
//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters.');
//       return;
//     }
 
//     setLoading(true);
//     try {
//       await register(formData.fullName, formData.email, formData.password);
//       // register() in AuthContext saves the token + user automatically
//       navigate('/');
//     } catch (err) {
//       setError(err.message || 'Registration failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };


  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#2D3142]">
      {/* Left side - Image */}
      <div className="hidden lg:flex w-1/2 relative bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        <img
          src={authBg}
          alt="Luxury travel"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute bottom-12 left-12 z-20 text-white">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold mb-4 tracking-tight">{"Join the Adventure"}</h1>
            <p className="text-lg text-slate-300 max-w-md">{"Create an account to unlock exclusive tours and premium vehicle rentals."}</p>
          </motion.div>
        </div>
        <div className="absolute top-8 left-12 z-20">
          <Link to="/" className="text-3xl font-bold text-white tracking-tighter flex items-center">
            <span className="text-[#EF8354]">Ceylone </span> Best Tours.
          </Link>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <motion.div
          className="w-full max-w-md my-auto pt-8 pb-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center flex justify-center">
            <Link to="/" className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
              <span className="text-[#EF8354]">Ceylone</span> Best Tours.
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{"Create Account"}</h2>
            <p className="text-slate-500 dark:text-slate-400">{"Sign up to get started with Ceylone Best Tours."}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{"Full Name"}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full pl-10 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2D3142] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#EF8354] focus:border-transparent transition-all outline-none placeholder:text-slate-400"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{"Email address"}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2D3142] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#EF8354] focus:border-transparent transition-all outline-none placeholder:text-slate-400"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{"Password"}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2D3142] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#EF8354] focus:border-transparent transition-all outline-none placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{"Confirm Password"}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2D3142] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#EF8354] focus:border-transparent transition-all outline-none placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>



            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-slate-900 dark:bg-[#EF8354] hover:bg-slate-800 dark:hover:bg-[#4F5D75] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EF8354] transition-all cursor-pointer mt-4"
            >
              {loading ? "Creating account..." : "Create Account"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.button>
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-50 dark:bg-[#2D3142] text-slate-500">Or continue with</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-base font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#2D3142] hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EF8354] transition-all cursor-pointer"
              >
                <FcGoogle className="h-5 w-5 mr-2" />
                Google
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            {"Already have an account?"}{' '}
            <Link to="/login" className="font-semibold text-[#EF8354] hover:text-[#4F5D75] transition-colors">
              {"Sign in"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
