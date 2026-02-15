'use client'

import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-2xl" />
})

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image', 'blockquote', 'code-block'],
    ['clean'],
  ],
}

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'link',
  'image',
  'blockquote',
  'code-block',
]

export default function Editor({ value, onChange, placeholder }: EditorProps) {
  return (
    <div className="prose-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="h-[400px] mb-12"
      />
      <style jsx global>{`
        .prose-editor .ql-container {
          border-bottom-left-radius: 1.5rem;
          border-bottom-right-radius: 1.5rem;
          border: 1px solid #f3f4f6 !important;
          font-size: 1.125rem;
          color: #374151;
        }
        .prose-editor .ql-toolbar {
          border-top-left-radius: 1.5rem;
          border-top-right-radius: 1.5rem;
          border: 1px solid #f3f4f6 !important;
          background: #f9fafb;
          padding: 0.75rem;
        }
        .prose-editor .ql-editor {
          min-height: 400px;
          padding: 1.5rem;
        }
        .prose-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
      `}</style>
    </div>
  )
}
