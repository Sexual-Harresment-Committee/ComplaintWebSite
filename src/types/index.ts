import { Timestamp } from "firebase/firestore";

export type ComplaintStatus = 'Submitted' | 'Viewed' | 'Under Review' | 'Working' | 'Investigation' | 'Resolved' | 'Dismissed';
export type ComplaintCategory = 'Harassment' | 'Bullying' | 'Discrimination' | 'Other';
export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type UserRole = 'admin' | 'action_taker' | 'committee' | 'developer';

export interface PublicUpdate {
  date: Timestamp;
  message: string;
}

export interface InternalNote {
  date: Timestamp;
  authorId: string;
  note: string;
}

export interface Complaint {
  complaintId: string; // User facing ID e.g. CMP-12345
  passcode?: string; // Hashed passcode
  description: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo?: string; // UID of action taker
  attachmentUrl?: string; // Legacy: Single URL
  storagePath?: string; // Legacy: Single Path
  attachmentUrls?: string[]; // New: Multiple URLs
  storagePaths?: string[]; // New: Multiple Paths
  
  // Incident Details
  incidentDate?: string; // ISO String
  location?: string;
  perpetrator?: string;
  witnesses?: string;

  publicUpdates?: PublicUpdate[];
  // internalNotes is NOT on the document anymore (subcollection), but if we kept it for legacy or caching:
  // internalNotes?: InternalNote[]; 
 // Only visible to staff
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
}

export interface AuditLog {
  id?: string;
  complaintId: string;
  action: string;
  performedBy: string; // UID
  timestamp: Timestamp;
  details?: string;
}
