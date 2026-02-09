import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Step = 'email' | 'otp' | 'done';

export default function ForgotPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let t: any;
    if (cooldown > 0) {
      t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!open) {
      // reset on close
      setStep('email');
      setEmail('');
      setOtp('');
      setLoading(false);
      setError('');
      setMessage('');
      setCooldown(0);
    }
  }, [open]);

  if (!open) return null;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const sendOtp = async () => {
    setError('');
    setMessage('');
    if (!email) return setError('Please enter your email');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setMessage('If an account exists, an OTP has been sent to that email.');
      setStep('otp');
      setCooldown(60); // 60s cooldown for resend
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || 'Invalid or expired OTP');
      setMessage('OTP verified. Proceed to reset password...');
      setStep('done');
      // redirect to reset-password page with email in state
      setTimeout(() => {
        onClose();
        navigate('/reset-password', { state: { email } });
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Forgot Password</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {message && <div className="mb-3 text-sm text-green-700">{message}</div>}

        {step === 'email' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 border rounded-xl"
            />
            <div className="flex gap-2">
              <button onClick={sendOtp} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-xl">{loading ? 'Sending...' : 'Send OTP'}</button>
              <button onClick={onClose} className="flex-1 border rounded-xl py-2">Cancel</button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-600">Enter OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="text"
              maxLength={6}
              placeholder="123456"
              className="w-full px-4 py-3 border rounded-xl"
            />
            <div className="flex gap-2">
              <button onClick={verifyOtp} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-xl">{loading ? 'Verifying...' : 'Verify OTP'}</button>
              <button onClick={() => { if (cooldown === 0) sendOtp(); }} disabled={cooldown > 0} className="flex-1 border rounded-xl py-2">{cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend'}</button>
            </div>
            <div className="text-xs text-gray-500">If you didn't receive the OTP, check spam or try resending after the cooldown.</div>
          </div>
        )}

        {step === 'done' && (
          <div className="py-6 text-center">
            <p className="font-bold">Verified</p>
            <p className="text-sm text-gray-600">Redirecting to your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}
