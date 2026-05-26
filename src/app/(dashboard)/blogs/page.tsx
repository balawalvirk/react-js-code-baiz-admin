'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBlogs, deleteBlog, toggleBlogStatus } from '@/lib/blogs';
import { Blog } from '@/types';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const loadBlogs = async () => {
    try {
      const data = await getBlogs();
      setBlogs(data);
    } catch {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBlogs(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      await deleteBlog(deleteTarget.id);
      setBlogs((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success('Blog deleted');
    } catch {
      toast.error('Failed to delete blog');
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = async (blog: Blog) => {
    setActionLoading(blog.id);
    try {
      await toggleBlogStatus(blog.id, blog.status);
      setBlogs((prev) =>
        prev.map((b) => b.id === blog.id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b)
      );
      toast.success(`Blog ${blog.status === 'active' ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Blogs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{blogs.length} total posts</p>
        </div>
        <Link
          href="/blogs/new"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-3 py-2 md:px-4 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add Blog</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-3">No blogs yet</p>
          <Link href="/blogs/new" className="text-sm text-primary-600 hover:underline">
            Create your first blog post
          </Link>
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tags</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-xs">{blog.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{blog.excerpt}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{blog.author}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(blog.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={blog.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {blog.createdAt?.toDate ? format(blog.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleStatus(blog)} disabled={actionLoading === blog.id} title={blog.status === 'active' ? 'Deactivate' : 'Activate'} className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-40">
                          {blog.status === 'active' ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => router.push(`/blogs/${blog.id}`)} title="Edit" className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(blog)} title="Delete" className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{blog.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{blog.excerpt}</p>
                  </div>
                  <StatusBadge status={blog.status} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{blog.author}</span>
                    <span>·</span>
                    <span>{blog.createdAt?.toDate ? format(blog.createdAt.toDate(), 'MMM d, yyyy') : '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggleStatus(blog)} disabled={actionLoading === blog.id} title={blog.status === 'active' ? 'Deactivate' : 'Activate'} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40">
                      {blog.status === 'active' ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => router.push(`/blogs/${blog.id}`)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(blog)} className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}