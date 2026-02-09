
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthRole } from '../types';
import { signup } from '../services/api';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<AuthRole>('Patient');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      // Redirect clinic admins to clinic registration, others to login
      if (role === 'Clinic Admin') {
        navigate('/clinic-register', { state: { email: formData.email } });
      } else {
        navigate('/login');
      }
    }
  }, [success, countdown, navigate, role, formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role
      });
      setSuccess(true);
      setCountdown(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12 md:py-16 animate-in fade-in duration-500">
      <div className="frosted-glass p-8 md:p-10 rounded-[2.5rem] shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Join ClinicConnect</h1>
        <p className="text-gray-500 text-center mb-8">Access premium healthcare in your city</p>

        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => setRole('Patient')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${role === 'Patient' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400'}`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => {
              // Redirect to full clinic registration flow when user chooses Clinic Admin
              navigate('/clinic-register', { state: { name: formData.name, email: formData.email, phone: formData.phone, password: formData.password } });
            }}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all text-gray-400"
          >
            Clinic Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-2xl bg-green-50 text-green-700 text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-bold">Account created successfully!</p>
                    <p className="text-xs mt-1">{role === 'Clinic Admin' ? `Redirecting to clinic registration in ${countdown} seconds...` : `Redirecting to login in ${countdown} seconds...`}</p>
                  </div>
                </div>
              </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Full Name</label>
            <input
              required
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Email Address</label>
            <input
              required
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Password</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Confirm</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-50 transition-all mt-4"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
