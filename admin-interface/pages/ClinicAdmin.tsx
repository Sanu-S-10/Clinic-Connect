import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDoctors, getBookings, createDoctor, updateDoctor, deleteDoctor, createBooking, updateBooking, getClinicProfile, updateClinicProfile, fixDoctorClinicId, getAppointmentsByClinic, cancelBooking, cancelAppointmentByClinic, deleteBooking, deleteClinic } from '../services/api';
import html2canvas from 'html2canvas';
import AlertModal, { AlertState } from '../components/AlertModal';
import { getUniqueCanonicalSpecialties, specialtyMapping } from '../utils/specialtyMapping';

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  clinicId?: string;
  experience?: string;
  previouslyWorked?: string;
  email?: string;
  rating?: number;
  image?: string;
  clinicName?: string;
};

type LocalDoctor = Doctor & {
  specialties: string[];
  active: boolean;
  workingDays?: string;
  workingHours?: string;
};

type Appointment = {
  id: string;
  patientName: string;
  patientEmail?: string;
  doctorId: string;
  appointmentDate: string; // yyyy-mm-dd
  appointmentTime: string; // HH:MM
};

type LocalAppointment = Appointment & {
  date: string;
  time: string;
  status: 'Booked' | 'Approved' | 'Cancelled' | 'Completed' | 'Rescheduled';
  notes?: string;
  patientPhone?: string;
  tokenNumber?: string;
};

const ClinicAdmin: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || user.role !== 'Clinic Admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Use clinicId when available (clinic admin user), otherwise fall back to user id
  const uid = (user as any)?.clinicId || (user as any)?.clinic || user?.id || user?._id || 'anon';

  // State backed by API
  const [profile, setProfile] = useState<any>(() => ({}));
  const [clinicProfile, setClinicProfile] = useState<any>(null);
  const [doctors, setDoctors] = useState<LocalDoctor[]>([]);
  const [appointments, setAppointments] = useState<LocalAppointment[]>([]);

  // Load doctors and appointments from server
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [dres, clinicData] = await Promise.all([getDoctors(), getClinicProfile(uid)]);
        if (!mounted) return;
        
        // Get clinic's actual _id for filtering
        const clinicId = clinicData._id || clinicData.id || uid;
        
        // Normalize _id to id and FILTER by clinicId
        const mappedDoctors: LocalDoctor[] = dres
          .filter((x: any) => {
            const docClinicId = x.clinicId?.toString?.() || x.clinicId;
            const clinicIdToMatch = clinicId?.toString?.() || clinicId;
            return docClinicId === clinicIdToMatch;
          })
          .map((x: any) => ({ 
            id: x._id || x.id || x._id?.toString?.() || Date.now().toString(), 
            name: x.name || '', 
            specialty: x.specialty || '', 
            specialties: [x.specialty || ''], 
            clinicId: x.clinicId || '', 
            experience: x.experience || '', 
            previouslyWorked: x.previouslyWorked || '', 
            email: x.email || '', 
            image: x.image, 
            clinicName: x.clinicName || '', 
            workingDays: x.workingDays || '', 
            workingHours: x.workingHours || '',
            active: x.active ?? true 
          }));
        setDoctors(mappedDoctors);
        
        // Set clinic profile
        setClinicProfile(clinicData);
        
        // Load clinic's appointments using getAppointmentsByClinic
        try {
          const appointments = await getAppointmentsByClinic(clinicId);
          const mappedBookings: LocalAppointment[] = appointments.map((b: any) => ({ 
            id: b._id || b.id || b._id?.toString?.() || Date.now().toString(), 
            patientName: b.patientName || b.patient || '', 
            patientEmail: b.patientEmail || '', 
            doctorId: b.doctorId, 
            appointmentDate: b.appointmentDate || b.date || '', 
            appointmentTime: b.appointmentTime || b.time || '', 
            date: b.appointmentDate || b.date || '', 
            time: b.appointmentTime || b.time || '', 
            status: b.status || 'Booked', 
            notes: b.notes || '',
            patientPhone: b.patientPhone || b.phone || '',
            tokenNumber: b.tokenNumber || b.token || ''
          } as LocalAppointment));
          setAppointments(mappedBookings);
        } catch (err) {
          console.error('Failed to fetch clinic appointments:', err);
        }
      } catch (err) {
        console.error('Failed loading admin data', err);
      }
    }
    if (uid && uid !== 'anon') {
      load();
    }
    return () => { mounted = false; };
  }, [uid]);

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard'|'doctors'|'appointments'|'schedule'|'profile'>('dashboard');
  const [showPreviousAppointments, setShowPreviousAppointments] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<LocalDoctor | null>(null);
  const [showSpecialtySuggestions, setShowSpecialtySuggestions] = useState(false);
  const [specialtySuggestions, setSpecialtySuggestions] = useState<string[]>([]);
  const [highlightedSpecialtyIndex, setHighlightedSpecialtyIndex] = useState(-1);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [showDeleteClinicModal, setShowDeleteClinicModal] = useState(false);
  const [deletingClinic, setDeletingClinic] = useState(false);
  const [filter, setFilter] = useState({ q: '', status: 'All', doctorId: 'All', date: '' });
  const [alert, setAlert] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'info' });

  // Overview numbers
  const totalDoctors = doctors.length;
  const totalAppointments = appointments.length;
  const todaysAppointments = appointments.filter(a => a.date === new Date().toISOString().slice(0,10)).length;
  const pendingAppointments = appointments.filter(a => a.status === 'Booked').length;

  const appointmentTrends = useMemo(() => {
    // simple last-7-days counts
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      days[key] = 0;
    }
    appointments.forEach(a => { if (a.date in days) days[a.date]++; });
    return Object.entries(days).map(([k,v]) => ({ date: k, count: v }));
  }, [appointments]);

  const allSpecialtyOptions = useMemo(() => {
    const predefined = Object.values(specialtyMapping);
    const existingDoctorSpecialties = doctors.map(d => d.specialty);
    return Array.from(
      new Set(
        [...predefined, ...existingDoctorSpecialties]
          .map(spec => spec?.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [doctors]);

  // Doctor CRUD
  const openAddDoctor = () => { setEditingDoctor({ id: '', name: '', specialty: '', specialties: [], clinicId: '', experience: '', previouslyWorked: '', email: '', image: undefined, clinicName: clinicProfile?.name || '', workingDays: '', workingHours: '', active: true } as LocalDoctor); setShowDoctorModal(true); };
  
  const handleSpecialtyInput = (value: string) => {
    setEditingDoctor(d => d && { ...d, specialty: value, specialties: [value] } as LocalDoctor);
    
    if (value.trim()) {
      const filtered = allSpecialtyOptions.filter(spec =>
        spec.toLowerCase().includes(value.toLowerCase())
      );
      setSpecialtySuggestions(filtered);
      setShowSpecialtySuggestions(filtered.length > 0);
      setHighlightedSpecialtyIndex(filtered.length > 0 ? 0 : -1);
    } else {
      setShowSpecialtySuggestions(false);
      setSpecialtySuggestions([]);
      setHighlightedSpecialtyIndex(-1);
    }
  };
  
  const handleSelectSpecialty = (specialty: string) => {
    setEditingDoctor(d => d && { ...d, specialty, specialties: [specialty] } as LocalDoctor);
    setShowSpecialtySuggestions(false);
    setSpecialtySuggestions([]);
    setHighlightedSpecialtyIndex(-1);
  };

  const handleSpecialtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSpecialtySuggestions || specialtySuggestions.length === 0) {
      if (e.key === 'ArrowDown' && editingDoctor?.specialty?.trim()) {
        const filtered = allSpecialtyOptions.filter(spec =>
          spec.toLowerCase().includes(editingDoctor.specialty.toLowerCase())
        );
        setSpecialtySuggestions(filtered);
        setShowSpecialtySuggestions(filtered.length > 0);
        setHighlightedSpecialtyIndex(filtered.length > 0 ? 0 : -1);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSpecialtyIndex(prev => (prev + 1) % specialtySuggestions.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSpecialtyIndex(prev => (prev <= 0 ? specialtySuggestions.length - 1 : prev - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const indexToUse = highlightedSpecialtyIndex >= 0 ? highlightedSpecialtyIndex : 0;
      handleSelectSpecialty(specialtySuggestions[indexToUse]);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSpecialtySuggestions(false);
      setHighlightedSpecialtyIndex(-1);
    }
  };

  const handleEditDoctor = (d: LocalDoctor) => { setEditingDoctor(d); setShowDoctorModal(true); };
  const handleSaveDoctor = async (d: LocalDoctor) => {
    if (!d.name.trim()) {
      setAlert({ isOpen: true, title: 'Validation Error', message: 'Doctor name is required', type: 'error' });
      return;
    }
    try {
      // Use clinic's actual ID from profile if available
      const clinicIdToUse = clinicProfile?._id || clinicProfile?.id || uid;
      console.log('Using clinicId for doctor:', clinicIdToUse);
      
      if (d.id) {
        // update
        await updateDoctor(d.id, { name: d.name, specialty: d.specialty, clinicId: d.clinicId, experience: d.experience, previouslyWorked: d.previouslyWorked, email: d.email, image: (d as any).image, clinicName: clinicProfile?.name, workingDays: (d as any).workingDays, workingHours: (d as any).workingHours, active: d.active });
      } else {
        // create
        console.log('Creating doctor with clinicId:', clinicIdToUse);
        const res = await createDoctor({ name: d.name, specialty: d.specialty, clinicId: clinicIdToUse, experience: d.experience, previouslyWorked: d.previouslyWorked, email: d.email, image: (d as any).image, clinicName: clinicProfile?.name, workingDays: (d as any).workingDays, workingHours: (d as any).workingHours, active: d.active });
        console.log('Doctor created:', res);
        // ensure id is set (db returns inserted id)
        d.id = res.id?.toString?.() || d.id;
      }
      // reload doctors
      const dres: any[] = await getDoctors();
      console.log('Reloaded doctors:', dres);
      
      // Get clinic's actual ID for filtering
      const clinicId = clinicProfile?._id || clinicProfile?.id || uid;
      const clinicIdToMatch = clinicId?.toString?.() || clinicId;
      
      // Filter doctors by clinic and map them
      const mappedDoctors = dres
        .filter((x: any) => {
          const docClinicId = x.clinicId?.toString?.() || x.clinicId;
          return docClinicId === clinicIdToMatch;
        })
        .map(x => ({ 
          id: x._id?.toString?.() || x.id, 
          name: x.name || '', 
          specialty: x.specialty || '', 
          specialties: [x.specialty || ''], 
          clinicId: x.clinicId || '', 
          experience: x.experience || '', 
          previouslyWorked: x.previouslyWorked || '', 
          email: x.email || '', 
          image: x.image, 
          clinicName: x.clinicName || '', 
          workingDays: x.workingDays || '', 
          workingHours: x.workingHours || '', 
          active: x.active ?? true 
        }));
      
      // If we just created a doctor, ensure it's in the list (handles custom specialties appearing in dropdown)
      const savedDoctorId = d.id;
      if (savedDoctorId && !d.id?.startsWith?.('new') && !mappedDoctors.some(doc => doc.id === savedDoctorId)) {
        mappedDoctors.push({
          id: savedDoctorId,
          name: d.name || '',
          specialty: d.specialty || '',
          specialties: [d.specialty || ''],
          clinicId: clinicIdToUse,
          experience: d.experience || '',
          previouslyWorked: d.previouslyWorked || '',
          email: d.email || '',
          image: (d as any).image,
          clinicName: clinicProfile?.name || '',
          workingDays: (d as any).workingDays || '',
          workingHours: (d as any).workingHours || '',
          active: d.active
        });
      }
      
      setDoctors(mappedDoctors);
      setShowDoctorModal(false);
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to save doctor', type: 'error' });
    }
  };
  const handleRemoveDoctor = async (id: string) => {
    if (!window.confirm('Remove this doctor?')) return;
    try {
      await deleteDoctor(id);
      setDoctors(prev => prev.filter(d => d.id !== id));
      // Optionally mark related appointments cancelled on server - here we update local state and leave server bookings unchanged
      setAppointments(prev => prev.map(a => a.doctorId === id ? { ...a, status: 'Cancelled', notes: 'Doctor removed' } : a));
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to remove doctor', type: 'error' });
    }
  };

  const handleFixDoctorClinicId = async (doctorId: string) => {
    if (!clinicProfile || !clinicProfile._id && !clinicProfile.id) {
      setAlert({ isOpen: true, title: 'Error', message: 'Clinic profile not loaded. Please refresh the page.', type: 'error' });
      return;
    }
    const clinicId = clinicProfile._id || clinicProfile.id;
    try {
      await fixDoctorClinicId(doctorId, clinicId);
      setAlert({ isOpen: true, title: 'Success', message: 'Doctor clinic ID fixed! Please refresh to see doctors in the clinic details page.', type: 'success' });
      // Reload doctors
      const dres: any[] = await getDoctors();
      const clinicIdToMatch = clinicId?.toString?.() || clinicId;
      setDoctors(dres
        .filter((x: any) => {
          const docClinicId = x.clinicId?.toString?.() || x.clinicId;
          return docClinicId === clinicIdToMatch;
        })
        .map((x: any) => ({ 
          id: x._id?.toString?.() || x.id, 
          name: x.name || '', 
          specialty: x.specialty || '', 
          specialties: [x.specialty || ''], 
          clinicId: x.clinicId || '', 
          experience: x.experience || '', 
          previouslyWorked: x.previouslyWorked || '', 
          email: x.email || '', 
          image: x.image, 
          clinicName: x.clinicName || '', 
          workingDays: x.workingDays || '', 
          workingHours: x.workingHours || '',
          active: x.active ?? true 
        })));
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to fix doctor clinic ID', type: 'error' });
    }
  };
  const toggleDoctorActive = async (id: string) => {
    try {
      const doc = doctors.find(d => d.id === id);
      if (!doc) return;
      const updated = { ...doc, active: !doc.active };
      await updateDoctor(id, updated);
      setDoctors(prev => prev.map(d => d.id === id ? updated : d));
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to toggle doctor status', type: 'error' });
    }
  };

  // Clinic profile actions
  const handleEditProfile = () => {
    if (clinicProfile) {
      setEditingProfile({ ...clinicProfile });
      setShowProfileEdit(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingProfile.name.trim()) {
      setAlert({ isOpen: true, title: 'Validation Error', message: 'Clinic name is required', type: 'error' });
      return;
    }
    try {
      await updateClinicProfile(uid, {
        name: editingProfile.name,
        email: editingProfile.email,
        phone: editingProfile.phone,
        address: editingProfile.address,
        location: editingProfile.location,
        specialties: editingProfile.specialties || [],
        description: editingProfile.description,
        workingHours: editingProfile.workingHours || ''
      });
      // Reload clinic profile
      const updated = await getClinicProfile(uid);
      setClinicProfile(updated);
      setShowProfileEdit(false);
      setAlert({ isOpen: true, title: 'Success', message: 'Clinic profile updated successfully', type: 'success' });
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to update clinic profile', type: 'error' });
    }
  };

  // Delete clinic
  const handleDeleteClinic = async () => {
    try {
      setDeletingClinic(true);
      const clinicId = clinicProfile?._id || clinicProfile?.id || uid;
      await deleteClinic(clinicId);
      setAlert({ isOpen: true, title: 'Success', message: 'Clinic deleted successfully. Redirecting to home...', type: 'success' });
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch (err) {
      setAlert({ isOpen: true, title: 'Error', message: err instanceof Error ? err.message : 'Failed to delete clinic', type: 'error' });
    } finally {
      setDeletingClinic(false);
      setShowDeleteClinicModal(false);
    }
  };

  // Appointment actions
  const handleApprove = async (id: string) => {
    try {
      await updateBooking(id, {});
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved' } : a));
    } catch (err) { console.error(err); setAlert({ isOpen: true, title: 'Error', message: 'Failed to approve', type: 'error' }); }
  };
  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointmentByClinic(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
      setAlert({ isOpen: true, title: 'Success', message: 'Appointment cancelled successfully', type: 'success' });
    } catch (err) { 
      console.error(err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to cancel appointment', type: 'error' });
    }
  };

  const handleDownloadReceipt = async (appointment: LocalAppointment) => {
    try {
      const receiptElement = document.getElementById(`receipt-${appointment.id}`);
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

  const handleRemoveAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this appointment from the dashboard? This action cannot be undone.')) return;
    try {
      await deleteBooking(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      setAlert({ isOpen: true, title: 'Success', message: 'Appointment removed successfully', type: 'success' });
    } catch (err) { 
      console.error(err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to remove appointment', type: 'error' });
    }
  };

  const handleReschedule = async (id: string, date: string, time: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    const conflict = appointments.find(a => a.id !== id && a.doctorId === appt.doctorId && a.date === date && a.time === time && a.status !== 'Cancelled');
    if (conflict) return setAlert({ isOpen: true, title: 'Error', message: 'Time slot already booked for this doctor', type: 'error' });
    try {
      await updateBooking(id, { appointmentDate: date, appointmentTime: time });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, date, time, status: 'Rescheduled' } : a));
    } catch (err) { console.error(err); setAlert({ isOpen: true, title: 'Error', message: 'Failed to reschedule', type: 'error' }); }
  };

  // Filters
  const visibleAppointments = appointments.filter(a => {
    if (filter.status !== 'All' && filter.status !== a.status) return false;
    if (filter.doctorId !== 'All' && filter.doctorId !== a.doctorId) return false;
    if (filter.date && filter.date !== a.date) return false;
    if (filter.q && !a.patientName.toLowerCase().includes(filter.q.toLowerCase())) return false;
    return true;
  });

  // Simple add appointment modal for demo / admin scheduling
  const [showApptModal, setShowApptModal] = useState(false);
  const [newAppt, setNewAppt] = useState<Partial<LocalAppointment>>({ patientName: '', patientEmail: '', patientPhone: '', doctorId: '', date: '', time: '', status: 'Booked' });
  const handleCreateAppt = async () => {
    if (!newAppt.patientName || !newAppt.doctorId || !newAppt.date || !newAppt.time) {
      setAlert({ isOpen: true, title: 'Validation Error', message: 'Missing fields', type: 'error' });
      return;
    }
    const conflict = appointments.find(a => a.doctorId === newAppt.doctorId && a.date === newAppt.date && a.time === newAppt.time && a.status !== 'Cancelled');
    if (conflict) {
      setAlert({ isOpen: true, title: 'Error', message: 'Time slot already booked for this doctor', type: 'error' });
      return;
    }
    try {
      const payload = { clinicId: uid, doctorId: newAppt.doctorId, patientName: newAppt.patientName, patientEmail: newAppt.patientEmail, patientPhone: (newAppt as any).patientPhone, appointmentDate: newAppt.date, appointmentTime: newAppt.time };
      const res = await createBooking(payload as any);
      // reload bookings
      const bres: any[] = await getBookings();
      setAppointments(bres.map(b => ({ id: b._id?.toString?.() || b.id, patientName: b.patientName, patientEmail: b.patientEmail, doctorId: b.doctorId, appointmentDate: b.appointmentDate, appointmentTime: b.appointmentTime, date: b.appointmentDate || b.date, time: b.appointmentTime || b.time, status: b.status || 'Booked', notes: b.notes || '', patientPhone: b.patientPhone || b.phone || '', tokenNumber: b.tokenNumber || b.token || '' } as LocalAppointment)));
      setShowApptModal(false);
      setNewAppt({ patientName: '', patientEmail: '', patientPhone: '', doctorId: '', date: '', time: '', status: 'Booked' });
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to create appointment', type: 'error' });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 hidden md:block">
            <div className="bg-white rounded-2xl p-4 shadow">
              <h3 className="font-bold text-lg">Clinic Admin</h3>
              <p className="text-sm text-gray-500 mt-1">{user.name}</p>
              <nav className="mt-6 space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'doctors', label: 'Doctors' },
                  { id: 'appointments', label: 'Appointments' },
                  { id: 'schedule', label: 'Schedule' },
                  { id: 'profile', label: 'Profile' },
                ].map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full text-left px-3 py-2 rounded-lg ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    {item.label}
                  </button>
                ))}
                <button onClick={() => setShowDeleteClinicModal(true)} className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50">Delete Clinic</button>
                <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50">Logout</button>
              </nav>
            </div>
          </aside>

          <div className="flex-1">
            {/* Top header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Clinic Admin Dashboard</h1>
              <div className="flex items-center gap-3">
                <button onClick={openAddDoctor} className="bg-green-600 text-white px-4 py-2 rounded-lg">Add Doctor</button>
                <button onClick={() => setShowApptModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Create Appointment</button>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Doctors</p>
                    <p className="text-2xl font-bold">{totalDoctors}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Appointments</p>
                    <p className="text-2xl font-bold">{totalAppointments}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Today's Appointments</p>
                    <p className="text-2xl font-bold">{todaysAppointments}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Pending Appointments</p>
                    <p className="text-2xl font-bold">{pendingAppointments}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold mb-3">Appointment Trends (last 7 days)</h3>
                  <div className="w-full h-28 flex items-end gap-2">
                    {appointmentTrends.map((d, i) => (
                      <div key={d.date} className="flex-1">
                        <div className="h-full flex items-end">
                          <div className="mx-auto bg-blue-500 rounded-t" style={{ height: `${Math.max(6, d.count * 12)}px`, width: '24px' }} />
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-1">{d.date.slice(5)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold">Doctors</h3>
                  {doctors.length === 0 ? <p className="text-gray-400 mt-3">No doctors yet.</p> : (
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      {doctors.map(d => (
                        <div key={d.id} className="p-3 rounded-lg border flex items-center justify-between">
                          <div>
                            <p className="font-bold">{d.name} <span className="text-sm text-gray-500">{d.active ? '' : '(Inactive)'}</span></p>
                            <p className="text-sm text-gray-500">{d.specialty}</p>
                            <p className="text-sm text-gray-400">{d.email}</p>
                            {d.clinicId !== (clinicProfile?._id || clinicProfile?.id) && (
                              <p className="text-xs text-red-600 mt-1">⚠️ Wrong clinic ID - click Fix</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => handleEditDoctor(d)} className="text-sm px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                            {d.clinicId !== (clinicProfile?._id || clinicProfile?.id) && (
                              <button onClick={() => handleFixDoctorClinicId(d.id)} className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded font-medium">Fix</button>
                            )}
                            <button onClick={() => toggleDoctorActive(d.id)}
                              className={`text-sm px-3 py-1 rounded font-medium ${d.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                            >{d.active ? 'Active' : 'Inactive'}</button>
                            <button onClick={() => handleRemoveDoctor(d.id)} className="text-sm px-3 py-1 bg-red-100 text-red-600 rounded">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Appointments Management</h3>
                <div className="flex gap-2 mt-3 mb-3 flex-wrap">
                  <input value={filter.q} onChange={e => setFilter(f => ({ ...f, q: e.target.value }))} placeholder="Search patient" className="px-3 py-2 border rounded w-64" />
                  <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="px-3 py-2 border rounded">
                    <option>All</option>
                    <option>Booked</option>
                    <option>Cancelled</option>
                  </select>
                  <select value={filter.doctorId} onChange={e => setFilter(f => ({ ...f, doctorId: e.target.value }))} className="px-3 py-2 border rounded">
                    <option value="All">All Doctors</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <input type="date" value={filter.date} onChange={e => setFilter(f => ({ ...f, date: e.target.value }))} className="px-3 py-2 border rounded" />
                </div>
                {visibleAppointments.length === 0 ? (
                  <p className="text-gray-500 py-8 text-center">No appointments found</p>
                ) : (
                  <div className="space-y-8">
                    {[
                      {
                        title: "Today & Upcoming Appointments",
                        data: visibleAppointments.filter(a => a.date >= new Date("2024-01-01T00:00:00Z").toISOString().slice(0, 10).replace("2024-01-01", new Date().toISOString().slice(0, 10))),
                        isCollapsible: false
                      },
                      {
                        title: "Previous Appointments",
                        data: visibleAppointments.filter(a => a.date < new Date("2024-01-01T00:00:00Z").toISOString().slice(0, 10).replace("2024-01-01", new Date().toISOString().slice(0, 10))),
                        isCollapsible: true
                      }
                    ].map((section, idx) => {
                      const isExpanded = !section.isCollapsible || showPreviousAppointments;
                      return (
                      <div key={idx} className="bg-white border rounded-lg overflow-hidden">
                        <div 
                          className={`bg-gray-50 px-4 py-3 border-b ${section.isCollapsible ? 'cursor-pointer hover:bg-gray-100 flex justify-between items-center' : ''}`}
                          onClick={() => section.isCollapsible && setShowPreviousAppointments(!showPreviousAppointments)}
                        >
                          <h4 className="font-semibold text-gray-700">{section.title} <span className="text-gray-400 text-sm ml-2">({section.data.length})</span></h4>
                          {section.isCollapsible && (
                            <span className="text-gray-500">
                              {showPreviousAppointments ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                        {isExpanded && (
                          section.data.length === 0 ? (
                            <p className="text-gray-500 py-6 text-center text-sm">No appointments in this category</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                              <thead className="text-left text-xs text-gray-500 bg-gray-50">
                                <tr>
                                  <th className="px-3 py-3 font-semibold">Patient</th>
                                  <th className="px-3 py-3 font-semibold">Phone</th>
                                  <th className="px-3 py-3 font-semibold">Doctor</th>
                                  <th className="px-3 py-3 font-semibold">Date & Time</th>
                                  <th className="px-3 py-3 font-semibold">Token</th>
                                  <th className="px-3 py-3 font-semibold">Status</th>
                                  <th className="px-3 py-3 font-semibold">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {section.data.map(a => (
                                  <tr key={a.id} id={`receipt-${a.id}`} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                      <div className="font-medium text-gray-900">{a.patientName}</div>
                                      <div className="text-xs text-gray-500">{a.patientEmail}</div>
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="text-sm text-gray-600">{(a as any).patientPhone || '—'}</div>
                                    </td>
                                    <td className="px-3 py-2 text-gray-700">{doctors.find(d => d.id === a.doctorId)?.name || '—'}</td>
                                    <td className="px-3 py-2">
                                      <div className="text-gray-900 font-medium">{a.date}</div>
                                      <div className="text-xs text-gray-500">{a.time}</div>
                                    </td>
                                    <td className="px-3 py-2">
                                      <code className="bg-gray-100 px-2 py-1 rounded text-xs text-blue-600 font-bold">
                                        {(a as any).tokenNumber ? (a as any).tokenNumber : '—'}
                                      </code>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                                        a.status === 'Booked' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                        a.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        'bg-gray-100 text-gray-700 border border-gray-200'
                                      }`}>
                                        {a.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 flex gap-2">
                                      <button
                                        onClick={() => handleDownloadReceipt(a)}
                                        className="px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded shadow-sm hover:bg-gray-50 transition"
                                        title="Download Receipt"
                                      >
                                        ⬇️
                                      </button>
                                      {a.status !== 'Cancelled' && (
                                        <button 
                                          onClick={() => handleCancel(a.id)} 
                                          className="px-3 py-1 bg-red-50 text-red-600 font-medium text-xs rounded border border-red-200 hover:bg-red-100 transition"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                      {a.status === 'Cancelled' && (
                                        <button 
                                          onClick={() => handleRemoveAppointment(a.id)} 
                                          className="px-3 py-1 bg-gray-100 text-gray-600 font-medium text-xs rounded hover:bg-gray-200 transition"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Schedule</h3>
                <p className="text-sm text-gray-500 mt-2">Create time slots per doctor and block dates from bookings.</p>
                <p className="text-sm text-gray-400 mt-3">This demo uses simple appointment creation; use the 'Create Appointment' button to schedule.</p>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">Clinic Profile</h3>
                  {!showProfileEdit && clinicProfile && (
                    <button onClick={handleEditProfile} className="bg-blue-600 text-white px-4 py-2 rounded">Edit Profile</button>
                  )}
                </div>
                
                {!showProfileEdit && clinicProfile ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Clinic Name</label>
                        <p className="text-gray-900 mt-1">{clinicProfile.name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900 mt-1">{clinicProfile.email || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900 mt-1">{clinicProfile.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <p className="text-gray-900 mt-1">{clinicProfile.location || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Working Hours</label>
                        <p className="text-gray-900 mt-1">{clinicProfile.workingHours || 'Not set'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Address</label>
                      <p className="text-gray-900 mt-1">{clinicProfile.address || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900 mt-1">{clinicProfile.description || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Specialties</label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {clinicProfile.specialties && clinicProfile.specialties.length > 0 ? (
                          clinicProfile.specialties.map((spec: string, idx: number) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {spec}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">Not set</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : showProfileEdit && editingProfile ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Clinic Name</label>
                        <input 
                          value={editingProfile.name || ''} 
                          onChange={e => setEditingProfile(p => ({ ...p, name: e.target.value }))} 
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                        <input 
                          type="email"
                          value={editingProfile.email || ''} 
                          onChange={e => setEditingProfile(p => ({ ...p, email: e.target.value }))} 
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                        <input 
                          value={editingProfile.phone || ''} 
                          onChange={e => setEditingProfile(p => ({ ...p, phone: e.target.value }))} 
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
                        <input 
                          value={editingProfile.location || ''} 
                          onChange={e => setEditingProfile(p => ({ ...p, location: e.target.value }))} 
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                      <input 
                        value={editingProfile.address || ''} 
                        onChange={e => setEditingProfile(p => ({ ...p, address: e.target.value }))} 
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Working Hours</label>
                      <input
                        value={editingProfile.workingHours || ''}
                        onChange={e => setEditingProfile(p => ({ ...p, workingHours: e.target.value }))}
                        placeholder="e.g., Mon-Fri 09:00-17:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                      <textarea 
                        value={editingProfile.description || ''} 
                        onChange={e => setEditingProfile(p => ({ ...p, description: e.target.value }))} 
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Specialties (comma separated)</label>
                      <input 
                        value={(editingProfile.specialties || []).join(', ')} 
                        onChange={e => setEditingProfile(p => ({ ...p, specialties: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))} 
                        placeholder="e.g., Cardiology, Pediatrics, Orthopedics"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                      <button onClick={() => { setShowProfileEdit(false); setEditingProfile(null); }} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium">Cancel</button>
                      <button onClick={handleSaveProfile} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    {clinicProfile?.error ? (
                      <div className="p-4 bg-red-50 text-red-700 rounded">
                        <p className="font-medium">Error loading profile:</p>
                        <p className="text-sm mt-1">{clinicProfile.error}</p>
                        <p className="text-xs mt-2 text-gray-600">UID: {clinicProfile.id}</p>
                      </div>
                    ) : (
                      <p>Loading clinic profile...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Modal */}
      {showDoctorModal && editingDoctor && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editingDoctor.id ? 'Edit Doctor' : 'Add Doctor'}</h3>
            <div className="mt-3 grid gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Doctor Name *</label>
                <input 
                  value={editingDoctor.name} 
                  onChange={e => setEditingDoctor(d => d && { ...d, name: e.target.value } as LocalDoctor)} 
                  placeholder="Enter doctor name" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Specialty *</label>
                <div className="relative">
                  <input 
                    value={editingDoctor.specialty} 
                    onChange={e => handleSpecialtyInput(e.target.value)}
                    onKeyDown={handleSpecialtyKeyDown}
                    onFocus={() => {
                      if (editingDoctor.specialty.trim()) {
                        const filtered = allSpecialtyOptions.filter(spec =>
                          spec.toLowerCase().includes(editingDoctor.specialty.toLowerCase())
                        );
                        setSpecialtySuggestions(filtered);
                        setShowSpecialtySuggestions(filtered.length > 0);
                        setHighlightedSpecialtyIndex(filtered.length > 0 ? 0 : -1);
                      }
                    }}
                    onBlur={() => setTimeout(() => {
                      setShowSpecialtySuggestions(false);
                      setHighlightedSpecialtyIndex(-1);
                    }, 150)}
                    placeholder="e.g., Cardiology, Pediatrics" 
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  {showSpecialtySuggestions && specialtySuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 rounded-b shadow-lg z-50">
                      {specialtySuggestions.map((specialty, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setHighlightedSpecialtyIndex(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSpecialty(specialty);
                          }}
                          className={`px-3 py-2 cursor-pointer text-gray-700 text-sm border-b last:border-b-0 ${idx === highlightedSpecialtyIndex ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                        >
                          {specialty}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Work Experience</label>
                <input 
                  value={editingDoctor.experience || ''} 
                  onChange={e => setEditingDoctor(d => d && { ...d, experience: e.target.value } as LocalDoctor)} 
                  placeholder="e.g., 15 years" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Previously Worked At</label>
                <input 
                  value={editingDoctor.previouslyWorked || ''} 
                  onChange={e => setEditingDoctor(d => d && { ...d, previouslyWorked: e.target.value } as LocalDoctor)} 
                  placeholder="e.g., City Medical Center" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Doctor Email</label>
                <input 
                  type="email"
                  value={editingDoctor.email || ''} 
                  onChange={e => setEditingDoctor(d => d && { ...d, email: e.target.value } as LocalDoctor)} 
                  placeholder="doctor@example.com" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Associated With (Clinic)</label>
                <input 
                  value={clinicProfile?.name || ''} 
                  disabled
                  placeholder="Your clinic name" 
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600" 
                />
                <p className="text-xs text-gray-500 mt-1">Automatically linked to your clinic</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Doctor Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                  {(editingDoctor as any)?.image ? (
                    <div className="space-y-2">
                      <img src={(editingDoctor as any).image} alt="Doctor preview" className="w-20 h-20 rounded-full mx-auto object-cover" />
                      <p className="text-xs text-gray-500">Photo preview</p>
                      <button 
                        type="button"
                        onClick={() => setEditingDoctor(d => d && { ...d, image: undefined } as any)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setEditingDoctor(d => d && { ...d, image: event.target?.result as string } as any);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">Click to upload a doctor photo</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Working Days</label>
                <input 
                  value={editingDoctor.workingDays || ''} 
                  onChange={e => setEditingDoctor(d => d && { ...d, workingDays: e.target.value } as LocalDoctor)} 
                  placeholder="e.g., Monday to Friday" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Working Hours</label>
                <input 
                  value={editingDoctor.workingHours || ''} 
                  onChange={e => setEditingDoctor(d => d && { ...d, workingHours: e.target.value } as LocalDoctor)} 
                  placeholder="e.g., 9:00 AM - 5:00 PM" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <label className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  checked={editingDoctor.active} 
                  onChange={e => setEditingDoctor(d => d && { ...d, active: e.target.checked } as LocalDoctor)} 
                  className="rounded"
                /> 
                <span className="text-sm text-gray-700">Active (Can accept patients)</span>
              </label>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowDoctorModal(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={() => handleSaveDoctor(editingDoctor)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showApptModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="font-bold">Create Appointment</h3>
            <div className="mt-3 grid gap-2">
              <input value={newAppt.patientName || ''} onChange={e => setNewAppt(a => ({ ...a, patientName: e.target.value }))} placeholder="Patient name" className="px-3 py-2 border rounded" />
              <input value={newAppt.patientEmail || ''} onChange={e => setNewAppt(a => ({ ...a, patientEmail: e.target.value }))} placeholder="Patient email" className="px-3 py-2 border rounded" />
              <input value={(newAppt as any).patientPhone || ''} onChange={e => setNewAppt(a => ({ ...a, patientPhone: e.target.value }))} placeholder="Patient phone" className="px-3 py-2 border rounded" />
              <select value={newAppt.doctorId || ''} onChange={e => setNewAppt(a => ({ ...a, doctorId: e.target.value }))} className="px-3 py-2 border rounded">
                <option value="">Select doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="date" value={newAppt.date || ''} onChange={e => setNewAppt(a => ({ ...a, date: e.target.value }))} className="px-3 py-2 border rounded" />
              <input type="time" value={newAppt.time || ''} onChange={e => setNewAppt(a => ({ ...a, time: e.target.value }))} className="px-3 py-2 border rounded" />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setShowApptModal(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={handleCreateAppt} className="px-3 py-2 bg-blue-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Clinic Modal */}
      {showDeleteClinicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="bg-red-50 px-8 py-6 border-b border-red-200">
              <h2 className="text-2xl font-bold text-red-600">Delete Clinic?</h2>
              <p className="text-red-700 mt-1">This action cannot be undone</p>
            </div>

            <div className="px-8 py-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{clinicProfile?.name || 'your clinic'}</strong>? This will permanently delete all your doctors, appointments, and clinic data.
              </p>
            </div>

            <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowDeleteClinicModal(false)}
                disabled={deletingClinic}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClinic}
                disabled={deletingClinic}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
              >
                {deletingClinic ? 'Deleting...' : 'Delete Clinic'}
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

export default ClinicAdmin;
