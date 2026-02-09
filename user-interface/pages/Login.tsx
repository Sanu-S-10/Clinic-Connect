import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthRole } from '../types';
import { login as loginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user');
  const [role, setRole] = useState<AuthRole>('Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>('/');
  const [showForgot, setShowForgot] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admins/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Admin login failed');
      }
      const data = await response.json();
      // Normalize admin response to have 'name' property
      const adminData = { 
        ...data.admin, 
        role: 'Admin', 
        id: data.admin._id,
        name: data.admin.fullName || data.admin.name // Use fullName if available, otherwise name
      };
      setUser(adminData);
      setRedirectPath('/admin/approvals');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate(redirectPath || '/');
      }, 2000); // Show success message for 2 seconds
      return () => clearTimeout(timer);
    }
  }, [success, navigate, redirectPath]);

  // Render ForgotPasswordModal
  const handleCloseForgot = () => setShowForgot(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPending(false);
    setSuccess(false);
    setLoading(true);
    try {
      const { user } = await loginApi(email, password);
      setUser(user);
        setRedirectPath(user?.role === 'Clinic Admin' ? '/clinic-admin' : '/');
      setSuccess(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      if (errorMsg.includes('pending')) {
        setIsPending(true);
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="max-w-md mx-auto px-6 py-8 md:py-12 animate-in fade-in duration-500">
      <div className="frosted-glass p-6 md:p-8 rounded-[2.5rem] shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-1 text-center">Welcome Back</h1>
        <p className="text-gray-500 text-center mb-5">Login to your ClinicConnect account</p>

        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-5 gap-2">
          <button
            type="button"
            onClick={() => setLoginType('user')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${loginType === 'user' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400'}`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${loginType === 'admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400'}`}
          >
            Admin
          </button>
        </div>

        {loginType === 'user' && (
          <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => setRole('Patient')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${role === 'Patient' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400'}`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole('Clinic Admin')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${role === 'Clinic Admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400'}`}
            >
              Clinic Admin
            </button>
          </div>
        )}

        <form onSubmit={loginType === 'admin' ? handleAdminLogin : handleSubmit} className="space-y-4">
          {error && (
            <div className={`p-4 rounded-2xl ${isPending ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50'} ${isPending ? 'text-yellow-800' : 'text-red-600'} text-sm font-medium`}>
              <div className="flex items-start space-x-3">
                <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPending ? 'text-yellow-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={isPending ? "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"} clipRule="evenodd" />
                </svg>
                <div>
                  <p className={`font-bold ${isPending ? 'text-yellow-900' : ''}`}>{isPending ? 'Approval Pending' : 'Login Error'}</p>
                  <p className={`text-sm mt-1 ${isPending ? 'text-yellow-700' : ''}`}>{error}</p>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-2xl bg-green-50 text-green-700 text-sm font-medium">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold">Login Successful! Redirecting...</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Email Address</label>
            <input
              required
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L9.172 9.172m5.656 5.656l.853.853m-1.06-1.06L9.172 9.172" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-2 text-right">
              <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-blue-600 hover:underline">Forgot password?</button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-50 transition-all"
          >
            {loading ? 'Signing in...' : loginType === 'admin' ? 'Admin Sign In' : 'Sign In'}
          </button>

        </form>

        <p className="mt-4 text-center text-gray-500 text-sm">
          Don't have an account? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
    <ForgotPasswordModal open={showForgot} onClose={handleCloseForgot} />
    </>
  );
};

export default Login;

// Render forgot password modal at end so it overlays page when shown
// (component included above in this file via import)
