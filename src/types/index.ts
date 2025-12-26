
import type { Timestamp } from 'firebase/firestore';

export type Event = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  organizer: string;
  organizerId: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  isPaid: boolean;
  amount?: number;
  paymentQRUrl?: string;
  registrationCount: number;
  formFields: { label: string; type: string; required: boolean; options?: string }[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Timestamp;
  hasConflict?: boolean;
  conflictReason?: string;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  branch?: string;
  year?: string;
  rollNo?: string;
  enrollmentNo?: string;
  role: 'student' | 'organizer' | 'admin';
  status: 'active' | 'pending' | 'rejected';
  createdAt: any; // Firestore serverTimestamp
  societyName?: string;
  reason?: string;
  registrations?: string[];
};

export type OrganizerApprovalRequest = {
  id: string;
  type: 'organizer';
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  societyName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any; // Firestore serverTimestamp
  reviewedBy?: string;
  reviewedAt?: any; // Firestore serverTimestamp
  remarks?: string;
  // include other user fields for display
  phone?: string;
  branch?: string;
  year?: string;
};

export type Registration = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventImageUrl?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRollNo: string;
  userBranch: string;
  userYear: string;
  formResponses: Record<string, any>;
  paymentStatus: 'paid' | 'pending' | 'na';
  paymentScreenshot?: string;
  transactionId?: string;
  qrCode: string;
  attended: boolean;
  attendedAt?: Timestamp;
  registeredAt: Timestamp;
};

export type Expense = {
    id: string;
    description: string;
    amount: number;
    category: string;
    receiptUrl?: string;
    date: any; // Can be a Date or a Firestore Timestamp
    addedBy: string;
    addedByName: string;
    addedAt: Timestamp;
}

export type Budget = {
    id: string;
    eventId: string;
    expectedIncome: number;
    collectedIncome: number;
    verifiedPayments: number;
    totalExpenses: number;
    expenses: Expense[];
}

export type Notification = {
    id: string;
    title: string;
    message: string;
    targetType: 'all-my-attendees' | 'event' | 'all' | 'student' | 'organizer';
    targetEventId?: string;
    targetEventTitle?: string;
    targetRole?: 'student' | 'organizer' | 'all';
    senderId: string;
    senderName: string;
    senderRole: 'organizer' | 'admin';
    isPlatformWide?: boolean;
    readBy: string[];
    createdAt: Timestamp;
};
