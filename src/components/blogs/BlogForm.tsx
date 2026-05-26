'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Blog, BlogFormData } from '@/types';
import RichTextEditor from '@/components/shared/RichTextEditor';
import toast from 'react-hot-toast';
import { createBlog, updateBlog } from '@/lib/blogs';
import { uploadCoverImage, validateImageFile } from '@/lib/uploadImage';
import slugify from 'slugify';
import { X, UploadCloud, ImageIcon, Loader2 } from 'lucide-react';

interface BlogFormProps {
  initialData?: Blog;
}

const defaultForm: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  author: '',
  tags: [],
  status: 'active',
};

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BlogFormData>(
    initialData
      ? {
          title: initialData.title,
          slug: initialData.slug,
          excerpt: initialData.excerpt,
          content: initialData.content,
          coverImage: initialData.coverImage,
          author: initialData.author,
          tags: initialData.tags || [],
          status: initialData.status,
        }
      : defaultForm
  );
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const isEdit = !!initialData;

  const handleChange = (field: keyof BlogFormData, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title' && !isEdit) {
        updated.slug = slugify(value, { lower: true, strict: true });
      }
      return updated;
    });
  };

  const handleImageFile = async (file: File) => {
    const error = validateImageFile(file);
    if (error) return toast.error(error);

    setUploadProgress(0);
    try {
      const url = await uploadCoverImage(file, (pct) => setUploadProgress(pct));
      setForm((prev) => ({ ...prev, coverImage: url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed. Check Firebase Storage rules.');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const removeCoverImage = () => {
    setForm((prev) => ({ ...prev, coverImage: '' }));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.content || form.content === '<p></p>') return toast.error('Content is required');
    if (!form.author.trim()) return toast.error('Author is required');
    if (!form.excerpt.trim()) return toast.error('Excerpt is required');

    setSaving(true);
    try {
      if (isEdit && initialData) {
        await updateBlog(initialData.id, form);
        toast.success('Blog updated');
      } else {
        await createBlog(form);
        toast.success('Blog created');
      }
      router.push('/blogs');
    } catch {
      toast.error('Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Blog post title"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="blog-post-slug"
          />
          <p className="text-xs text-gray-400 mt-1">Used in the URL on your website</p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt *</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => handleChange('excerpt', e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Short description shown in blog listing..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <RichTextEditor
            value={form.content}
            onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
            placeholder="Write your blog post here..."
          />
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>

          {form.coverImage ? (
            /* Preview */
            <div className="relative w-full rounded-md overflow-hidden border border-gray-200 bg-gray-50" style={{ height: 200 }}>
              <Image
                src={form.coverImage}
                alt="Cover preview"
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={removeCoverImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 w-full rounded-md border-2 border-dashed cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-gray-50 hover:border-primary-500 hover:bg-primary-50'
              }`}
              style={{ height: 160 }}
            >
              {uploadProgress !== null ? (
                <>
                  <Loader2 size={24} className="text-primary-500 animate-spin" />
                  <p className="text-sm text-gray-600">Uploading… {uploadProgress}%</p>
                  <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud size={28} className="text-gray-400" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary-500">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF — max 5MB</p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Replace button when image exists */}
          {form.coverImage && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ImageIcon size={12} />
              Replace image
            </button>
          )}
        </div>

        {/* Author + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => handleChange('author', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Author name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Type tag and press Enter"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Add
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-primary-50 text-primary-600 px-2 py-0.5 rounded text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary-700"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploadProgress !== null}
            className="bg-primary-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Blog' : 'Publish Blog'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/blogs')}
            className="px-5 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}