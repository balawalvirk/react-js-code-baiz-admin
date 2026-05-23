import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Job, JobFormData, Applicant } from '@/types';

const JOBS_COLLECTION = 'jobs';
const APPLICANTS_COLLECTION = 'applicants';

// ─── Jobs ──────────────────────────────────────────────────────

export async function getJobs(): Promise<Job[]> {
  const q = query(collection(db, JOBS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
}

export async function getJob(id: string): Promise<Job | null> {
  const ref = doc(db, JOBS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Job;
}

export async function createJob(data: JobFormData): Promise<string> {
  const docRef = await addDoc(collection(db, JOBS_COLLECTION), {
    ...data,
    applicantCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateJob(id: string, data: Partial<JobFormData>): Promise<void> {
  const ref = doc(db, JOBS_COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteJob(id: string): Promise<void> {
  await deleteDoc(doc(db, JOBS_COLLECTION, id));
}

export async function toggleJobStatus(id: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'open' ? 'closed' : 'open';
  const ref = doc(db, JOBS_COLLECTION, id);
  await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });
}

// ─── Applicants ────────────────────────────────────────────────

export async function getApplicantsByJob(jobId: string): Promise<Applicant[]> {
  const q = query(
    collection(db, APPLICANTS_COLLECTION),
    where('jobId', '==', jobId),
    orderBy('appliedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Applicant));
}

export async function updateApplicantStatus(
  applicantId: string,
  status: string
): Promise<void> {
  const ref = doc(db, APPLICANTS_COLLECTION, applicantId);
  await updateDoc(ref, { status });
}

export async function deleteApplicant(applicantId: string, jobId: string): Promise<void> {
  await deleteDoc(doc(db, APPLICANTS_COLLECTION, applicantId));
  const jobRef = doc(db, JOBS_COLLECTION, jobId);
  await updateDoc(jobRef, { applicantCount: increment(-1) });
}
