import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBookingsByUser, getDoctors, getClinics, deleteBooking } from '../services/api';
import html2canvas from 'html2canvas';
import AlertModal, { AlertState } from '../components/AlertModal';

interface Appointment {
  _id?: string;
  id?: string;
  clinicId: string;
  doctorId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  tokenNumber?: string;
  status?: string;
  createdAt?: string;
}

interface Doctor {
  id?: string;
  _id?: string;
  name: string;
  specialty?: string;
}

interface Clinic {
  id?: string;
  _id?: string;
  name: string;
}

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<{ id: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching appointments for user:', user.id);
        const [appointmentData, doctorData, clinicData] = await Promise.all([
          getBookingsByUser(user.id || user._id || ''),
          getDoctors(),
          getClinics()
        ]);
        
        console.log('Appointments fetched:', appointmentData);
        setAppointments(appointmentData || []);
        setDoctors(doctorData || []);
        setClinics(clinicData || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load appointments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  // Helper to check if appointment is upcoming
  const isAppointmentUpcoming = (dateStr: string, timeStr: string) => {
    try {
      let appointmentDate = new Date(dateStr);
      const [hours, minutes] = timeStr.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);
      return appointmentDate > new Date();
    } catch {
      return false;
    }
  };

  const filteredAppointments = appointments.filter(a => {
    const isUpcoming = isAppointmentUpcoming(a.appointmentDate, a.appointmentTime);
    const isCancelled = a.status === 'Cancelled';
    
    if (filter === 'upcoming') return isUpcoming && !isCancelled;
    if (filter === 'past') return !isUpcoming && !isCancelled;
    if (filter === 'cancelled') return isCancelled;
    if (filter === 'all') return !isCancelled;
    return !isCancelled;
  }).sort((a, b) => {
    return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
  });

  const getDoctorName = (doctorId: string, doctorDetails?: any) => {
    if (doctorDetails?.name) return doctorDetails.name;
    const doctor = doctors.find(d => d._id === doctorId || d.id === doctorId);
    return doctor?.name || 'Unknown Doctor';
  };

  const getClinicName = (clinicId: string, clinicDetails?: any) => {
    if (clinicDetails?.name) return clinicDetails.name;
    const clinic = clinics.find(c => c._id === clinicId || c.id === clinicId);
    return clinic?.name || 'Unknown Clinic';
  };

  const handleDeleteAppointment = async (appointmentId: string, patientName: string) => {
    setCancellingAppointment({ id: appointmentId, name: patientName });
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!cancellingAppointment) return;
    
    try {
      setIsProcessing(true);
      await deleteBooking(cancellingAppointment.id);
      setAppointments(prev => prev.filter(a => a.id !== cancellingAppointment.id && a._id !== cancellingAppointment.id));
      setAlert({ isOpen: true, title: 'Success', message: 'Appointment cancelled successfully', type: 'success' });
      setShowCancelModal(false);
      setCancellingAppointment(null);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to cancel appointment', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAppointment = async (appointmentId: string) => {
    try {
      await deleteBooking(appointmentId);
      setAppointments(prev => prev.filter(a => a.id !== appointmentId && a._id !== appointmentId));
      setAlert({ isOpen: true, title: 'Success', message: 'Appointment removed from your list', type: 'success' });
    } catch (err) {
      console.error('Failed to remove appointment:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to remove appointment', type: 'error' });
    }
  };

  const handleDownloadReceipt = async (appointment: Appointment) => {
    try {
      const receiptElement = document.getElementById(`receipt-${appointment._id || appointment.id}`);
      if (!receiptElement) {
        setAlert({ isOpen: true, title: 'Error', message: 'Receipt not found', type: 'error' });
        return;
      }

      const canvas = await html2canvas(receiptElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `appointment-receipt-${appointment.tokenNumber || 'unknown'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download receipt:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to download receipt', type: 'error' });
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return dateStr;
    }
  };

  const isUpcoming = (dateStr: string) => {
    try {
      const appointmentDate = new Date(dateStr);
      return appointmentDate > new Date();
    } catch {
      return false;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">View all appointments you have booked</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            All ({appointments.filter(a => a.status !== 'Cancelled').length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            Upcoming ({appointments.filter(a => isAppointmentUpcoming(a.appointmentDate, a.appointmentTime)).length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            Past ({appointments.filter(a => !isAppointmentUpcoming(a.appointmentDate, a.appointmentTime) && a.status !== 'Cancelled').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'cancelled'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            Cancelled ({appointments.filter(a => a.status === 'Cancelled').length})
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAppointments.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' ? 'Book your first appointment with a clinic' : 'You have no appointments in this category'}
            </p>
            <button
              onClick={() => navigate('/directory')}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Book an Appointment
            </button>
          </div>
        )}

        {/* Appointments List */}
        {!loading && filteredAppointments.length > 0 && (
          <div className="space-y-4">
            {filteredAppointments.map(appointment => {
              const upcoming = isAppointmentUpcoming(appointment.appointmentDate, appointment.appointmentTime);
              const clinicName = getClinicName(appointment.clinicId, appointment.clinicDetails);
              const doctorName = getDoctorName(appointment.doctorId, appointment.doctorDetails);
              const isCancelled = appointment.status === 'Cancelled';
              const cancelledByUser = appointment.cancelledBy === 'user';
              const cancelledByClinic = appointment.cancelledBy === 'clinic';
              
              // Debug logging
              console.log(`Appointment: ${appointment.patientName}, Upcoming: ${upcoming}, Cancelled: ${isCancelled}, Date: ${appointment.appointmentDate}, Time: ${appointment.appointmentTime}`);

              return (
                <div
                  key={appointment._id || appointment.id}
                  id={`receipt-${appointment._id || appointment.id}`}
                  className={`rounded-xl border transition shadow-sm hover:shadow-md ${
                    isCancelled
                      ? 'bg-gray-50 border-gray-300 opacity-75'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="p-6">
                    {/* Token Number and Status Header */}
                    <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Appointment Token</p>
                        <p className="text-3xl font-bold text-blue-600 font-mono mt-1">
                          {appointment.tokenNumber || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        {isCancelled ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                            Cancelled
                          </span>
                        ) : upcoming ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                            Past
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Clinic and Doctor Info */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Clinic</p>
                        <p className="text-lg font-bold text-gray-900">{clinicName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Doctor</p>
                        <p className="text-lg font-bold text-gray-900">{doctorName}</p>
                      </div>
                    </div>

                    {/* Date, Time, and Patient Info */}
                    <div className="grid md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Date</p>
                        <p className="text-base font-semibold text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Time</p>
                        <p className="text-base font-semibold text-gray-900">{appointment.appointmentTime}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Patient Name</p>
                        <p className="text-base font-semibold text-gray-900">{appointment.patientName}</p>
                      </div>
                    </div>

                    {/* Action Button or Cancellation Message */}
                    <div className="flex gap-3">
                      {isCancelled ? (
                        <>
                          <div className={`flex-1 rounded-lg p-4 ${
                            cancelledByClinic
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-orange-50 border border-orange-200'
                          }`}>
                            <p className={`text-sm font-semibold ${
                              cancelledByClinic
                                ? 'text-red-800'
                                : 'text-orange-800'
                            }`}>
                              {cancelledByClinic
                                ? '❌ Your appointment is cancelled by clinic'
                                : '❌ Your appointment has been cancelled'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveAppointment(appointment.id || appointment._id || '')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm whitespace-nowrap"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDownloadReceipt(appointment)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Receipt
                          </button>
                          <button
                            onClick={() => handleDeleteAppointment(appointment.id || appointment._id || '', appointment.patientName)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                          >
                            Cancel Appointment
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Action */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/directory')}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Book New Appointment
          </button>
        </div>
      </div>

      {/* Cancel Appointment Modal */}
      {showCancelModal && cancellingAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 min-h-screen">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="bg-red-50 px-8 py-6 border-b border-red-200">
              <h2 className="text-2xl font-bold text-red-600">Cancel Appointment?</h2>
              <p className="text-red-700 mt-1">This action cannot be undone</p>
            </div>

            <div className="px-8 py-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel the appointment for <strong>{cancellingAppointment.name}</strong>?
              </p>
            </div>

            <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingAppointment(null);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Keep Appointment
              </button>
              <button
                onClick={confirmCancelAppointment}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
              >
                {isProcessing ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal state={alert} onClose={() => setAlert({ ...alert, isOpen: false })} />
    </div>
  );
};

export default Appointments;
