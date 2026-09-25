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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Blog, BlogFormData } from '@/types';

const BLOGS_COLLECTION = 'blogs';

export async function getBlogs(): Promise<Blog[]> {
  const q = query(collection(db, BLOGS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Blog));
}

export async function getBlog(id: string): Promise<Blog | null> {
  const ref = doc(db, BLOGS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Blog;
}

export async function createBlog(data: BlogFormData): Promise<string> {
  const docRef = await addDoc(collection(db, BLOGS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBlog(id: string, data: Partial<BlogFormData>): Promise<void> {
  const ref = doc(db, BLOGS_COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBlog(id: string): Promise<void> {
  await deleteDoc(doc(db, BLOGS_COLLECTION, id));
}

export async function toggleBlogStatus(id: string, currentStatus: string): Promise<void> {
  // draft/inactive → active; active → inactive
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const ref = doc(db, BLOGS_COLLECTION, id);
  await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });
}
