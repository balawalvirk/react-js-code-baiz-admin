'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getBlog } from '@/lib/blogs';
import { Blog } from '@/types';
import BlogForm from '@/components/blogs/BlogForm';
import { ChevronLeft } from 'lucide-react';

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getBlog(id)
      .then((data) => {
        if (!data) setNotFound(true);
        else setBlog(data);
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
        <p className="text-gray-500">Blog post not found.</p>
        <Link href="/blogs" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
          Back to blogs
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/blogs" className="text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Edit Blog Post</h1>
      </div>
      {blog && <BlogForm initialData={blog} />}
    </div>
  );
}
