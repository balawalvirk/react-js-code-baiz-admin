# Admin Panel — Blogs & Careers CMS

A Next.js 14 admin panel with Firebase Firestore for managing blog posts and job listings on your website.

---

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Firebase** (Auth + Firestore + Storage)
- **Tiptap** — Rich text editor
- **react-hot-toast** — Notifications

---

## Project Structure

```
src/
├── app/
│   ├── login/              # Login page
│   └── (dashboard)/        # Auth-protected routes
│       ├── dashboard/      # Overview with stats
│       ├── blogs/          # Blog list, create, edit
│       └── careers/        # Job list, create, edit, applicants
├── components/
│   ├── layout/Sidebar.tsx
│   ├── blogs/BlogForm.tsx
│   ├── careers/JobForm.tsx
│   └── shared/             # RichTextEditor, ConfirmDialog, StatusBadge
├── context/AuthContext.tsx
├── lib/
│   ├── firebase.ts         # Firebase init
│   ├── blogs.ts            # Blog Firestore helpers
│   └── careers.ts          # Jobs & Applicants Firestore helpers
└── types/index.ts          # All TypeScript types
```

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Enable **Firestore Database** (start in production mode)
5. Enable **Storage** (if you plan to upload images/resumes directly)
6. Go to **Project Settings → Your Apps → Web** → Add a web app → copy config

### 3. Add your admin user

Since there's no signup in this panel, add your admin manually:
- Firebase Console → Authentication → Users → **Add user**
- Enter email and password

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Firebase config values in `.env.local`.

### 5. Deploy Firebase rules (single source for admin + website)

**Do not keep separate rules in the landing repo.** Both apps share one Firebase project; rules live only here:

- `firestore.rules` — blogs / jobs / applicants (public read where needed, admin write)
- `storage.rules` — blog images (admin) + resumes (website apply form)

```bash
firebase deploy --only firestore:rules,storage
```

Or deploy everything configured in `firebase.json`:

```bash
firebase deploy --only firestore,storage
```

### 6. Create Firestore indexes

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

Or create them manually in the Firebase Console as needed (Firestore will show a link in the console error when an index is missing).

### 7. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## Firestore Collections

### `blogs`
| Field | Type | Description |
|-------|------|-------------|
| title | string | Blog post title |
| slug | string | URL-friendly slug |
| excerpt | string | Short description |
| content | string | HTML from editor |
| coverImage | string | Image URL |
| author | string | Author name |
| tags | string[] | Tag list |
| status | `active` / `inactive` | Controls visibility on website |
| createdAt | Timestamp | Auto-set |
| updatedAt | Timestamp | Auto-updated |

### `jobs`
| Field | Type | Description |
|-------|------|-------------|
| title | string | Job title |
| department | string | e.g. Engineering |
| location | string | e.g. Lahore or Remote |
| type | `full-time` / `part-time` / `contract` / `internship` / `remote` | |
| description | string | HTML from editor |
| requirements | string | HTML from editor |
| status | `open` / `closed` | |
| applicantCount | number | Auto-incremented |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

### `applicants`
| Field | Type | Description |
|-------|------|-------------|
| jobId | string | Reference to job |
| jobTitle | string | Denormalized for display |
| name | string | Applicant full name |
| email | string | |
| phone | string | |
| coverLetter | string | |
| resumeUrl | string | Download URL |
| resumeFileName | string | Display name |
| status | `new` / `reviewed` / `shortlisted` / `rejected` | |
| appliedAt | Timestamp | |

---

## Integrating with Your Website

### Reading blogs (public)
```typescript
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

// Get all active blogs
const q = query(
  collection(db, 'blogs'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc')
);
```

### Reading open jobs (public)
```typescript
const q = query(
  collection(db, 'jobs'),
  where('status', '==', 'open'),
  orderBy('createdAt', 'desc')
);
```

### Submitting an application from your website
```typescript
import { addDoc, collection, increment, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

// Add applicant
await addDoc(collection(db, 'applicants'), {
  jobId: job.id,
  jobTitle: job.title,
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  coverLetter: formData.coverLetter,
  resumeUrl: resumeDownloadUrl,    // from Firebase Storage upload
  resumeFileName: file.name,
  status: 'new',
  appliedAt: serverTimestamp(),
});

// Increment applicant count on the job
await updateDoc(doc(db, 'jobs', job.id), {
  applicantCount: increment(1),
});
```

---

## Features

- ✅ Firebase Email/Password login
- ✅ Protected dashboard (redirect to login if not authenticated)
- ✅ **Blogs**: create, edit, delete, activate/deactivate
- ✅ Rich text editor with formatting toolbar
- ✅ Auto-generated slugs from title
- ✅ Tags system for blogs
- ✅ **Careers**: create, edit, delete, open/close positions
- ✅ Filter jobs by status (all / open / closed)
- ✅ **Applicants**: view all applicants per job
- ✅ Update applicant status (new → reviewed → shortlisted → rejected)
- ✅ Resume download links
- ✅ Dashboard with stats overview
- ✅ Toast notifications for all actions
- ✅ Confirm dialogs for destructive actions

---

## Build for Production

```bash
npm run build
npm start
```

Or deploy to **Vercel** (recommended):
1. Push to GitHub
2. Import to Vercel
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel dashboard
