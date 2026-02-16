'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    List, ListOrdered, Quote, Heading1, Heading2, Heading3,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Link as LinkIcon, Image as ImageIcon, Undo, Redo,
    Type, Eraser, Code
} from 'lucide-react'
import { useCallback } from 'react'

interface ProEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

const MenuButton = ({
    onClick,
    active = false,
    disabled = false,
    children,
    title
}: {
    onClick: () => void,
    active?: boolean,
    disabled?: boolean,
    children: React.ReactNode,
    title: string
}) => (
    <button
        type="button"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        disabled={disabled}
        title={title}
        className={`p-2 rounded-lg transition-all hover:bg-gray-100 disabled:opacity-30 ${active ? 'bg-primary/10 text-primary' : 'text-gray-600'}`}
    >
        {children}
    </button>
)

export default function ProEditor({ value, onChange, placeholder }: ProEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                }
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer'
                }
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-xl border border-gray-100'
                }
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph']
            }),
            Typography,
            Placeholder.configure({
                placeholder: placeholder || 'Write something amazing...',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6'
            }
        }
    })

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) return
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const addImage = useCallback(() => {
        const url = window.prompt('URL Gambar')
        if (url) {
            editor?.chain().focus().setImage({ src: url }).run()
        }
    }, [editor])

    if (!editor) return null

    return (
        <div className="pro-editor bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="bg-gray-50/50 border-b border-gray-100 p-2 flex flex-wrap gap-1 sticky top-0 z-10 backdrop-blur-sm">
                {/* Undo/Redo */}
                <div className="flex gap-1 pr-2 mr-2 border-r border-gray-200">
                    <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                        <Undo className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                        <Redo className="w-4 h-4" />
                    </MenuButton>
                </div>

                {/* Headings */}
                <div className="flex gap-1 pr-2 mr-2 border-r border-gray-200">
                    <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                        <Heading1 className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                        <Heading2 className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                        <Heading3 className="w-4 h-4" />
                    </MenuButton>
                </div>

                {/* Basic Marks */}
                <div className="flex gap-1 pr-2 mr-2 border-r border-gray-200">
                    <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                        <Bold className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                        <Italic className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                        <UnderlineIcon className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike">
                        <Strikethrough className="w-4 h-4" />
                    </MenuButton>
                </div>

                {/* Alignment */}
                <div className="flex gap-1 pr-2 mr-2 border-r border-gray-200">
                    <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
                        <AlignLeft className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
                        <AlignCenter className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
                        <AlignRight className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
                        <AlignJustify className="w-4 h-4" />
                    </MenuButton>
                </div>

                {/* Lists & Others */}
                <div className="flex gap-1 pr-2 mr-2 border-r border-gray-200">
                    <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                        <List className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
                        <ListOrdered className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
                        <Quote className="w-4 h-4" />
                    </MenuButton>
                </div>

                {/* Media & Cleanup */}
                <div className="flex gap-1">
                    <MenuButton onClick={setLink} active={editor.isActive('link')} title="Insert Link">
                        <LinkIcon className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={addImage} title="Insert Image">
                        <ImageIcon className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
                        <Eraser className="w-4 h-4" />
                    </MenuButton>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
        .pro-editor .ProseMirror:focus {
          outline: none;
        }
        .pro-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .pro-editor .ProseMirror blockquote {
          border-left: 4px solid var(--color-primary, #990000);
          padding-left: 1.5rem;
          font-style: italic;
          color: #4b5563;
        }
        .pro-editor .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .pro-editor .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
      `}</style>
        </div>
    )
}
