'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Job, JobFormData, JobType } from '@/types';
import RichTextEditor from '@/components/shared/RichTextEditor';
import toast from 'react-hot-toast';
import { createJob, updateJob } from '@/lib/careers';

interface JobFormProps {
  initialData?: Job;
}

const defaultForm: JobFormData = {
  title: '',
  department: '',
  location: '',
  type: 'full-time',
  description: '',
  requirements: '',
  status: 'open',
};

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
];

export default function JobForm({ initialData }: JobFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<JobFormData>(
    initialData
      ? {
          title: initialData.title,
          department: initialData.department,
          location: initialData.location,
          type: initialData.type,
          description: initialData.description,
          requirements: initialData.requirements,
          status: initialData.status,
        }
      : defaultForm
  );
  const [saving, setSaving] = useState(false);
  const isEdit = !!initialData;

  const handleChange = (field: keyof JobFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Job title is required');
    if (!form.department.trim()) return toast.error('Department is required');
    if (!form.location.trim()) return toast.error('Location is required');
    if (!form.description || form.description === '<p></p>')
      return toast.error('Job description is required');

    setSaving(true);
    try {
      if (isEdit && initialData) {
        await updateJob(initialData.id, form);
        toast.success('Job updated');
      } else {
        await createJob(form);
        toast.success('Job posted');
      }
      router.push('/careers');
    } catch {
      toast.error('Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Senior Frontend Developer"
          />
        </div>

        {/* Department + Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Lahore, Pakistan or Remote"
            />
          </div>
        </div>

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
            <select
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {JOB_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
            placeholder="Describe the role, responsibilities, and what success looks like..."
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Requirements
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <RichTextEditor
            value={form.requirements}
            onChange={(html) => setForm((prev) => ({ ...prev, requirements: html }))}
            placeholder="List required skills, experience, qualifications..."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Job' : 'Post Job'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/careers')}
            className="px-5 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
