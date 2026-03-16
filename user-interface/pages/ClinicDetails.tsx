import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClinics, getDoctors, getClinicReviews, createClinicReview, ClinicReview } from '../services/api';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';

const ClinicDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [clinic, setClinic] = useState<any | null>(null);
  const [clinicDoctors, setClinicDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const { user } = useAuth();
  const [reviews, setReviews] = useState<ClinicReview[]>([]);
  const [newReviewRating, setNewReviewRating] = useState<number>(0);
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const clinics = await getClinics();
        const found = clinics.find((c: any) => (c._id?.toString?.() === id) || c.id === id);
        if (!mounted) return;
        setClinic(found || null);
        if (!found) {
          setError(true);
          setLoading(false);
          return;
        }
        const doctors = await getDoctors();
        if (!mounted) return;
        const clinicIdToMatch = found?._id?.toString?.() || found?.id || id || '';
        const filtered = doctors.filter((d: any) => {
          const docClinicId = d?.clinicId?.toString?.() || String(d?.clinicId || '');
          return docClinicId === clinicIdToMatch;
        });
        setClinicDoctors(filtered);
        
        try {
          const clinicReviews = await getClinicReviews(clinicIdToMatch);
          if (mounted) setReviews(clinicReviews);
        } catch (err) {
          console.error('Failed to load reviews:', err);
        }

        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // Get unique specialties from clinic doctors
  const specialties = useMemo(() => {
    const specs = new Set(
      clinicDoctors
        .filter(d => d.specialty)
        .map(d => d.specialty.trim())
    );
    return Array.from(specs).sort();
  }, [clinicDoctors]);

  // Filter doctors by specialty
  const filteredDoctors = useMemo(() => {
    if (!selectedSpecialty) {
      return clinicDoctors;
    }
    return clinicDoctors.filter(d => 
      (d.specialty || '').toLowerCase() === selectedSpecialty.toLowerCase()
    );
  }, [clinicDoctors, selectedSpecialty]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReviewError('You must be logged in to leave a review.');
      return;
    }
    if (newReviewRating < 0.5) {
      setReviewError('Please select a rating of at least 0.5 stars.');
      return;
    }
    try {
      setIsSubmittingReview(true);
      setReviewError('');
      const clinicIdToUse = clinic.id || clinic._id;
      const res = await createClinicReview(clinicIdToUse, {
        rating: newReviewRating,
        comment: newReviewComment,
        userId: user.id || user._id,
        userName: user.name || 'Anonymous'
      });
      
      setClinic((prev: any) => prev ? { ...prev, rating: res.rating, reviewCount: res.reviewCount } : prev);
      
      const updatedReviews = await getClinicReviews(clinicIdToUse);
      setReviews(updatedReviews);
      
      setNewReviewRating(0);
      setNewReviewComment('');
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="frosted-glass p-8 md:p-12 rounded-3xl shadow-sm">
              <div className="h-12 bg-gray-200 rounded w-64 animate-pulse mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-80 animate-pulse mb-6"></div>
              <div className="space-y-3 mb-8">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="h-64 bg-gray-200 rounded-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return <div className="text-center py-20 text-gray-500">Clinic not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link to="/directory" className="inline-flex items-center text-gray-500 hover:text-blue-700 transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Directory
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="frosted-glass p-8 md:p-12 rounded-3xl shadow-sm">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">
                {clinic.type || 'Clinic'}
              </span>
              <span className="text-gray-400 flex items-center text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {clinic.location}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{clinic.name}</h1>
            <div className="flex items-center gap-2 mb-6">
              <StarRating rating={clinic.rating || 0} size="md" />
              <span className="text-sm font-medium text-gray-500">
                {clinic.rating || 0} ({clinic.reviewCount || 0} {(clinic.reviewCount === 1) ? 'review' : 'reviews'})
              </span>
            </div>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">{clinic.description || 'Providing exceptional healthcare services with a focus on patient comfort and professional excellence.'}</p>

            <div className="border-t-2 border-b-2 border-gray-200 py-8 mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-8">Specialized Services</h2>
              <div className="flex flex-wrap gap-3">
                {(clinic.specialties || []).map((service: string) => (
                  <span key={service} className="px-5 py-2.5 rounded-2xl bg-white border border-gray-100 text-gray-700 shadow-sm text-sm font-medium">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="frosted-glass p-8 md:p-12 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Medical Professionals</h2>
              {specialties.length > 0 && (
                <div className="w-64">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Filter by Specialty</label>
                  <div className="relative">
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 transition-all appearance-none cursor-pointer text-gray-700 text-sm"
                    >
                      <option value="">All Specialties ({clinicDoctors.length})</option>
                      {specialties.map(specialty => {
                        const count = clinicDoctors.filter(d => (d.specialty || '').toLowerCase() === specialty.toLowerCase()).length;
                        return (
                          <option key={specialty} value={specialty}>
                            {specialty} ({count})
                          </option>
                        );
                      })}
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>
              )}
            </div>
            {filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredDoctors.map(doctor => (
                  <Link 
                    key={doctor.id} 
                    to={`/doctor/${doctor.id}`}
                    className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all group"
                  >
                    {doctor.image && (
                      <div className="mb-4">
                        <img src={doctor.image} alt={doctor.name} className="w-full h-40 object-cover rounded-lg" />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700">{doctor.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${doctor.active ? 'bg-green-500' : 'bg-red-500'}`}>
                        {doctor.active ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 font-medium mb-2">{doctor.specialty || 'General'}</p>
                    {doctor.email && (
                      <p className="text-xs text-gray-500 mb-2">{doctor.email}</p>
                    )}
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{doctor.experience || '0'} Years Experience</p>
                    {!doctor.active && doctor.workingDays && (
                      <p className="text-xs text-gray-500 mt-2"><span className="font-semibold">Days:</span> {doctor.workingDays}</p>
                    )}
                    {doctor.workingHours && (
                      <p className="text-xs text-gray-500"><span className="font-semibold">Hours:</span> {doctor.workingHours}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">{selectedSpecialty ? `No doctors found with ${selectedSpecialty} specialty.` : 'No medical professionals added yet.'}</p>
                {selectedSpecialty && (
                  <button 
                    onClick={() => setSelectedSpecialty('')}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="frosted-glass p-8 md:p-12 rounded-3xl shadow-sm mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Patient Reviews</h2>
            
            <div className="mb-10 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
              {reviewError && <p className="text-red-500 text-sm mb-4">{reviewError}</p>}
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <StarRating 
                    rating={newReviewRating} 
                    interactive={true} 
                    onRatingChange={setNewReviewRating} 
                    size="lg" 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    value={newReviewComment}
                    onChange={e => setNewReviewComment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
                    rows={3}
                    placeholder="Share your experience (optional)..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !user}
                  className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${isSubmittingReview || !user ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-50'}`}
                >
                  {isSubmittingReview ? 'Submitting...' : !user ? 'Login to Review' : 'Submit Review'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900">{review.userName}</div>
                      <div className="text-xs text-gray-500">{new Date(review.createdAt || '').toLocaleDateString()}</div>
                    </div>
                    <div className="mb-3">
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && <p className="text-gray-700 text-sm">{review.comment}</p>}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>

        </div>

        <div className="space-y-8">
          <div className="frosted-glass p-8 rounded-3xl shadow-sm sticky top-28">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Clinic Information</h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clinic Address</p>
                <p className="text-gray-700 leading-relaxed font-medium">{clinic.address || clinic.location || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Working Hours</p>
                <div className="flex items-center text-gray-700 font-medium">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {clinic.workingHours || clinic.timings || 'Not specified'}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                <p className="text-gray-700 font-medium">{clinic.phone || '—'}</p>
                <p className="text-gray-500 text-sm">{clinic.email || '—'}</p>
              </div>
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-50 transition-all mt-4 inline-block text-center cursor-pointer">
                  Call for Inquiry
                </a>
              )}
              {!clinic.phone && (
                <button disabled className="w-full bg-gray-300 text-gray-500 py-4 rounded-2xl font-bold shadow-lg shadow-gray-50 transition-all mt-4 cursor-not-allowed">
                  Call for Inquiry
                </button>
              )}
              <p className="text-center text-xs text-gray-400 mt-4">
                Verify timings before visiting the clinic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetails;
