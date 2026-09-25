import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, WebP, and GIF images are allowed';
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `Image must be smaller than ${MAX_SIZE_MB}MB`;
  }
  return null;
}

function uploadToPath(
  file: File,
  folder: string,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!storage) {
      reject(new Error('Firebase Storage is not configured. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.'));
      return;
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, filename);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress(pct);
      },
      (err) => {
        const message =
          err?.code === 'storage/unauthorized'
            ? 'Upload blocked by Storage rules. Deploy storage.rules and ensure you are logged in.'
            : err?.message || 'Upload failed';
        reject(new Error(message));
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export function uploadCoverImage(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return uploadToPath(file, 'blog-covers', onProgress);
}

export function uploadContentImage(
  file: File,
  onProgress: (percent: number) => void = () => {}
): Promise<string> {
  return uploadToPath(file, 'blog-content', onProgress);
}

export async function deleteImageByUrl(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // Ignore — file may not exist or URL may be external
  }
}
