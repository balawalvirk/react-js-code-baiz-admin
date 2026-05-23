'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getJob } from '@/lib/careers';
import { Job } from '@/types';
import JobForm from '@/components/careers/JobForm';
import { ChevronLeft, Users } from 'lucide-react';

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getJob(id)
      .then((data) => {
        if (!data) setNotFound(true);
        else setJob(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Job not found.</p>
        <Link href="/careers" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
          Back to careers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/careers" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Edit Job</h1>
        </div>
        {job && (
          <Link
            href={`/careers/${id}/applicants`}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            <Users size={14} />
            View Applicants ({job.applicantCount || 0})
          </Link>
        )}
      </div>
      {job && <JobForm initialData={job} />}
    </div>
  );
}
