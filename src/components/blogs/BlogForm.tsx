'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Blog, BlogFormData, BlogStatus } from '@/types';
import RichTextEditor from '@/components/shared/RichTextEditor';
import toast from 'react-hot-toast';
import { createBlog, updateBlog } from '@/lib/blogs';
import { uploadCoverImage, validateImageFile } from '@/lib/uploadImage';
import slugify from 'slugify';
import { X, UploadCloud, ImageIcon, Loader2, Save } from 'lucide-react';

interface BlogFormProps {
  initialData?: Blog;
}

const defaultForm: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  metaDescription: '',
  primaryKeyword: '',
  secondaryKeywords: [],
  primaryTag: '',
  tags: [],
  content: '',
  coverImage: '',
  coverImageAlt: '',
  author: '',
  status: 'draft',
};

function draftKey(id?: string) {
  return id ? `baiz-blog-draft-${id}` : 'baiz-blog-draft-new';
}

function normalizeForm(data: Partial<BlogFormData> | Blog): BlogFormData {
  return {
    title: data.title || '',
    slug: data.slug || '',
    excerpt: data.excerpt || '',
    metaDescription: data.metaDescription || '',
    primaryKeyword: data.primaryKeyword || '',
    secondaryKeywords: data.secondaryKeywords || [],
    primaryTag: data.primaryTag || '',
    tags: data.tags || [],
    content: data.content || '',
    coverImage: data.coverImage || '',
    coverImageAlt: data.coverImageAlt || '',
    author: data.author || '',
    status: (data.status as BlogStatus) || 'draft',
  };
}

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initialData;
  const [blogId, setBlogId] = useState<string | undefined>(initialData?.id);

  const [form, setForm] = useState<BlogFormData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(draftKey(initialData?.id));
        if (raw) {
          const parsed = JSON.parse(raw) as BlogFormData;
          if (parsed?.title || parsed?.content) return normalizeForm(parsed);
        }
      } catch {
        /* ignore */
      }
    }
    return initialData ? normalizeForm(initialData) : defaultForm;
  });

  const [tagInput, setTagInput] = useState('');
  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastLocalSave, setLastLocalSave] = useState<string | null>(null);

  // Persist to localStorage while typing (survives accidental Back)
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(blogId), JSON.stringify(form));
        setLastLocalSave(new Date().toLocaleTimeString());
      } catch {
        /* quota */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [form, dirty, blogId]);

  // Warn on browser refresh / tab close
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const updateForm = useCallback((updater: (prev: BlogFormData) => BlogFormData) => {
    setForm(updater);
    setDirty(true);
  }, []);

  const handleChange = (field: keyof BlogFormData, value: string) => {
    updateForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title' && !isEdit && !blogId) {
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
      updateForm((prev) => ({
        ...prev,
        coverImage: url,
        coverImageAlt:
          prev.coverImageAlt ||
          file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed. Check Firebase Storage rules.');
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
    updateForm((prev) => ({ ...prev, coverImage: '', coverImageAlt: '' }));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      updateForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addSecondaryKeyword = () => {
    const k = secondaryKeywordInput.trim().toLowerCase();
    if (k && !form.secondaryKeywords.includes(k)) {
      updateForm((prev) => ({
        ...prev,
        secondaryKeywords: [...prev.secondaryKeywords, k],
      }));
    }
    setSecondaryKeywordInput('');
  };

  const removeSecondaryKeyword = (k: string) => {
    updateForm((prev) => ({
      ...prev,
      secondaryKeywords: prev.secondaryKeywords.filter((x) => x !== k),
    }));
  };

  const clearLocalDraft = () => {
    try {
      localStorage.removeItem(draftKey(blogId));
      if (!blogId) localStorage.removeItem(draftKey());
    } catch {
      /* ignore */
    }
  };

  const persist = async (status: BlogStatus, message: string) => {
    if (!form.title.trim() && status === 'active') {
      return toast.error('Title is required to publish');
    }

    const payload: BlogFormData = {
      ...form,
      status,
      metaDescription: form.metaDescription.trim() || form.excerpt.trim(),
      coverImageAlt: form.coverImageAlt.trim(),
    };

    setSaving(true);
    if (status === 'draft') setDraftSaving(true);
    try {
      if (blogId) {
        await updateBlog(blogId, payload);
      } else {
        const id = await createBlog(payload);
        setBlogId(id);
        // migrate local draft key
        try {
          localStorage.removeItem(draftKey());
          localStorage.setItem(draftKey(id), JSON.stringify(payload));
        } catch {
          /* ignore */
        }
      }
      setForm(payload);
      setDirty(false);
      toast.success(message);
      if (status === 'active') {
        clearLocalDraft();
        router.push('/blogs');
      }
    } catch {
      toast.error('Failed to save blog');
    } finally {
      setSaving(false);
      setDraftSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.content || form.content === '<p></p>') return toast.error('Content is required');
    if (!form.author.trim()) return toast.error('Author is required');
    if (!form.excerpt.trim()) return toast.error('Excerpt is required');
    if (form.coverImage && !form.coverImageAlt.trim()) {
      return toast.error('Cover image alt text is required');
    }
    await persist('active', isEdit ? 'Blog published' : 'Blog created');
  };

  const handleSaveDraft = async () => {
    if (!form.title.trim()) return toast.error('Add a title before saving draft');
    await persist('draft', 'Draft saved — you can leave and come back');
  };

  const handleCancel = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave anyway?')) return;
    router.push('/blogs');
  };

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      {lastLocalSave && (
        <p className="text-xs text-gray-400 mb-3">
          Auto-saved locally at {lastLocalSave}
          {blogId ? ' · Firestore draft id ready' : ''}
        </p>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={inputClass}
            placeholder="Blog post title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            className={inputClass}
            placeholder="blog-post-slug"
          />
          <p className="text-xs text-gray-400 mt-1">Used in the URL on your website</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt *</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => handleChange('excerpt', e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Short description shown in blog listing..."
          />
        </div>

        {/* SEO block — maps to meta / OG / JSON-LD on the public site */}
        <fieldset className="border border-gray-200 rounded-md p-4 space-y-4">
          <legend className="text-sm font-semibold text-gray-800 px-1">SEO</legend>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta description
            </label>
            <textarea
              value={form.metaDescription}
              onChange={(e) => handleChange('metaDescription', e.target.value)}
              rows={2}
              maxLength={160}
              className={`${inputClass} resize-none`}
              placeholder="Appears in Google search results (~150–160 chars). Falls back to excerpt if empty."
            />
            <p className="text-xs text-gray-400 mt-1">
              {form.metaDescription.length}/160 · becomes{' '}
              <code className="bg-gray-100 px-1 rounded">&lt;meta name=&quot;description&quot;&gt;</code>{' '}
              and <code className="bg-gray-100 px-1 rounded">og:description</code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary keyword
            </label>
            <input
              type="text"
              value={form.primaryKeyword}
              onChange={(e) => handleChange('primaryKeyword', e.target.value)}
              className={inputClass}
              placeholder="e.g. app code audit"
            />
            <p className="text-xs text-gray-400 mt-1">
              Main focus term → Article JSON-LD <code className="bg-gray-100 px-1 rounded">keywords</code>{' '}
              + meta keywords
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary keywords
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={secondaryKeywordInput}
                onChange={(e) => setSecondaryKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addSecondaryKeyword();
                  }
                }}
                className={`flex-1 ${inputClass}`}
                placeholder="Type keyword and press Enter"
              />
              <button
                type="button"
                onClick={addSecondaryKeyword}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            {form.secondaryKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.secondaryKeywords.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                  >
                    {k}
                    <button type="button" onClick={() => removeSecondaryKeyword(k)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <RichTextEditor
            value={form.content}
            onChange={(html) => updateForm((prev) => ({ ...prev, content: html }))}
            placeholder="Write your blog post here..."
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>

          {form.coverImage ? (
            <div
              className="relative w-full rounded-md overflow-hidden border border-gray-200 bg-gray-50"
              style={{ height: 200 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.coverImage}
                alt={form.coverImageAlt || 'Cover preview'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeCoverImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 w-full rounded-md border-2 border-dashed cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-gray-50 hover:border-primary-400'
              }`}
              style={{ height: 160 }}
            >
              {uploadProgress !== null ? (
                <>
                  <Loader2 size={24} className="text-primary-500 animate-spin" />
                  <p className="text-sm text-gray-600">Uploading… {uploadProgress}%</p>
                  <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud size={28} className="text-gray-400" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary-500">Click to upload</span> or drag
                    &amp; drop
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

          {form.coverImage && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              <ImageIcon size={12} />
              Replace image
            </button>
          )}

          {form.coverImage && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover image alt text *
              </label>
              <input
                type="text"
                value={form.coverImageAlt}
                onChange={(e) => handleChange('coverImageAlt', e.target.value)}
                className={inputClass}
                placeholder="Describe the cover image for screen readers & SEO"
              />
              <p className="text-xs text-gray-400 mt-1">
                Becomes <code className="bg-gray-100 px-1 rounded">alt=&quot;…&quot;</code> on the
                public site
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => handleChange('author', e.target.value)}
              className={inputClass}
              placeholder="Author name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                updateForm((prev) => ({
                  ...prev,
                  status: e.target.value as BlogStatus,
                }))
              }
              className={`${inputClass} bg-white`}
            >
              <option value="draft">Draft</option>
              <option value="active">Active (published)</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Primary tag + secondary tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary tag</label>
          <input
            type="text"
            value={form.primaryTag}
            onChange={(e) => handleChange('primaryTag', e.target.value)}
            className={inputClass}
            placeholder="e.g. engineering"
          />
          <p className="text-xs text-gray-400 mt-1">
            Single main category tag for filtering / display
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secondary tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className={`flex-1 ${inputClass}`}
              placeholder="Type tag and press Enter"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
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
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || uploadProgress !== null}
            className="inline-flex items-center gap-1.5 px-5 py-2 border border-gray-300 rounded-md text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save size={14} />
            {draftSaving ? 'Saving draft…' : 'Save draft'}
          </button>
          <button
            type="submit"
            disabled={saving || uploadProgress !== null}
            className="bg-primary-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && !draftSaving ? 'Publishing…' : 'Publish Blog'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
