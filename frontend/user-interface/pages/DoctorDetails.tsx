
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDoctors } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DoctorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getDoctors().then(list => {
      if (!mounted) return;
      const found = list.find((d: any) => (d._id?.toString?.() === id) || d.id === id);
      setDoctor(found || null);
      if (!found) setError(true);
      setLoading(false);
    }).catch(() => {
      if (mounted) {
        setError(true);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="frosted-glass p-6 md:p-10 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
            </div>
            <div className="h-12 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return <div className="text-center py-20 text-gray-500">Doctor not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-4">
        <Link to={`/clinic/${doctor.clinicId}`} className="inline-flex items-center text-gray-500 hover:text-blue-700 transition-colors text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Clinic
        </Link>
      </div>

      <div className="frosted-glass p-6 md:p-10 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Photo */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-blue-100 overflow-hidden flex-shrink-0">
              {doctor.image ? (
                <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
              ) : (
                doctor.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Center: Info */}
          <div className="md:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{doctor.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${doctor.active ? 'bg-green-500' : 'bg-red-500'}`}>
                {doctor.active ? 'Available' : 'Not Available'}
              </span>
            </div>
            <p className="text-lg text-blue-600 font-semibold mb-4">{doctor.specialty || 'General Practitioner'}</p>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Experience</p>
                <p className="text-gray-700 font-medium">{doctor.experience || '0'} years</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Previously Worked</p>
                <p className="text-gray-700 font-medium">{doctor.previouslyWorked || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Associated With</p>
                <Link to={`/clinic/${doctor.clinicId}`} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                  {doctor.clinicName || 'Clinic'}
                </Link>
              </div>
              {!doctor.active && doctor.workingDays && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Working Days</p>
                  <p className="text-gray-700 font-medium">{doctor.workingDays}</p>
                </div>
              )}
              {doctor.workingHours && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Working Hours</p>
                  <p className="text-gray-700 font-medium">{doctor.workingHours}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Contact & Action */}
          <div className="md:col-span-1 flex flex-col justify-between">
            {doctor.email && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Email</p>
                <a href={`mailto:${doctor.email}`} className="text-blue-600 hover:text-blue-800 transition-colors text-sm break-all">
                  {doctor.email}
                </a>
              </div>
            )}
            
            <div>
              {user ? (
                doctor?.active ? (
                  <Link 
                    to={`/book/${doctor.id}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-center font-bold shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                  >
                    Book Appointment
                  </Link>
                ) : (
                  <button
                    className="block w-full bg-gray-400 text-white py-3 rounded-xl text-center font-bold shadow-lg shadow-gray-100 transition-all text-sm cursor-not-allowed"
                    disabled
                    title="Doctor is not available for booking"
                  >
                    Not Available for Booking
                  </button>
                )
              ) : (
                <Link 
                  to="/login"
                  className="block w-full bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-xl text-center font-bold shadow-lg shadow-gray-100 transition-all text-sm cursor-not-allowed"
                  title="Please login to book an appointment"
                >
                  Login to Book
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500 text-sm leading-relaxed italic">
            "Dedicated to providing patient-centered care and the latest medical advancements to ensure optimal health outcomes for every individual."
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetails;
