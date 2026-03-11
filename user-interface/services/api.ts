/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Clinic {
  id?: string;
  _id?: string;
  name: string;
  address: string;
  specialties: string[];
  rating?: number;
  image?: string;
  workingHours?: string;
}

export interface Doctor {
  id?: string;
  _id?: string;
  name: string;
  specialty: string;
  clinicId: string;
  email?: string;
  experience?: string;
  previouslyWorked?: string;
  rating?: number;
  image?: string;
  clinicName?: string;
  workingDays?: string;
  workingHours?: string;
  active?: boolean;
}

export interface Booking {
  id?: string;
  _id?: string;
  clinicId: string;
  doctorId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  tokenNumber?: string;
  status?: string;
  userId?: string;
  cancelledBy?: 'user' | 'clinic';
  cancelledAt?: Date;
  createdAt?: Date;
}

export interface SignupUser {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'Patient' | 'Clinic Admin';
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface UserDetails extends User {
  clinicId?: string;
  clinicStatus?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClinicRegistration {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  specialties: string[];
  password?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  approvedAt?: Date;
  workingHours?: string;
}

// Health check
export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('API health check failed');
  return response.json();
};

// Clinics
export const getClinics = async (): Promise<Clinic[]> => {
  const response = await fetch(`${API_BASE_URL}/clinics`);
  if (!response.ok) throw new Error('Failed to fetch clinics');
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map((c: any) => ({ 
    ...c, 
    id: c.id || c._id?.toString?.() || c._id
  }));
};

export const createClinic = async (clinic: Clinic): Promise<{ message: string; id: string }> => {
  const response = await fetch(`${API_BASE_URL}/clinics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clinic),
  });
  if (!response.ok) throw new Error('Failed to create clinic');
  return response.json();
};

export const getClinicProfile = async (id: string): Promise<Clinic & { description?: string; email?: string; phone?: string; location?: string; workingHours?: string }> => {
  const response = await fetch(`${API_BASE_URL}/clinics/${id}`);
  if (!response.ok) throw new Error('Failed to fetch clinic profile');
  const data = await response.json();
  return { ...data, id: data.id ?? data._id?.toString?.() };
};

export const updateClinicProfile = async (
  id: string,
  clinic: Partial<Clinic & { description?: string; email?: string; phone?: string; location?: string; workingHours?: string }>
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/clinics/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clinic),
  });
  if (!response.ok) throw new Error('Failed to update clinic profile');
  return response.json();
};

// Doctors
export const getDoctors = async (): Promise<Doctor[]> => {
  const response = await fetch(`${API_BASE_URL}/doctors`);
  if (!response.ok) throw new Error('Failed to fetch doctors');
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map((d: any) => ({ ...d, id: d.id ?? d._id?.toString?.() }));
};

export const createDoctor = async (doctor: Partial<Doctor>): Promise<{ message: string; id: string }> => {
  const response = await fetch(`${API_BASE_URL}/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctor),
  });
  if (!response.ok) throw new Error('Failed to create doctor');
  return response.json();
};

export const updateDoctor = async (id: string, doctor: Partial<Doctor>): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctor),
  });
  if (!response.ok) throw new Error('Failed to update doctor');
  return response.json();
};

export const fixDoctorClinicId = async (doctorId: string, clinicId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/fix-clinic/${clinicId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fix doctor clinic ID');
  return response.json();
};

export const deleteDoctor = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete doctor');
  return response.json();
};

// Bookings
export const getBookings = async (): Promise<Booking[]> => {
  const response = await fetch(`${API_BASE_URL}/bookings`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map((b: any) => ({ ...b, id: b.id ?? b._id?.toString?.() }));
};

export const createBooking = async (booking: Booking): Promise<{ message: string; id: string; tokenNumber: string }> => {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!response.ok) throw new Error('Failed to create booking');
  return response.json();
};

export const deleteBooking = async (bookingId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to delete booking');
  return response.json();
};

export const cancelAppointmentByClinic = async (bookingId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel-by-clinic`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to cancel appointment');
  return response.json();
};

export const getBookingsByUser = async (userId: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/bookings/user/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user bookings');
  return response.json();
};

export const cancelBooking = async (bookingId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to cancel booking');
  return response.json();
};

export const getAppointmentsByClinic = async (clinicId: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/bookings?clinicId=${clinicId}`);
  if (!response.ok) throw new Error('Failed to fetch appointments');
  return response.json();
};

export const getAppointmentsByPatient = async (patientName: string, patientPhone?: string): Promise<any[]> => {
  let url = `${API_BASE_URL}/bookings?patientName=${encodeURIComponent(patientName)}`;
  if (patientPhone) url += `&patientPhone=${encodeURIComponent(patientPhone)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch appointments');
  return response.json();
};

export const updateBooking = async (id: string, payload: Partial<Booking>): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update booking');
  return response.json();
};

// Signup
export const signup = async (user: SignupUser): Promise<{ message: string; id: string }> => {
  const response = await fetch(`${API_BASE_URL}/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create account');
  }
  return response.json();
};

// Login
export const login = async (email: string, password: string): Promise<{ message: string; user: User }> => {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  return response.json();
};

// Change Password
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/change-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to change password');
  }
  return response.json();
};

// Get all users (Admin view)
export const getAllUsers = async (): Promise<UserDetails[]> => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map((u: any) => ({ ...u, id: u.id ?? u._id?.toString?.() }));
};

export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete user');
};

export const revokeUserAccess = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/revoke`, { method: 'PUT' });
  if (!response.ok) throw new Error('Failed to revoke access');
};

export const grantUserAccess = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/grant`, { method: 'PUT' });
  if (!response.ok) throw new Error('Failed to grant access');
};

// Clinic Registration
export const registerClinic = async (clinic: Omit<ClinicRegistration, 'id' | '_id' | 'status' | 'createdAt' | 'approvedAt'> & { password: string; confirmPassword: string }): Promise<{ message: string; id: string }> => {
  const response = await fetch(`${API_BASE_URL}/clinics/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clinic),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to register clinic');
  }
  return response.json();
};

// Get Pending Clinic Registrations
export const getPendingClinics = async (): Promise<ClinicRegistration[]> => {
  const response = await fetch(`${API_BASE_URL}/clinics/registrations/pending`);
  if (!response.ok) throw new Error('Failed to fetch pending clinics');
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map((c: any) => ({ ...c, id: c.id ?? c._id?.toString?.() }));
};

// Get Approved Clinic Registrations
export const getApprovedClinics = async (): Promise<ClinicRegistration[]> => {
  const response = await fetch(`${API_BASE_URL}/clinics/registrations/approved`);
  if (!response.ok) throw new Error('Failed to fetch approved clinics');
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map((c: any) => ({ ...c, id: c.id ?? c._id?.toString?.() }));
};

// Get Rejected Clinic Registrations
export const getRejectedClinics = async (): Promise<ClinicRegistration[]> => {
  const response = await fetch(`${API_BASE_URL}/clinics/registrations/rejected`);
  if (!response.ok) throw new Error('Failed to fetch rejected clinics');
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map((c: any) => ({ ...c, id: c.id ?? c._id?.toString?.() }));
};

// Approve Clinic Registration
export const approveClinicRegistration = async (clinicId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/clinics/registrations/${clinicId}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to approve clinic');
  return response.json();
};

// Reject Clinic Registration
export const rejectClinicRegistration = async (clinicId: string, reason?: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/clinics/registrations/${clinicId}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Failed to reject clinic');
  return response.json();
};

// Revoke Clinic Approval
export const revokeClinicApproval = async (clinicId: string, reason?: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/clinics/registrations/${clinicId}/revoke`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Failed to revoke clinic approval');
  return response.json();
};

// Delete Clinic
export const deleteClinic = async (clinicId: string, reason?: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/clinics/${clinicId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Failed to delete clinic');
  return response.json();
};
