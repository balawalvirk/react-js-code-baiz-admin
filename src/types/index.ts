import { Timestamp } from 'firebase/firestore';

// ─── Blog Types ────────────────────────────────────────────────
export type BlogStatus = 'active' | 'inactive';

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;         // HTML from rich text editor
  coverImage: string;      // URL (Firebase Storage or external)
  author: string;
  tags: string[];
  status: BlogStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BlogFormData = Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Career / Job Types ────────────────────────────────────────
export type JobStatus = 'open' | 'closed';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  description: string;     // HTML from rich text editor
  requirements: string;    // HTML from rich text editor
  status: JobStatus;
  applicantCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type JobFormData = Omit<Job, 'id' | 'applicantCount' | 'createdAt' | 'updatedAt'>;

// ─── Applicant Types ───────────────────────────────────────────
export type ApplicationStatus = 'new' | 'reviewed' | 'shortlisted' | 'rejected';

export interface Applicant {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  resumeUrl: string;
  resumeFileName: string;
  status: ApplicationStatus;
  appliedAt: Timestamp;
}

// ─── Auth Types ────────────────────────────────────────────────
export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
