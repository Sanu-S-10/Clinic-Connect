
import React, { useEffect, useState, useMemo } from 'react';
import { getClinics, getDoctors } from '../services/api';
import { normalizeSpecialty, getUniqueCanonicalSpecialties } from '../utils/specialtyMapping';
import ClinicCard from '../components/ClinicCard';

const Directory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [clinics, setClinics] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getClinics().then((data: any[]) => {
        console.log('Clinics fetched:', data);
        if (mounted) setClinics(data.map(c => ({ ...c, id: c._id?.toString?.() || c.id })));
      }),
      getDoctors().then((data: any[]) => {
        console.log('Doctors fetched:', data);
        if (mounted) setDoctors(data);
      })
    ]).then(() => {
      if (mounted) setLoading(false);
    }).catch((err) => {
      console.error('Failed to fetch data:', err);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const filteredClinics = useMemo(() => {
    let filtered = clinics;

    // Filter by search query
    filtered = filtered.filter(clinic => {
      const matchesSearch = (clinic.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(clinic => clinic.location?.trim() === selectedLocation);
    }

    // Filter by doctor specialty
    if (selectedSpecialty) {
      const normalizedSelectedSpecialty = normalizeSpecialty(selectedSpecialty);
      const clinicIdsWithSpecialty = new Set(
        doctors
          .filter(doctor => {
            const docClinicId = doctor?.clinicId?.toString?.() || String(doctor?.clinicId || '');
            const normalizedDocSpecialty = normalizeSpecialty(doctor.specialty || '');
            return normalizedDocSpecialty === normalizedSelectedSpecialty;
          })
          .map(doctor => {
            const docClinicId = doctor?.clinicId?.toString?.() || String(doctor?.clinicId || '');
            return docClinicId;
          })
      );

      filtered = filtered.filter(clinic => {
        const clinicId = clinic._id?.toString?.() || clinic.id;
        return clinicIdsWithSpecialty.has(clinicId);
      });
    }

    return filtered;
  }, [clinics, doctors, searchQuery, selectedLocation, selectedSpecialty]);

  // Get unique canonical specialties from doctors
  const specialties = useMemo(() => {
    const allSpecialties = doctors
      .filter(d => d.specialty)
      .map(d => d.specialty);
    return getUniqueCanonicalSpecialties(allSpecialties);
  }, [doctors]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <section className="pt-12 pb-20 px-6 bg-gray-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="frosted-glass p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-white relative z-10 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Find Clinics Near You</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Search by Clinic Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border-2 border-gray-200 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 transition-all text-gray-700"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Filter by Location</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </span>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white border-2 border-gray-200 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 transition-all appearance-none cursor-pointer text-gray-700"
                  >
                    <option value="">All Locations</option>
                    {Array.from(new Set(clinics.map(c => c.location?.trim()).filter(Boolean))).sort().map(loc => (
                        <option key={loc as string} value={loc as string}>{loc as string}</option>
                      ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Filter by Doctor Specialty</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </span>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white border-2 border-gray-200 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 transition-all appearance-none cursor-pointer text-gray-700"
                  >
                    <option value="">All Specialties</option>
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                {selectedLocation ? `Clinics in ${selectedLocation.split(',')[0]}` : 'Available Clinics'}
                {!loading && (
                  <span className="ml-4 text-sm font-bold text-blue-100 bg-blue-600 px-3 py-1 rounded-full align-middle">
                    {filteredClinics.length}
                  </span>
                )}
              </h3>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 h-48 animate-pulse flex flex-col justify-between">
                    <div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                  </div>
                ))}
              </div>
            ) : filteredClinics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredClinics.map(clinic => (
                  <ClinicCard key={clinic.id} clinic={clinic} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 frosted-glass rounded-[2.5rem] border border-dashed border-gray-200">
                <p className="text-gray-400 text-lg font-light">No matches found for your current filters.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedLocation(''); setSelectedSpecialty(''); }}
                  className="mt-6 text-blue-600 hover:text-blue-800 font-bold text-sm uppercase tracking-widest"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Directory;
