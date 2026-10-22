import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useGoogleLogin } from '@react-oauth/google';
import authBg from '../../../assets/auth-bg.png';
import { AuthContext } from '../../../context/AuthContext';

function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError]               = useState('');
	const [loading, setLoading]           = useState(false);
	const navigate = useNavigate();
	
	const location = useLocation();
	const { login, loginWithGoogle } = useContext(AuthContext);
	const params = new URLSearchParams(location.search);
	const redirectPath = params.get('redirect');
	const safeRedirect = redirectPath && redirectPath.startsWith('/') ? redirectPath : null;

	const handleGoogleLogin = useGoogleLogin({
		flow: 'auth-code',
		onSuccess: async (codeResponse) => {
			try {
				setLoading(true);
				setError('');
				const user = await loginWithGoogle(codeResponse.code);
				if (user.role === 'ADMIN') {
					navigate('/admin/admin-dashboard');
				} else {
					navigate(safeRedirect || '/');
				}
			} catch (err) {
				setError(err.message || 'Google login failed.');
			} finally {
				setLoading(false);
			}
		},
		onError: errorResponse => setError('Google login failed.'),
	});

	{/*const handleLogin = (e) => {
		e.preventDefault();
		if (email === 'admin@ceylon.com' && password === '1234') {
			login({ role: 'admin', email, name: 'Admin User' });
			navigate('/admin/admin-dashboard');
		} else if (email === 'abcd@gmail.com' && password === '1234') {
			login({ role: 'standard', email, name: 'User' });
			navigate(safeRedirect || '/');
		} else {
			alert('Invalid email or password. Please try again.');
		}
	};*/}

		const handleLogin = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);
 
		try {
			const user = await login(email, password);
 
			if (user.role === 'ADMIN') {
				navigate('/admin/admin-dashboard');
			} else {
				navigate(safeRedirect || '/');
			}
 
		} catch (err) {
			setError(err.message || "Invalid email or password. Please try again.");
		} finally {
			setLoading(false);
		}
	};


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
						<h1 className="text-4xl font-bold mb-4 tracking-tight">{"Your Journey Begins Here"}</h1>
						<p className="text-lg text-slate-300 max-w-md">{"Experience the pinnacle of travel with Ceylon Best Tours' premium fleet and bespoke tours."}</p>
					</motion.div>
				</div>
				<div className="absolute top-8 left-12 z-20">
					<Link to="/" className="text-3xl font-bold text-white tracking-tighter flex items-center">
						<span className="text-[#EF8354]">Ceylone </span> Best Tours.
					</Link>
				</div>
			</div>

			{/* Right side - Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
				<motion.div
					className="w-full max-w-md"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
				>
					{/* Mobile Logo */}
					<div className="lg:hidden mb-10 text-center">
						<Link to="/" className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
							<span className="text-[#EF8354]">Ceylone </span> Best Tours.
						</Link>
					</div>

					<div className="mb-10 lg:mb-12">
						<h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{"Welcome Back"}</h2>
						<p className="text-slate-500 dark:text-slate-400">{"Please enter your details to sign in."}</p>
					</div>

					<form onSubmit={handleLogin} className="space-y-6">
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300">{"Email address"}</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Mail className="h-5 w-5 text-slate-400" />
								</div>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="block w-full pl-10 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2D3142] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#EF8354] focus:border-transparent transition-all outline-none placeholder:text-slate-400"
									placeholder="name@example.com"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<label className="text-sm font-medium text-slate-700 dark:text-slate-300">{"Password"}</label>
								<a href="#" className="text-sm font-medium text-[#EF8354] hover:text-[#4F5D75] transition-colors">{"Forgot password?"}</a>
							</div>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-slate-400" />
								</div>
								<input
									type={showPassword ? "text" : "password"}
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
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



						<motion.button
							whileHover={{ scale: 1.01 }}
							whileTap={{ scale: 0.99 }}
							type="submit"
							className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-slate-900 dark:bg-[#EF8354] hover:bg-slate-800 dark:hover:bg-[#4F5D75] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EF8354] transition-all cursor-pointer"
						>
					{loading ? "Signing in..." : "Sign In"}
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
				{"Don't have an account?"}{' '}
				<Link to="/register" className="font-semibold text-[#EF8354] hover:text-[#4F5D75] transition-colors">
					{"Sign up for free"}
				</Link>
			</p>
		</motion.div>
	</div>
</div>
	);
}

export default Login;
