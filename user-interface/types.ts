
export enum ClinicType {
  CLINIC = 'Clinic',
  HOSPITAL = 'Hospital',
  DENTAL = 'Dental'
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  clinicId: string;
  clinicName: string;
}

export interface Clinic {
  id: string;
  name: string;
  type: ClinicType;
  location: string;
  timings?: string;
  workingHours?: string;
  services?: string[];
  specialties?: string[];
  doctorIds?: string[];
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  image?: string;
  rating?: number;
}

export type AuthRole = 'Patient' | 'Clinic Admin';
