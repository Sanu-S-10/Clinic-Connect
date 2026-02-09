import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { registerClinic } from '../services/api';

const ClinicRegister: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const location = useLocation();
  const navState = (location.state as any) || {};
  const initialEmail = navState.email || '';
  const initialName = navState.name || '';
  const initialPhone = navState.phone || '';
  const initialPassword = navState.password || '';

  const [formData, setFormData] = useState({
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
    address: '',
    location: '',
    specialties: '',
    password: initialPassword,
    confirmPassword: initialPassword,
  });

  const emailLocked = Boolean(initialEmail);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const specialtyOptions = [
    'General Medicine',
    'Dentistry',
    'Cardiology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology',
    'Dermatology',
    'ENT',
    'Ophthalmology',
    'Psychiatry',
    'Neurology',
    'Oncology',
  ];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Clinic name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{7,}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid phone number (minimum 7 digits)';
    }

    if (!formData.address.trim()) {
      errors.address = 'Full address is required';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location/District is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await registerClinic({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        location: formData.location,
        specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        location: '',
        specialties: '',
        password: '',
        confirmPassword: '',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for registering your clinic. Your registration has been submitted for approval. Our admin team will review your details and contact you shortly.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Once approved, you'll receive an email confirming your account status and can proceed to log in.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-2">What happens next?</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ We review your clinic information</li>
              <li>✓ We verify your details</li>
              <li>✓ We send you an approval email</li>
              <li>✓ You can then log in and start managing</li>
            </ul>
          </div>
          <p className="text-gray-600 mb-6">
            Redirecting to login page in 3 seconds...
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Register Your Clinic</h1>
            </div>
            <p className="text-blue-100 text-lg">Join ClinicConnect and start managing appointments today</p>
          </div>

          {/* Form */}
          <div className="px-8 py-12">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-red-800">Registration Error</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Basic Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">1</span>
                  Basic Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Clinic Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your clinic name"
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors ${
                        validationErrors.name
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.name && <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      readOnly={emailLocked}
                      placeholder="clinic@example.com"
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors ${
                        validationErrors.email
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.email && <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors ${
                        validationErrors.phone
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.phone && <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                      Location / District <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="location"
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Downtown, District 5"
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors ${
                        validationErrors.location
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.location && <p className="text-red-600 text-sm mt-1">{validationErrors.location}</p>}
                  </div>
                </div>
              </div>

              {/* Section 2: Address */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">2</span>
                  Address
                </h2>
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter the complete street address of your clinic"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors resize-none ${
                      validationErrors.address
                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {validationErrors.address && <p className="text-red-600 text-sm mt-1">{validationErrors.address}</p>}
                </div>
              </div>

              {/* Section 3: Specialties */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">3</span>
                  Specialties
                </h2>
                <label htmlFor="specialties" className="block text-sm font-semibold text-gray-700 mb-2">
                  Clinic Specialties <span className="text-gray-500">(Optional)</span>
                </label>
                <p className="text-sm text-gray-600 mb-2">Select or type multiple specialties separated by commas</p>
                <input
                  id="specialties"
                  type="text"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleChange}
                  placeholder="e.g., General Medicine, Cardiology, Dentistry"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {specialtyOptions.slice(0, 6).map(specialty => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => {
                        const specialties = formData.specialties
                          ? formData.specialties.split(',').map(s => s.trim())
                          : [];
                        if (!specialties.includes(specialty)) {
                          specialties.push(specialty);
                          setFormData(prev => ({ ...prev, specialties: specialties.join(', ') }));
                        }
                      }}
                      className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-sm hover:bg-blue-100 transition-colors"
                    >
                      + {specialty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Security */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">4</span>
                  Security
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter a strong password"
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors ${
                        validationErrors.password
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.password && <p className="text-red-600 text-sm mt-1">{validationErrors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors ${
                        validationErrors.confirmPassword
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.confirmPassword && <p className="text-red-600 text-sm mt-1">{validationErrors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? 'Submitting Registration...' : 'Register Clinic'}
              </button>

              {/* Terms */}
              <p className="text-center text-gray-600 text-sm">
                By registering, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>

            {/* Footer Link */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicRegister;
