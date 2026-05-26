'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getJobs, deleteJob, toggleJobStatus } from '@/lib/careers';
import { Job } from '@/types';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const loadJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      await deleteJob(deleteTarget.id);
      setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = async (job: Job) => {
    setActionLoading(job.id);
    try {
      await toggleJobStatus(job.id, job.status);
      setJobs((prev) =>
        prev.map((j) => j.id === job.id ? { ...j, status: j.status === 'open' ? 'closed' : 'open' } : j)
      );
      toast.success(`Position ${job.status === 'open' ? 'closed' : 'reopened'}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredJobs = jobs.filter((j) => filter === 'all' ? true : j.status === filter);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Careers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {jobs.filter((j) => j.status === 'open').length} open positions
          </p>
        </div>
        <Link
          href="/careers/new"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-3 py-2 md:px-4 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Post Job</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(['all', 'open', 'closed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize whitespace-nowrap ${
              filter === tab ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab} ({tab === 'all' ? jobs.length : jobs.filter(j => j.status === tab).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-3">No job postings found</p>
          <Link href="/careers/new" className="text-sm text-primary-600 hover:underline">Post your first job</Link>
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Position</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Location / Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Applicants</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Posted</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3"><p className="font-medium text-gray-900">{job.title}</p></td>
                    <td className="px-4 py-3 text-gray-600">{job.department}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span>{job.location}</span>
                      <span className="mx-1 text-gray-300">·</span>
                      <span className="capitalize text-xs">{job.type}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/careers/${job.id}/applicants`} className="inline-flex items-center gap-1 text-primary-600 hover:underline">
                        <Users size={13} />{job.applicantCount || 0}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {job.createdAt?.toDate ? format(job.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleStatus(job)} disabled={actionLoading === job.id} title={job.status === 'open' ? 'Close' : 'Reopen'} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40">
                          {job.status === 'open' ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => router.push(`/careers/${job.id}`)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(job)} className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{job.department} · {job.location}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/careers/${job.id}/applicants`} className="inline-flex items-center gap-1 text-primary-600 text-xs hover:underline">
                      <Users size={12} />{job.applicantCount || 0} applicants
                    </Link>
                    <span className="text-xs text-gray-400 capitalize">{job.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggleStatus(job)} disabled={actionLoading === job.id} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40">
                      {job.status === 'open' ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => router.push(`/careers/${job.id}`)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(job)} className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Job Posting"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All applicant data will remain in the database.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}