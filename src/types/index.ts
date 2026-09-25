import { Timestamp } from 'firebase/firestore';

// ─── Blog Types ────────────────────────────────────────────────
/** active = live on site; draft = work in progress; inactive = unpublished */
export type BlogStatus = 'active' | 'inactive' | 'draft';

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** SEO meta description (maps to <meta name="description"> / og:description) */
  metaDescription: string;
  /** Primary focus keyword for SEO */
  primaryKeyword: string;
  /** Secondary SEO keywords */
  secondaryKeywords: string[];
  /** Primary content tag (single) */
  primaryTag: string;
  /** Secondary tags (was previously just "tags") */
  tags: string[];
  content: string; // HTML from rich text editor
  coverImage: string;
  /** Accessible alt text for cover image */
  coverImageAlt: string;
  author: string;
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
  description: string;
  requirements: string;
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
