import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { createBooking, getDoctors, getClinics } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AlertModal, { AlertState } from '../components/AlertModal';
import html2canvas from 'html2canvas';

const Booking: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any | null>(null);
  const [clinic, setClinic] = useState<any | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setDoctorLoading(true);
    
    const loadData = async () => {
      try {
        const doctorsList = await getDoctors();
        if (!mounted) return;
        
        const found = doctorsList.find((d: any) => (d._id?.toString?.() === doctorId) || d.id === doctorId);
        setDoctor(found || null);
        
        // If doctor found, fetch clinic details
        if (found && found.clinicId) {
          try {
            const clinicsList = await getClinics();
            const foundClinic = clinicsList.find((c: any) => 
              (c._id?.toString?.() === found.clinicId) || c.id === found.clinicId
            );
            setClinic(foundClinic || null);
          } catch (err) {
            console.error('Error fetching clinic:', err);
          }
        }
        
        setDoctorLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        if (mounted) setDoctorLoading(false);
      }
    };
    
    loadData();
    return () => { mounted = false; };
  }, [doctorId]);

  // Parse working hours to get start and end times
  const parseWorkingHours = (hours: string) => {
    if (!hours) return { start: '09:00', end: '17:00' };
    const match = hours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return { start: '09:00', end: '17:00' };
    
    let startHour = parseInt(match[1]);
    const startMin = match[2];
    const startPeriod = match[3];
    let endHour = parseInt(match[4]);
    const endMin = match[5];
    const endPeriod = match[6];

    // Convert to 24-hour format
    if (startPeriod?.toUpperCase() === 'PM' && startHour !== 12) startHour += 12;
    if (startPeriod?.toUpperCase() === 'AM' && startHour === 12) startHour = 0;
    if (endPeriod?.toUpperCase() === 'PM' && endHour !== 12) endHour += 12;
    if (endPeriod?.toUpperCase() === 'AM' && endHour === 12) endHour = 0;

    return {
      start: `${String(startHour).padStart(2, '0')}:${startMin}`,
      end: `${String(endHour).padStart(2, '0')}:${endMin}`
    };
  };

  // Parse working days
  const getWorkingDays = (days: string) => {
    if (!days) return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    const daysLower = days.toLowerCase();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Handle "Monday - Friday" format (with dash)
    if (daysLower.includes('-')) {
      const parts = daysLower.split('-').map(s => s.trim());
      if (parts.length === 2) {
        const startIdx = dayNames.findIndex(d => d.includes(parts[0]));
        const endIdx = dayNames.findIndex(d => d.includes(parts[1]));
        if (startIdx !== -1 && endIdx !== -1) {
          const result = [];
          for (let i = startIdx; i <= endIdx; i++) {
            result.push(dayNames[i].charAt(0).toUpperCase() + dayNames[i].slice(1));
          }
          console.log(`Parsed working days from "${days}" to:`, result);
          return result;
        }
      }
    }
    
    // Handle "Monday to Friday" format (with "to")
    if (daysLower.includes('to')) {
      const parts = daysLower.split('to').map(s => s.trim());
      if (parts.length === 2) {
        const startIdx = dayNames.findIndex(d => d.includes(parts[0]));
        const endIdx = dayNames.findIndex(d => d.includes(parts[1]));
        if (startIdx !== -1 && endIdx !== -1) {
          const result = [];
          for (let i = startIdx; i <= endIdx; i++) {
            result.push(dayNames[i].charAt(0).toUpperCase() + dayNames[i].slice(1));
          }
          console.log(`Parsed working days from "${days}" to:`, result);
          return result;
        }
      }
    }
    
    // Handle comma-separated format
    const result = dayNames.filter(d => daysLower.includes(d)).map(d => d.charAt(0).toUpperCase() + d.slice(1));
    console.log(`Parsed working days from "${days}" to:`, result);
    return result;
  };

  // Check if date falls on working day
  const isWorkingDay = (dateStr: string): boolean => {
    if (!doctor?.workingDays) return true;
    try {
      // Parse YYYY-MM-DD format and use Indian timezone (Asia/Kolkata)
      const [year, month, day] = dateStr.split('-').map(Number);
      // Create date and get day name in Indian timezone
      const date = new Date(year, month - 1, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
      const workingDays = getWorkingDays(doctor.workingDays);
      console.log(`Checking date: ${dateStr}, parsed as: ${date.toDateString()}, day: ${dayName}, working days: ${workingDays.join(', ')}`);
      return workingDays.includes(dayName);
    } catch (error) {
      console.error('Error parsing date:', error);
      return true;
    }
  };

  const formatAmPm = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Generate time slots based on working hours
  const getTimeSlots = () => {
    const { start, end } = parseWorkingHours(doctor?.workingHours);
    const slots = [];
    
    const startTime = new Date(`2024-01-01 ${start}`);
    const endTime = new Date(`2024-01-01 ${end}`);
    
    // Generate 1-hour slots
    let current = new Date(startTime);
    while (current < endTime) {
      const nextHour = new Date(current);
      nextHour.setHours(nextHour.getHours() + 1);
      
      const currentFormatted = formatAmPm(current);
      const nextFormatted = formatAmPm(nextHour);
      
      // We can sort slots or use 24h internal id if we wanted, but the UI displays label
      slots.push({
        id: currentFormatted,
        label: `${currentFormatted} - ${nextFormatted}`
      });
      
      current = nextHour;
    }
    
    return slots.length > 0 ? slots : [{ id: 'default', label: 'Full Day' }];
  };
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    date: '',
    slot: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tokenNumber, setTokenNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [alert, setAlert] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'info' });
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `appointment_receipt_${tokenNumber}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download receipt:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to download receipt. Please try again.', type: 'error' });
    }
  };

  // Check authentication
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Login Required</h2>
        <p className="text-lg text-gray-500 mb-10">
          You need to log in to book an appointment with a doctor. Please log in to your account or create a new one.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            to="/login" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-all"
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-bold shadow-lg transition-all"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  if (!doctor) {
    if (doctorLoading) {
      return (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading doctor information...</p>
        </div>
      );
    }
    return <div className="text-center py-20 text-red-600 font-semibold">Doctor not found</div>;
  }

  const handleDateChange = (date: string) => {
    if (!isWorkingDay(date)) {
      setDateError(`Dr. ${doctor.name} is not available on this day. Working days: ${doctor.workingDays || 'Monday to Friday'}`);
      setFormData({...formData, date: '', slot: ''});
    } else {
      setDateError('');
      setFormData({...formData, date});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (dateError) {
      setError('Please select a valid date within working days');
      return;
    }
    setLoading(true);
    try {
      const response = await createBooking({
        clinicId: doctor.clinicId || doctor.clinicId?.toString?.(),
        doctorId: doctor._id?.toString?.() || doctor.id,
        patientName: formData.name,
        patientEmail: user.email,
        patientPhone: formData.phone,
        appointmentDate: formData.date,
        appointmentTime: formData.slot,
        userId: user.id || user._id
      });
      setTokenNumber(response.tokenNumber);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = getTimeSlots();

  if (isSubmitted) {
    // Find session index for the selected slot
    const sessionIndex = timeSlots.findIndex(slot => slot.label === formData.slot);
    const sessionNumber = sessionIndex >= 0 ? sessionIndex + 1 : null;
    const sessionLabel = sessionNumber ? `${sessionNumber}${sessionNumber === 1 ? 'st' : sessionNumber === 2 ? 'nd' : sessionNumber === 3 ? 'rd' : 'th'} Session` : '';

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-4 animate-in zoom-in-95 duration-500">
        <div className="frosted-glass p-6 rounded-2xl shadow-sm max-w-xl w-full">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Appointment Confirmed!</h1>
            <p className="text-sm text-gray-500">Your booking has been successfully created</p>
          </div>

          {/* Receipt */}
          <div ref={receiptRef} className="bg-white border-2 border-gray-200 rounded-xl p-5 mb-4">
            {/* Token Number */}
            <div className="text-center mb-4 pb-3 border-b-2 border-gray-100">
              <p className="text-sm font-semibold text-gray-500 mb-1">APPOINTMENT TOKEN</p>
              <p className="text-5xl font-bold text-blue-600 font-mono">{tokenNumber}</p>
            </div>

            {/* Patient Details */}
            <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Patient Name</p>
                <p className="text-base font-bold text-gray-900">{formData.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Phone</p>
                <p className="text-base font-bold text-gray-900">{formData.phone}</p>
              </div>
            </div>

            {/* Doctor Details */}
            <div className="mb-3 pb-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Doctor</p>
                <p className="text-lg font-bold text-gray-900">{doctor.name}</p>
                <p className="text-sm text-gray-600">{doctor.specialty}</p>
              </div>
              {sessionLabel && (
                <span className="text-xs font-semibold text-blue-700 ml-4 whitespace-nowrap bg-blue-50 rounded-full px-4 py-2 shadow-sm border border-blue-100">
                  {sessionLabel}
                </span>
              )}
            </div>

            {/* Clinic Details */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Clinic</p>
              <p className="text-base font-bold text-gray-900">{clinic?.name || doctor?.clinicName || 'N/A'}</p>
              {(clinic?.address || doctor?.clinicAddress) && (
                <p className="text-sm text-gray-600">{clinic?.address || doctor?.clinicAddress}</p>
              )}
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Date</p>
                <p className="text-base font-bold text-gray-900">
                  {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Time</p>
                <p className="text-base font-bold text-gray-900">{formData.slot}</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">📌</span> Save your token number to track your appointment.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-col">
            <div className="flex gap-3">
              <Link 
                to="/" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                  }, 0);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-center text-sm font-bold shadow-lg transition-all"
              >
                Home
              </Link>
              <Link 
                to="/appointments" 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-3 rounded-lg text-center text-sm font-bold shadow-lg transition-all"
              >
                My Appointments
              </Link>
            </div>
            <button
              onClick={downloadReceipt}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-4 animate-in fade-in duration-500">
      <div className="flex items-center mb-4" style={{marginLeft: '-16px'}}>
        <Link to={`/doctor/${doctor.id}`} className="inline-flex items-center text-gray-500 hover:text-blue-700 transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
      </div>
      <div className="max-w-xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-200 mt-2">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
          <p className="text-gray-500">Scheduling with <span className="text-blue-600 font-semibold">{doctor.name}</span></p>
          {doctor.workingDays && (
            <p className="text-sm text-gray-400 mt-2">Working: {doctor.workingDays} {doctor.workingHours && `• ${doctor.workingHours}`}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Patient Full Name</label>
              <input
                required
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Age</label>
              <input
                required
                type="number"
                placeholder="Age"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Phone Number</label>
            <input
              required
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Preferred Date</label>
              <input
                required
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-5 py-4 rounded-2xl bg-white border-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer ${dateError ? 'border-red-300' : 'border-gray-300'}`}
              />
              {dateError && <p className="text-red-500 text-xs mt-2">{dateError}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Time Slot</label>
              <select
                required
                value={formData.slot}
                onChange={(e) => setFormData({...formData, slot: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 transition-all cursor-pointer appearance-none"
              >
                <option value="">Select a slot</option>
                {timeSlots.map(slot => (
                  <option key={slot.id} value={slot.label}>{slot.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          <div className="pt-6">
            <button 
              type="submit"
              disabled={loading || !!dateError}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-xl font-bold shadow-xl shadow-blue-50 transition-all active:scale-95"
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              By confirming, you agree to our patient confidentiality terms.
            </p>
          </div>
        </form>
      </div>
      <AlertModal state={alert} onClose={() => setAlert({ ...alert, isOpen: false })} />
    </div>
  );
};

export default Booking;
