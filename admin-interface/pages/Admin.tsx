import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertModal, { AlertState } from '../components/AlertModal';

interface ProfessionalData {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  availability: string;
  phone: string;
}

interface WorkingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not a Clinic Admin
  useEffect(() => {
    if (!user || user.role !== 'Clinic Admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // State management
  const [clinicName, setClinicName] = useState('');
  const [clinicLocation, setClinicLocation] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [professionals, setProfessionals] = useState<ProfessionalData[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: '09:00 - 18:00',
    tuesday: '09:00 - 18:00',
    wednesday: '09:00 - 18:00',
    thursday: '09:00 - 18:00',
    friday: '09:00 - 18:00',
    saturday: '10:00 - 14:00',
    sunday: 'Closed',
  });

  // Professional form state
  const [activeTab, setActiveTab] = useState<'clinic' | 'professionals' | 'services' | 'hours'>('clinic');
  const [profForm, setProfForm] = useState<ProfessionalData>({
    id: '',
    name: '',
    specialization: '',
    experience: 0,
    availability: '',
    phone: '',
  });
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'info' });

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`admin_clinic_${user?.id}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setClinicName(data.clinicName || '');
      setClinicLocation(data.clinicLocation || '');
      setLocationLat(data.locationLat || '');
      setLocationLng(data.locationLng || '');
      setServices(data.services || []);
      setProfessionals(data.professionals || []);
      setWorkingHours(data.workingHours || workingHours);
    }
  }, [user?.id]);

  // Save to localStorage
  const saveData = (updatedData: Partial<{
    clinicName: string;
    clinicLocation: string;
    locationLat: string;
    locationLng: string;
    services: string[];
    professionals: ProfessionalData[];
    workingHours: WorkingHours;
  }>) => {
    const currentData = localStorage.getItem(`admin_clinic_${user?.id}`);
    const data = currentData ? JSON.parse(currentData) : {};
    const newData = { ...data, ...updatedData };
    localStorage.setItem(`admin_clinic_${user?.id}`, JSON.stringify(newData));
  };

  // Validation functions
  const validateClinic = (): boolean => {
    const errors: Record<string, string> = {};
    if (!clinicName.trim()) errors.clinicName = 'Clinic name is required';
    if (!clinicLocation.trim()) errors.clinicLocation = 'Location is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProfessional = (): boolean => {
    const errors: Record<string, string> = {};
    if (!profForm.name.trim()) errors.name = 'Name is required';
    if (!profForm.specialization.trim()) errors.specialization = 'Specialization is required';
    if (profForm.experience < 0 || profForm.experience > 70) errors.experience = 'Experience must be between 0 and 70';
    if (!profForm.availability.trim()) errors.availability = 'Availability is required';
    if (!profForm.phone.trim()) errors.phone = 'Phone is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clinic management
  const handleSaveClinic = () => {
    if (validateClinic()) {
      saveData({ clinicName, clinicLocation, locationLat, locationLng });
      setValidationErrors({});
      setAlert({ isOpen: true, title: 'Success', message: 'Clinic details saved successfully!', type: 'success' });
    }
  };

  // Service management
  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService)) {
      const updatedServices = [...services, newService];
      setServices(updatedServices);
      saveData({ services: updatedServices });
      setNewService('');
      setValidationErrors({});
    } else {
      setValidationErrors({ newService: 'Service is required or already exists' });
    }
  };

  const handleRemoveService = (service: string) => {
    const updatedServices = services.filter(s => s !== service);
    setServices(updatedServices);
    saveData({ services: updatedServices });
  };

  // Professional management
  const handleAddProfessional = () => {
    if (validateProfessional()) {
      if (editingProfId) {
        const updatedProfessionals = professionals.map(p =>
          p.id === editingProfId ? { ...profForm, id: editingProfId } : p
        );
        setProfessionals(updatedProfessionals);
        saveData({ professionals: updatedProfessionals });
        setEditingProfId(null);
      } else {
        const newProf = { ...profForm, id: Date.now().toString() };
        const updatedProfessionals = [...professionals, newProf];
        setProfessionals(updatedProfessionals);
        saveData({ professionals: updatedProfessionals });
      }
      setProfForm({ id: '', name: '', specialization: '', experience: 0, availability: '', phone: '' });
      setValidationErrors({});
    }
  };

  const handleEditProfessional = (prof: ProfessionalData) => {
    setProfForm(prof);
    setEditingProfId(prof.id);
  };

  const handleRemoveProfessional = (id: string) => {
    const updatedProfessionals = professionals.filter(p => p.id !== id);
    setProfessionals(updatedProfessionals);
    saveData({ professionals: updatedProfessionals });
  };

  const handleCancelEdit = () => {
    setProfForm({ id: '', name: '', specialization: '', experience: 0, availability: '', phone: '' });
    setEditingProfId(null);
    setValidationErrors({});
  };

  // Working hours management
  const handleUpdateWorkingHours = (day: keyof WorkingHours, value: string) => {
    const updatedHours = { ...workingHours, [day]: value };
    setWorkingHours(updatedHours);
  };

  const handleSaveWorkingHours = () => {
    saveData({ workingHours });
    setAlert({ isOpen: true, title: 'Success', message: 'Working hours updated successfully!', type: 'success' });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLat(position.coords.latitude.toString());
          setLocationLng(position.coords.longitude.toString());
          setValidationErrors({});
        },
        () => {
          setValidationErrors({ location: 'Unable to get your location. Please enable location services.' });
        }
      );
    } else {
      setValidationErrors({ location: 'Geolocation is not supported by your browser.' });
    }
  };

  if (!user || user.role !== 'Clinic Admin') {
    return null;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Admin Header */}
      <section className="pt-12 pb-8 px-6 bg-gradient-to-b from-blue-50/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Your Clinic Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Complete control over your clinic's profile, team, and services</p>
              </div>
            </div>

            {/* Add Clinic Button */}
            <button
              onClick={() => setActiveTab('clinic')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 md:px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95 flex items-center space-x-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Clinic</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="px-6 py-8 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2 md:gap-4">
            {[
              { id: 'clinic' as const, label: 'Clinic Info', icon: '🏥' },
              { id: 'professionals' as const, label: 'Professionals', icon: '👨‍⚕️' },
              { id: 'services' as const, label: 'Services', icon: '🔧' },
              { id: 'hours' as const, label: 'Working Hours', icon: '⏰' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Clinic Info Tab */}
          {activeTab === 'clinic' && (
            <div className="frosted-glass p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Clinic Details & Profile</h2>
              </div>

              <div className="space-y-6">
                {/* Clinic Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Name *</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="e.g., HealthCare Plus, City Clinic"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                      validationErrors.clinicName
                        ? 'border-red-300 focus:ring-red-100'
                        : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                    }`}
                  />
                  {validationErrors.clinicName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.clinicName}</p>
                  )}
                </div>

                {/* Clinic Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Address *</label>
                  <textarea
                    value={clinicLocation}
                    onChange={(e) => setClinicLocation(e.target.value)}
                    placeholder="Enter your complete clinic address with landmarks"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none ${
                      validationErrors.clinicLocation
                        ? 'border-red-300 focus:ring-red-100'
                        : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                    }`}
                  />
                  {validationErrors.clinicLocation && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.clinicLocation}</p>
                  )}
                </div>

                {/* Map Integration */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 p-6 rounded-2xl border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>Map Location</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">Latitude</label>
                      <input
                        type="number"
                        value={locationLat}
                        onChange={(e) => setLocationLat(e.target.value)}
                        placeholder="e.g., 28.7041"
                        step="0.0001"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">Longitude</label>
                      <input
                        type="number"
                        value={locationLng}
                        onChange={(e) => setLocationLng(e.target.value)}
                        placeholder="e.g., 77.1025"
                        step="0.0001"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  {locationLat && locationLng && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-semibold">
                        ✓ Location set to: {locationLat}, {locationLng}
                      </p>
                    </div>
                  )}
                  {validationErrors.location && (
                    <p className="text-red-500 text-sm mb-4">{validationErrors.location}</p>
                  )}
                  <button
                    onClick={handleGetLocation}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    📍 Set Clinic Location
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveClinic}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95 mt-8"
                >
                  Update Clinic Profile
                </button>
              </div>
            </div>
          )}

          {/* Professionals Tab */}
          {activeTab === 'professionals' && (
            <div className="space-y-8">
              {/* Add/Edit Professional Form */}
              <div className="frosted-glass p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingProfId ? 'Update Professional Details' : 'Register New Staff Member'}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={profForm.name}
                      onChange={(e) => setProfForm({ ...profForm, name: e.target.value })}
                      placeholder="Dr. John Doe"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.name
                          ? 'border-red-300 focus:ring-red-100'
                          : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                      }`}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization *</label>
                    <input
                      type="text"
                      value={profForm.specialization}
                      onChange={(e) => setProfForm({ ...profForm, specialization: e.target.value })}
                      placeholder="e.g., Cardiologist, Dentist, General Physician"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.specialization
                          ? 'border-red-300 focus:ring-red-100'
                          : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                      }`}
                    />
                    {validationErrors.specialization && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.specialization}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience (Years) *</label>
                    <input
                      type="number"
                      value={profForm.experience}
                      onChange={(e) => setProfForm({ ...profForm, experience: parseInt(e.target.value) || 0 })}
                      placeholder="5"
                      min="0"
                      max="70"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.experience
                          ? 'border-red-300 focus:ring-red-100'
                          : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                      }`}
                    />
                    {validationErrors.experience && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.experience}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={profForm.phone}
                      onChange={(e) => setProfForm({ ...profForm, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.phone
                          ? 'border-red-300 focus:ring-red-100'
                          : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation Schedule *</label>
                  <textarea
                    value={profForm.availability}
                    onChange={(e) => setProfForm({ ...profForm, availability: e.target.value })}
                    placeholder="e.g., Monday to Friday: 10AM-1PM, 4PM-6PM | Saturday: 10AM-2PM"
                    rows={2}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none ${
                      validationErrors.availability
                        ? 'border-red-300 focus:ring-red-100'
                        : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                    }`}
                  />
                  {validationErrors.availability && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.availability}</p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddProfessional}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all"
                  >
                    {editingProfId ? 'Save Changes' : 'Add Staff Member'}
                  </button>
                  {editingProfId && (
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Professionals List */}
              <div className="frosted-glass p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center space-x-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-sm font-bold">
                    {professionals.length}
                  </span>
                  <span>Your Medical Team</span>
                </h3>

                {professionals.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {professionals.map(prof => (
                      <div key={prof.id} className="bg-gradient-to-br from-blue-50 to-blue-50/50 p-6 rounded-2xl border border-blue-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">{prof.name}</h4>
                            <p className="text-blue-600 font-semibold text-sm">{prof.specialization}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 text-xs font-semibold">{prof.experience} years</p>
                            <p className="text-gray-400 text-xs">Experience</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4 pb-4 border-b border-blue-200">
                          <p className="text-sm text-gray-600"><span className="font-semibold">Phone:</span> {prof.phone}</p>
                          <p className="text-sm text-gray-600"><span className="font-semibold">Available:</span> {prof.availability}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProfessional(prof)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-sm transition-all"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleRemoveProfessional(prof.id)}
                            className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg font-semibold text-sm transition-all"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <p className="text-gray-400 text-lg">No staff members registered yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Add your first doctor or staff member to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-8">
              {/* Add Service */}
              <div className="frosted-glass p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Manage Services & Treatments</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-8">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
                      placeholder="Enter a service your clinic offers"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.newService
                          ? 'border-red-300 focus:ring-red-100'
                          : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleAddService}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all whitespace-nowrap"
                  >
                    Add Service
                  </button>
                </div>

                {validationErrors.newService && (
                  <p className="text-red-500 text-sm mb-6">{validationErrors.newService}</p>
                )}

                {/* Services List */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <span className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm font-bold">
                      {services.length}
                    </span>
                    <span>Services Currently Offered</span>
                  </h3>

                  {services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.map(service => (
                        <div key={service} className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-50/50 p-4 rounded-xl border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center text-green-700">
                              ✓
                            </div>
                            <span className="font-semibold text-gray-900">{service}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveService(service)}
                            className="text-red-500 hover:text-red-700 font-bold text-lg transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <p className="text-gray-400 text-lg">No services listed yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Add services to help patients understand what your clinic offers.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Working Hours Tab */}
          {activeTab === 'hours' && (
            <div className="frosted-glass p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Operating Schedule</h2>
              </div>

              <div className="space-y-4 mb-8">
                {(Object.entries(workingHours) as [keyof WorkingHours, string][]).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-xl border border-blue-100">
                    <label className="w-24 font-semibold text-gray-900 capitalize text-sm md:text-base">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                    <input
                      type="text"
                      value={hours}
                      onChange={(e) => handleUpdateWorkingHours(day, e.target.value)}
                      placeholder="e.g., 09:00 AM - 06:00 PM"
                      className="flex-1 px-4 py-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 font-semibold text-gray-700"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveWorkingHours}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95"
              >
                Update Operating Hours
              </button>

              {/* Information Box */}
              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                <p className="text-sm text-blue-900 font-semibold mb-2">💡 How to Set Your Hours:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Regular hours: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">09:00 AM - 06:00 PM</code></li>
                  <li>Closed day: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">Closed</code></li>
                  <li>Split schedule: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">10:00 AM - 01:00 PM, 03:00 PM - 06:00 PM</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
      <AlertModal state={alert} onClose={() => setAlert({ ...alert, isOpen: false })} />
    </div>
  );
};

export default Admin;
