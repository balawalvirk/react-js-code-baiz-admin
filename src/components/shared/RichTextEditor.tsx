'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, List, ListOrdered, Link as LinkIcon,
  Heading1, Heading2, Heading3, Quote, Undo, Redo, Minus, ImageIcon, FileCode,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { uploadContentImage, validateImageFile } from '@/lib/uploadImage';
import toast from 'react-hot-toast';
import { ResizableImage } from './ResizableImage';
import ImageCropModal from './ImageCropModal';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importHtml, setImportHtml] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      ResizableImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (importOpen) importTextareaRef.current?.focus();
  }, [importOpen]);

  const openImport = () => {
    setImportHtml('');
    setImportOpen(true);
  };

  const doImportHtml = () => {
    if (!editor) return;
    const html = importHtml.trim();
    if (!html) {
      toast.error('Paste some HTML first');
      return;
    }
    if (
      !editor.isEmpty &&
      !window.confirm('Replace the current editor content with the imported HTML?')
    ) {
      return;
    }
    editor.commands.setContent(html);
    setImportOpen(false);
    setImportHtml('');
    toast.success('HTML imported into the editor');
  };

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertImageWithAlt = async (file: File) => {
    if (!editor) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const alt =
      window.prompt(
        'Alt text for this image (required for accessibility & SEO):\nDescribe what the image shows.',
        file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      )?.trim() || '';

    if (!alt) {
      toast.error('Alt text is required for images');
      return;
    }

    const toastId = toast.loading('Uploading image…');
    try {
      const url = await uploadContentImage(file);
      editor.chain().focus().setImage({ src: url, alt, width: '100%' } as never).run();
      toast.success('Image inserted — click it to resize (S/M/L/Full or drag corner)', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed', { id: toastId });
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
      } else {
        setCropFile(file);
      }
    }
    e.target.value = '';
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    title,
    id,
    ariaLabel,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    id?: string;
    ariaLabel?: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      id={id}
      aria-label={ariaLabel || title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
          <LinkIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Insert image (crop + resize)"
        >
          <ImageIcon size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton
          onClick={openImport}
          title="Import HTML"
          id="import-html-button"
          ariaLabel="Import HTML into editor"
        >
          <FileCode size={14} />
        </ToolbarButton>
      </div>

      <input
        id="editor-image-input"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageFile}
        className="sr-only"
        aria-label="Insert image"
      />

      <EditorContent editor={editor} />

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(file) => {
            setCropFile(null);
            void insertImageWithAlt(file);
          }}
        />
      )}

      {importOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Import HTML dialog"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Import HTML</h3>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="text-gray-500 hover:text-gray-800 text-lg leading-none"
                aria-label="Close import dialog"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <label
                htmlFor="import-html-textarea"
                className="block text-sm text-gray-600 mb-2"
              >
                Paste the article HTML below. Importing replaces the current
                editor content.
              </label>
              <textarea
                id="import-html-textarea"
                ref={importTextareaRef}
                aria-label="Article HTML to import"
                value={importHtml}
                onChange={(e) => setImportHtml(e.target.value)}
                rows={12}
                className="w-full border border-gray-300 rounded-md p-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="<h2>Section title</h2><p>...</p>"
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="import-html-submit"
                type="button"
                onClick={doImportHtml}
                aria-label="Import HTML into editor"
                className="px-3 py-1.5 rounded bg-blue-600 text-sm text-white hover:bg-blue-700"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
