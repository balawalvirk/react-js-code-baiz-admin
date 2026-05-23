'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlogs } from '@/lib/blogs';
import { getJobs } from '@/lib/careers';
import { BookOpen, Briefcase, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface Stats {
  totalBlogs: number;
  activeBlogs: number;
  inactiveBlogs: number;
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalApplicants: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [blogs, jobs] = await Promise.all([getBlogs(), getJobs()]);
        setStats({
          totalBlogs: blogs.length,
          activeBlogs: blogs.filter((b) => b.status === 'active').length,
          inactiveBlogs: blogs.filter((b) => b.status === 'inactive').length,
          totalJobs: jobs.length,
          openJobs: jobs.filter((j) => j.status === 'open').length,
          closedJobs: jobs.filter((j) => j.status === 'closed').length,
          totalApplicants: jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {/* Blog Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Blogs</h2>
          <Link href="/blogs" className="text-sm text-primary-600 hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Blogs" value={stats?.totalBlogs ?? 0} icon={<BookOpen size={18} className="text-primary-500" />} />
          <StatCard label="Active" value={stats?.activeBlogs ?? 0} icon={<Eye size={18} className="text-green-500" />} />
          <StatCard label="Inactive" value={stats?.inactiveBlogs ?? 0} icon={<EyeOff size={18} className="text-gray-400" />} />
        </div>
      </div>

      {/* Career Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Careers</h2>
          <Link href="/careers" className="text-sm text-primary-600 hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Positions" value={stats?.totalJobs ?? 0} icon={<Briefcase size={18} className="text-primary-500" />} />
          <StatCard label="Open" value={stats?.openJobs ?? 0} icon={<CheckCircle size={18} className="text-green-500" />} />
          <StatCard label="Closed" value={stats?.closedJobs ?? 0} icon={<XCircle size={18} className="text-red-400" />} />
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="flex gap-3">
          <Link
            href="/blogs/new"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <BookOpen size={15} /> New Blog Post
          </Link>
          <Link
            href="/careers/new"
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Briefcase size={15} /> Post New Job
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
