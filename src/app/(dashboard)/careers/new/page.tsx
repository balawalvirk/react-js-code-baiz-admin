import Link from 'next/link';
import JobForm from '@/components/careers/JobForm';
import { ChevronLeft } from 'lucide-react';

export default function NewJobPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/careers" className="text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Post New Job</h1>
      </div>
      <JobForm />
    </div>
  );
}
