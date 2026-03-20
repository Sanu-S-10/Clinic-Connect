import React, { useState, useRef, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Home from './pages/Home';
import Directory from './pages/Directory';
import ClinicDetails from './pages/ClinicDetails';
import DoctorDetails from './pages/DoctorDetails';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import ClinicAdmin from './pages/ClinicAdmin';
import ClinicRegister from './pages/ClinicRegister';
import AdminApproval from './pages/AdminApproval';
import AdminUsers from './pages/AdminUsers';
import Appointments from './pages/Appointments';
import Chatbot from './components/Chatbot';
import { AuthProvider, useAuth } from './context/AuthContext';
import { changePassword } from './services/api';

const LogoBar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const logoTarget = user?.role === 'Clinic Admin' ? '/clinic-admin' : '/';
  return (
    <nav className="sticky top-0 z-50 frosted-glass py-4 px-4 md:py-5 md:px-12 flex items-center border-b border-gray-100/40">
      <Link 
        to="/" 
        onClick={(e) => {
          e.preventDefault();
          navigate('/');
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }}
        className="flex items-center space-x-3 group"
      >
        <img src="/favicon.svg" alt="ClinicConnect" className="w-10 h-10 group-hover:opacity-80 transition-all" />
        <span className="hidden sm:inline text-xl font-bold text-gray-900 tracking-tight">ClinicConnect</span>
      </Link>
    </nav>
  );
};

const AdminNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        setPasswordError('User ID not found');
        return;
      }
      await changePassword(userId, passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const logoTarget = user?.role === 'Clinic Admin' ? '/clinic-admin' : user?.role === 'Admin' ? '/admin' : { pathname: '/', hash: 'home' };

  return (
    <nav className="sticky top-0 z-50 frosted-glass py-4 px-4 md:py-5 md:px-12 flex items-center justify-between border-b border-gray-100/40">
      {/* Logo on the left */}
      <Link to={logoTarget} className="flex items-center space-x-3 group">
        <img src="/favicon.svg" alt="ClinicConnect" className="w-10 h-10 rounded-xl group-hover:opacity-80 transition-all shadow-lg shadow-blue-100 object-contain" />
        <span className="hidden sm:inline text-xl font-bold text-gray-900 tracking-tight">ClinicConnect</span>
      </Link>

      {/* Admin Title */}
      <div className="hidden md:block flex-1 ml-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Dashboard</p>
      </div>

      {/* Right side: Profile dropdown */}
      <div className="flex items-center space-x-6">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Profile menu"
            >
              <span className="text-lg font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'A'}
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1rem))] rounded-2xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 py-4 overflow-hidden z-50">
                <div className="px-5 pb-3 border-b border-gray-100">
                  <p className="font-bold text-gray-900 truncate">{user.name || user.email}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">{user.phone}</p>
                  )}
                  <span className="inline-block mt-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {user.role}
                  </span>
                </div>
                    {user.role !== 'Admin' && (
                    <Link
                      to="/"
                      onClick={(e) => {
                        e.preventDefault();
                        setProfileOpen(false);
                        navigate('/');
                        setTimeout(() => {
                          window.scrollTo(0, 0);
                          document.documentElement.scrollTop = 0;
                          document.body.scrollTop = 0;
                        }, 0);
                      }}
                      className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center space-x-2 block"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 13l-4-4m0 0l-2-2m2 2l2-2m0 0l4-4" />
                      </svg>
                      <span>Back to Home</span>
                    </Link>
                    )}

                    {user.role === 'Admin' && (
                        <Link
                          to="/admin/approvals"
                          onClick={() => setProfileOpen(false)}
                          className="w-full px-5 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-gray-50 transition-colors flex items-center space-x-2 block"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m2 0a2 2 0 01-2 2H7a2 2 0 01-2-2" />
                          </svg>
                          <span>Approvals</span>
                        </Link>
                    )}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowChangePassword(true);
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-2 border-b border-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-5 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 min-h-screen">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm font-medium">
                  Password changed successfully!
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
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
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        setPasswordError('User ID not found');
        return;
      }
      await changePassword(userId, passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const logoTarget = user?.role === 'Clinic Admin' ? '/clinic-admin' : '/';

  return (
    <nav className="sticky top-0 z-50 frosted-glass py-4 px-4 md:py-5 md:px-12 flex items-center justify-between border-b border-gray-100/40">
      {/* Logo on the left with Name */}
      <Link 
        to={logoTarget} 
        onClick={(e) => {
          if (logoTarget === '/') {
            e.preventDefault();
            window.location.hash = '';
            navigate('/', { replace: true });
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
          }
        }}
        className="flex items-center space-x-2 sm:space-x-3 group"
      >
        <img src="/favicon.svg" alt="ClinicConnect" className="w-10 h-10 rounded-xl group-hover:opacity-80 transition-all shadow-lg shadow-blue-100 object-contain" />
        <span className="hidden sm:inline text-xl font-bold text-gray-900 tracking-tight">ClinicConnect</span>
      </Link>

      {/* Anchor links: Home, Services, Features, Contact, About */}
      <div className="hidden md:flex items-center space-x-6">
        <Link 
          to="/" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }}
          className="text-gray-500 hover:text-blue-700 font-semibold transition-colors text-sm"
        >
          Home
        </Link>
        <Link to="/#services" className="text-gray-500 hover:text-blue-700 font-semibold transition-colors text-sm">
          Services
        </Link>
        <Link to="/#features" className="text-gray-500 hover:text-blue-700 font-semibold transition-colors text-sm">
          Features
        </Link>
        <Link to="/#contact" className="text-gray-500 hover:text-blue-700 font-semibold transition-colors text-sm">
          Contact
        </Link>
        <Link to="/#about" className="text-gray-500 hover:text-blue-700 font-semibold transition-colors text-sm">
          About
        </Link>
      </div>

      {/* Right side: Profile dropdown when logged in, else Log In / Sign Up */}
      <div className="flex items-center space-x-3 sm:space-x-6 md:space-x-8">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Profile menu"
            >
              <span className="text-lg font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1rem))] rounded-2xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 py-4 overflow-hidden z-50">
                <div className="px-5 pb-3 border-b border-gray-100">
                  <p className="font-bold text-gray-900 truncate">{user.name || user.email}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">{user.phone}</p>
                  )}
                  <span className="inline-block mt-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {user.role}
                  </span>
                </div>
                <Link
                  to="/"
                  onClick={(e) => {
                    e.preventDefault();
                    setProfileOpen(false);
                    navigate('/');
                    setTimeout(() => {
                      window.scrollTo(0, 0);
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    }, 0);
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center space-x-2 block"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 13l-4-4m0 0l-2-2m2 2l2-2m0 0l4-4" />
                  </svg>
                  <span>Back to Home</span>
                </Link>
                {user.role === 'Patient' && (
                  <Link
                    to="/appointments"
                    onClick={() => setProfileOpen(false)}
                    className="w-full px-5 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-2 block border-b border-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>My Appointments</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowChangePassword(true);
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-2 border-b border-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-5 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="text-gray-500 hover:text-blue-700 font-semibold transition-colors text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md shadow-blue-50 transition-all hover:shadow-lg active:scale-95 whitespace-nowrap"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 min-h-screen">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm font-medium">
                  Password changed successfully!
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
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
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer: React.FC = () => (
  <footer className="py-12 px-6 md:px-12 bg-white border-t border-gray-50 text-center">
    <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
      &copy; {new Date().getFullYear()} ClinicConnect &bull; Premium Healthcare Directory
    </p>
  </footer>
);

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  React.useEffect(() => {
    // Always scroll to top for home page with multiple methods for reliability
    if (pathname === '/') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Retry after a small delay to ensure it works
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);
  return null;
};

const AdminSidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user?.role !== 'Admin') return null;

  const navItems = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/admin/approvals',
      label: 'Approvals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/patients',
      label: 'Patients',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      to: '/admin/clinic-admins',
      label: 'Clinic Admins',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 py-6 px-3">
      <p className="px-4 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Navigation</p>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

const hideNavbarPaths = ['/login', '/signup', '/clinic-register'];
const adminPaths = ['/admin', '/clinic-admin', '/admin/approvals', '/admin/users', '/admin/patients', '/admin/clinic-admins'];

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthPage = hideNavbarPaths.includes(location.pathname);
  const isAdminPage = adminPaths.includes(location.pathname);
  const isAdminSidebarPage = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-white text-gray-800 selection:bg-blue-50 selection:text-blue-900">
        {isAdminPage ? <AdminNavbar /> : isAuthPage ? <LogoBar /> : <Navbar />}
        <div className="flex flex-grow">
          {isAdminSidebarPage && <AdminSidebar />}
          <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/clinic/:id" element={<ClinicDetails />} />
            <Route path="/doctor/:id" element={<DoctorDetails />} />
            <Route path="/book/:doctorId" element={<Booking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/clinic-register" element={<ClinicRegister />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/clinic-admin" element={<ClinicAdmin />} />
            <Route path="/admin/approvals" element={<AdminApproval />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/patients" element={<AdminUsers defaultFilter="Patient" />} />
            <Route path="/admin/clinic-admins" element={<AdminUsers defaultFilter="Clinic Admin" />} />
            <Route path="/appointments" element={<Appointments />} />
          </Routes>
          </main>
        </div>
        <Footer />
      </div>
      {!isAuthPage && <Chatbot />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
        <Analytics />
      </AuthProvider>
    </Router>
  );
};

export default App;
