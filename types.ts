
export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';

export interface LibraryProfile {
  name: string;
  address: string;
  contact: string;
  logoUrl?: string; // Base64 or URL
  totalSeats: number;
  // New Branding Fields
  email?: string;
  website?: string;
  gstin?: string;
  terms?: string; // Custom terms for receipts
  // Local License State
  licenseKey?: string;
}

export interface LibraryAccount {
  id: string;
  username: string; // Used for login
  password: string; // Visible to Super Admin
  libraryName: string;
  city: string; // Now stores "Taluka, District"
  district?: string;
  taluka?: string;
  isActive: boolean;
  createdAt: string;
  // SaaS Fields
  ownerName?: string;
  mobile?: string;
  licenseKey?: string;
  plan?: '6_MONTHS' | 'YEARLY' | 'LIFETIME'; 
  licenseExpiry?: string;
  maxSeats?: number;
}

export interface Notification {
  id: string;
  libraryId: string;
  message: string;
  imageUrl?: string;
  date: string;
  isRead: boolean;
  title: string;
  // CTA Support
  link?: string;
  linkText?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity?: number;
}

export interface Student {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  photoUrl?: string;
  seatId: string | null; // Seat Number (e.g., "A1")
  joinDate: string; // ISO Date
  planEndDate: string; // ISO Date
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  gender: 'MALE' | 'FEMALE';
  dues: number;
  planType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  // New Fields
  dob?: string;
  village?: string;
  class?: string; // e.g., "10th", "MPSC"
  preparation?: string; // e.g., "NEET", "UPSC"
  durationMonths?: number;
  totalFeeFixed?: number;
  isHandicapped?: boolean; // New Field for Seat Color Logic
}

export interface Seat {
  id: string; // "1", "2", "3"...
  label: string;
  status: SeatStatus;
  studentId?: string; // Link to active student
  category?: 'GENERAL' | 'LADIES' | 'AC';
  roomId?: string; // Link to Room
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  type: 'FEE' | 'REGISTRATION' | 'OTHER';
  method: 'CASH' | 'UPI' | 'CARD';
}

export interface Enquiry {
  id: string;
  name: string;
  mobile: string;
  source: string;
  status: 'NEW' | 'FOLLOW_UP' | 'CONVERTED' | 'CLOSED';
  date: string;
  notes?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'IN' | 'OUT';
}

export interface AppSettings {
  monthlyFee: number;
  maintenanceMode: boolean;
  classes: string[];
  preparations: string[];
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  isDemo?: boolean;
  role?: 'SUPER_ADMIN' | 'ADMIN'; 
  // Session License Info
  licenseExpiry?: string;
  accountLicenseKey?: string; // The key required for activation
}
