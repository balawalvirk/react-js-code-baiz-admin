'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getJob, getApplicantsByJob, updateApplicantStatus, deleteApplicant } from '@/lib/careers';
import { Job, Applicant, ApplicationStatus } from '@/types';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import toast from 'react-hot-toast';
import { ChevronLeft, Download, Trash2, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Applicant | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [jobData, applicantData] = await Promise.all([
          getJob(id),
          getApplicantsByJob(id),
        ]);
        setJob(jobData);
        setApplicants(applicantData);
      } catch {
        toast.error('Failed to load applicants');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleStatusChange = async (applicantId: string, newStatus: ApplicationStatus) => {
    setActionLoading(applicantId);
    try {
      await updateApplicantStatus(applicantId, newStatus);
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicantId ? { ...a, status: newStatus } : a))
      );
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      await deleteApplicant(deleteTarget.id, id);
      setApplicants((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (job) setJob({ ...job, applicantCount: Math.max(0, (job.applicantCount || 1) - 1) });
      toast.success('Applicant removed');
    } catch {
      toast.error('Failed to remove applicant');
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const filtered = applicants.filter((a) =>
    filterStatus === 'all' ? true : a.status === filterStatus
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Link href="/careers" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Applicants</h1>
            {job && (
              <p className="text-sm text-gray-500">
                {job.title} · {job.department} ·{' '}
                <StatusBadge status={job.status} />
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/careers/${id}`}
          className="text-sm text-primary-600 hover:underline"
        >
          Edit Job →
        </Link>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 my-5">
        {(['all', 'new', 'reviewed', 'shortlisted', 'rejected'] as const).map((s) => {
          const count = s === 'all' ? applicants.length : applicants.filter((a) => a.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                filterStatus === s
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">No applicants found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cover Letter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Resume</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applied</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((applicant) => (
                <tr key={applicant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{applicant.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <a
                        href={`mailto:${applicant.email}`}
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-primary-600 text-xs"
                      >
                        <Mail size={11} /> {applicant.email}
                      </a>
                      {applicant.phone && (
                        <a
                          href={`tel:${applicant.phone}`}
                          className="inline-flex items-center gap-1 text-gray-600 hover:text-primary-600 text-xs"
                        >
                          <Phone size={11} /> {applicant.phone}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {applicant.coverLetter ? (
                      <p className="text-xs text-gray-600 max-w-xs truncate" title={applicant.coverLetter}>
                        {applicant.coverLetter}
                      </p>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {applicant.resumeUrl ? (
                      <a
                        href={applicant.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 hover:underline text-xs"
                      >
                        <Download size={12} />
                        {applicant.resumeFileName || 'Resume'}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No resume</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={applicant.status}
                      onChange={(e) =>
                        handleStatusChange(applicant.id, e.target.value as ApplicationStatus)
                      }
                      disabled={actionLoading === applicant.id}
                      className="border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {applicant.appliedAt?.toDate
                      ? format(applicant.appliedAt.toDate(), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDeleteTarget(applicant)}
                        title="Remove applicant"
                        className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Applicant"
        message={`Remove "${deleteTarget?.name}" from applicants? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
