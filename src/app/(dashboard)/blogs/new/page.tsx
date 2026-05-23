import Link from 'next/link';
import BlogForm from '@/components/blogs/BlogForm';
import { ChevronLeft } from 'lucide-react';

export default function NewBlogPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/blogs" className="text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">New Blog Post</h1>
      </div>
      <BlogForm />
    </div>
  );
}
