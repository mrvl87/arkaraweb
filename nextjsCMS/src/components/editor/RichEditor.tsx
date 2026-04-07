"use client"

import { useEffect, useState } from 'react'
import { 
  EditorRoot, 
  EditorContent, 
  EditorCommand, 
  EditorCommandItem, 
  EditorCommandList,
  EditorCommandEmpty,
  EditorBubble,
  EditorBubbleItem,
  StarterKit,
  HorizontalRule,
  Placeholder,
  TiptapLink,
  TiptapUnderline,
  TextStyle,
  Color,
  HighlightExtension,
  TaskItem,
  TaskList,
  TiptapImage,
  Command,
  renderItems,
  useEditor
} from 'novel'
import { Markdown } from 'tiptap-markdown'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Code, 
  CheckSquare,
  Image as ImageIcon,
  Type,
  Trash2,
  Link as LinkIcon,
  AlertTriangle,
  Code2,
  Layout,
  Table as TableIcon,
  Sparkles,
  Wand2,
  ArrowDownToLine,
  MessageSquareQuote,
  Copy,
  Replace,
  Loader2
} from 'lucide-react'
import { MediaPicker } from '../media/media-picker'
import MarkdownIt from 'markdown-it'
import type {
  RewriteSectionInput,
  RewriteSectionOutput,
  ExpandSectionInput,
  ExpandSectionOutput,
  GenerateFAQInput,
  GenerateFAQOutput,
} from '@/lib/ai/schemas'
import "./editor.css"

// Predefined base extensions
const extensions = [
  StarterKit.configure({
    codeBlock: false, 
    horizontalRule: false,
    dropcursor: {
      color: "#fbbf24",
      width: 2,
    },
  }),
  HorizontalRule.configure({
    HTMLAttributes: {
      class: "my-8 border-t-2 border-amber-100",
    },
  }),
  TiptapLink.configure({
    HTMLAttributes: {
      class: "text-amber-600 underline underline-offset-[3px] hover:text-amber-700 transition-colors cursor-pointer",
    },
  }),
  TiptapUnderline,
  TextStyle,
  Color,
  HighlightExtension.configure({
    multicolor: true,
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-2",
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "flex items-start my-4",
    },
    nested: true,
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`;
      }
      return "Ketik '/' untuk bantuan...";
    },
  }),
  TiptapImage.configure({
    allowBase64: true,
    HTMLAttributes: {
      class: "rounded-2xl border-2 border-gray-100 shadow-lg my-8 max-w-full",
    },
  }),
  Command.configure({
    suggestion: {
      items: () => [], // The EditorCommand component in the JSX handles rendering the actual items
      render: renderItems,
    },
  }),
  Markdown,
  // Table extensions
  Table.configure({
    resizable: false,
    HTMLAttributes: {
      class: 'border-collapse w-full my-6',
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: 'border-b border-gray-200',
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: 'bg-amber-50 text-left px-4 py-2 font-semibold text-gray-700 border border-gray-200 text-sm',
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: 'px-4 py-2 border border-gray-200 text-sm text-gray-600',
    },
  }),
]

const markdownRenderer = new MarkdownIt({
  breaks: true,
  linkify: true,
})

type AIResponse<T> = Promise<
  | { success: true; data: T; model: string }
  | { success: false; error: string }
>

export interface RichEditorAIConfig {
  title: string
  rewriteSection: (input: RewriteSectionInput) => AIResponse<RewriteSectionOutput>
  expandSection: (input: ExpandSectionInput) => AIResponse<ExpandSectionOutput>
  generateFAQ: (input: GenerateFAQInput) => AIResponse<GenerateFAQOutput>
}

interface RichEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  onEditorReady?: (api: RichEditorHandle | null) => void
  aiConfig?: RichEditorAIConfig
}

export interface RichEditorHandle {
  replaceContent: (content: string, options?: { format?: 'html' | 'markdown' }) => void
  appendContent: (content: string, options?: { format?: 'html' | 'markdown' }) => void
  getHTML: () => string
  getMarkdown: () => string
}

export function RichEditor({ value, onChange, placeholder, onEditorReady, aiConfig }: RichEditorProps) {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [markdownDraft, setMarkdownDraft] = useState('')

  return (
    <div className="novel-editor w-full group relative">
      {isMarkdownMode ? (
        <div className="w-full bg-[#1e1e2e] rounded-2xl border border-gray-800 transition-all overflow-hidden shadow-sm pt-0 min-h-[500px] flex flex-col">
          <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
               <div className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                 Markdown Source
               </div>
            </div>
            <button
              type="button"
              onClick={() => {
                // Return to WYSIWYG
                setIsMarkdownMode(false)
                // Note: The EditorRoot will re-mount. 
                // Since 'value' in the parent has been updated by markdownDraft,
                // the new EditorRoot will receive markdown as its initialContent.
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <Layout className="w-3.5 h-3.5" />
              Kembali ke Visual
            </button>
          </div>
          <textarea
            value={markdownDraft}
            onChange={(e) => {
              const val = e.target.value
              setMarkdownDraft(val)
              // Update parent so that when we switch back or save, the source is preserved
              onChange(val) 
            }}
            placeholder="Tulis markdown di sini..."
            className="flex-1 w-full p-8 font-mono text-sm bg-transparent text-[#cdd6f4] focus:outline-none resize-none min-h-[460px]"
          />
        </div>
      ) : (
        <EditorRoot>
          <EditorContent
            // @ts-ignore - novel typings expect JSONContent but tiptap handles HTML strings natively
            initialContent={value || undefined} 
            extensions={extensions}
            className="relative min-h-[500px] w-full bg-white rounded-2xl border border-gray-200 
                       focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-50 
                       transition-all overflow-hidden shadow-sm pt-0"
            onUpdate={({ editor }) => {
              const content = editor.getHTML(); 
              onChange(content);
            }}
            editorProps={{
              attributes: {
                class: `prose prose-lg prose-stone dark:prose-invert focus:outline-none max-w-full p-8 pt-4`,
              },
            }}
          >
            {/* EDITOR TOOLBAR — must be inside EditorContent for useEditor() context */}
            <EditorToolbar
              aiConfig={aiConfig}
              onEditorReady={onEditorReady}
              onContentChange={onChange}
              onSwitchToMarkdown={(editor) => {
                const md = editor.storage.markdown?.getMarkdown() || ""
                setMarkdownDraft(md)
                setIsMarkdownMode(true)
              }}
            />

            {/* SLASH COMMAND MENU */}
            <EditorCommand className='z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white px-1 py-2 shadow-2xl transition-all'>
              <EditorCommandEmpty className='px-2 py-1 text-sm text-gray-400'>No results found</EditorCommandEmpty>
              <EditorCommandList>
                <EditorCommandItem
                  value='Heading 1'
                  onCommand={({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
                  }}
                  className='flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-amber-50 aria-selected:bg-amber-100'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white'><Heading1 className="w-4 h-4"/></div>
                  <span>Heading 1</span>
                </EditorCommandItem>

                <EditorCommandItem
                  value='Heading 2'
                  onCommand={({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
                  }}
                  className='flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-amber-50 aria-selected:bg-amber-100'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white'><Heading2 className="w-4 h-4"/></div>
                  <span>Heading 2</span>
                </EditorCommandItem>

                <EditorCommandItem
                  value='Bullet List'
                  onCommand={({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                  }}
                  className='flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-amber-50 aria-selected:bg-amber-100'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white'><List className="w-4 h-4"/></div>
                  <span>Bullet List</span>
                </EditorCommandItem>

                <EditorCommandItem
                  value='Numbered List'
                  onCommand={({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                  }}
                  className='flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-amber-50 aria-selected:bg-amber-100'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white'><ListOrdered className="w-4 h-4"/></div>
                  <span>Numbered List</span>
                </EditorCommandItem>

                <EditorCommandItem
                  value='Quote'
                  onCommand={({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
                  }}
                  className='flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-amber-50 aria-selected:bg-amber-100'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white'><Quote className="w-4 h-4"/></div>
                  <span>Quote</span>
                </EditorCommandItem>

                <EditorCommandItem
                  value='Task List'
                  onCommand={({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).toggleTaskList().run();
                  }}
                  className='flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-amber-50 aria-selected:bg-amber-100'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white'><CheckSquare className="w-4 h-4"/></div>
                  <span>Task List</span>
                </EditorCommandItem>

                <EditorCommandItem
                  value='Image'
                  onCommand={({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).run();
                    // Trigger the media picker button click
                    const btn = document.getElementById('editor-media-picker-trigger');
                    btn?.click();
                  }}
                  className='flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-amber-50 aria-selected:bg-amber-100'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white'><ImageIcon className="w-4 h-4"/></div>
                  <span>Sisipkan Gambar</span>
                </EditorCommandItem>

                <EditorCommandItem
                  value='Table'
                  onCommand={({ editor, range }) => {
                    editor.chain().focus().deleteRange(range)
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run();
                  }}
                  className='flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-amber-50 aria-selected:bg-amber-100'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white'><TableIcon className="w-4 h-4"/></div>
                  <span>Tabel</span>
                </EditorCommandItem>
              </EditorCommandList>
            </EditorCommand>

            {/* BUBBLE MENU */}
            <EditorBubble className='flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl'>
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleBold().run()}
                className='flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-amber-50 aria-selected:text-amber-600'
              >
                <Bold className='h-4 w-4' />
              </EditorBubbleItem>
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
                className='flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-amber-50 aria-selected:text-amber-600'
              >
                <Italic className='h-4 w-4' />
              </EditorBubbleItem>
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
                className='flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-amber-50 aria-selected:text-amber-600'
              >
                <Underline className='h-4 w-4' />
              </EditorBubbleItem>
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleCode().run()}
                className='flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-amber-50 aria-selected:text-amber-600'
              >
                <Code className='h-4 w-4' />
              </EditorBubbleItem>
              <EditorBubbleItem
                onSelect={(editor) => {
                  const previousUrl = editor.getAttributes('link').href;
                  const url = window.prompt('URL Tautan:', previousUrl || '');
                  if (url === null) return;
                  if (url === '') {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run();
                    return;
                  }
                  editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
                }}
                className='flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-amber-50 aria-selected:text-amber-600'
              >
                <LinkIcon className='h-4 w-4' />
              </EditorBubbleItem>
              <EditorBubbleItem
                onSelect={(editor) => {
                  const isHighlighted = editor.isActive('highlight', { color: '#FDEAEA' });
                  if (isHighlighted) {
                    editor.chain().focus().unsetHighlight().unsetColor().run();
                  } else {
                    editor.chain().focus().setHighlight({ color: '#FDEAEA' }).setColor('#B85C5C').run();
                  }
                }}
                className='flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-red-50 aria-selected:text-red-600'
              >
                <AlertTriangle className='h-4 w-4' />
              </EditorBubbleItem>
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().deleteSelection().run()}
                className='flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-red-50 aria-selected:text-red-600'
              >
                <Trash2 className='h-4 w-4' />
              </EditorBubbleItem>
            </EditorBubble>
          </EditorContent>
        </EditorRoot>
      )}
    </div>
  )
}

function EditorToolbar({
  onSwitchToMarkdown,
  onEditorReady,
  onContentChange,
  aiConfig,
}: {
  onSwitchToMarkdown: (editor: any) => void
  onEditorReady?: (api: RichEditorHandle | null) => void
  onContentChange: (content: string) => void
  aiConfig?: RichEditorAIConfig
}) {
  const { editor } = useEditor();
  const [activeTool, setActiveTool] = useState<'rewrite' | 'expand' | 'faq' | null>(null)
  const [instruction, setInstruction] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    operation: 'rewrite' | 'expand' | 'faq'
    selection: { from: number; to: number }
    originalText: string
    resultMarkdown: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!onEditorReady) return

    if (!editor) {
      onEditorReady(null)
      return
    }

    const getMarkdown = () => editor.storage.markdown?.getMarkdown?.() || ''
    const syncContent = () => {
      onContentChange(editor.getHTML())
    }

    const api: RichEditorHandle = {
      replaceContent: (content) => {
        editor.commands.setContent(content, true)
        syncContent()
      },
      appendContent: (content, options) => {
        if (options?.format === 'markdown') {
          const currentMarkdown = getMarkdown().trim()
          const nextMarkdown = currentMarkdown
            ? `${currentMarkdown}\n\n${content.trim()}`
            : content.trim()

          editor.commands.setContent(nextMarkdown, true)
          syncContent()
          return
        }

        const currentHTML = editor.getHTML()
        const nextHTML = currentHTML && currentHTML !== '<p></p>'
          ? `${currentHTML}${content}`
          : content

        editor.commands.setContent(nextHTML, true)
        syncContent()
      },
      getHTML: () => editor.getHTML(),
      getMarkdown,
    }

    onEditorReady(api)

    return () => {
      onEditorReady(null)
    }
  }, [editor, onContentChange, onEditorReady])

  if (!editor) return null;

  const selection = editor.state.selection
  const hasSelection = !selection.empty
  const selectedText = hasSelection
    ? editor.state.doc.textBetween(selection.from, selection.to, '\n\n').trim()
    : ''

  const closeAIPanel = () => {
    setActiveTool(null)
    setInstruction('')
    setError(null)
    setPreview(null)
    setCopied(false)
    setIsLoading(false)
  }

  const openAITool = (operation: 'rewrite' | 'expand' | 'faq') => {
    setActiveTool(operation)
    setError(null)
    setPreview(null)
    setCopied(false)
  }

  const runAITool = async (operation: 'rewrite' | 'expand' | 'faq') => {
    if (!aiConfig || !selectedText) return

    setActiveTool(operation)
    setIsLoading(true)
    setError(null)
    setPreview(null)
    setCopied(false)

    const currentSelection = { from: selection.from, to: selection.to }

    try {
      if (operation === 'rewrite') {
        const response = await aiConfig.rewriteSection({
          section_text: selectedText,
          instruction: instruction || undefined,
        })

        if (!response.success) {
          setError(response.error)
          return
        }

        setPreview({
          operation,
          selection: currentSelection,
          originalText: selectedText,
          resultMarkdown: response.data.rewritten_text,
        })
        return
      }

      if (operation === 'expand') {
        const response = await aiConfig.expandSection({
          section_text: selectedText,
          direction: instruction || undefined,
        })

        if (!response.success) {
          setError(response.error)
          return
        }

        setPreview({
          operation,
          selection: currentSelection,
          originalText: selectedText,
          resultMarkdown: response.data.expanded_text,
        })
        return
      }

      const response = await aiConfig.generateFAQ({
        title: aiConfig.title,
        content: selectedText,
      })

      if (!response.success) {
        setError(response.error)
        return
      }

      setPreview({
        operation,
        selection: currentSelection,
        originalText: selectedText,
        resultMarkdown: formatFAQMarkdown(response.data),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI tool gagal dijalankan.')
    } finally {
      setIsLoading(false)
    }
  }

  const replaceSelectionWithPreview = () => {
    if (!preview) return

    editor
      .chain()
      .focus()
      .insertContentAt(preview.selection, markdownRenderer.render(preview.resultMarkdown))
      .run()
    onContentChange(editor.getHTML())

    closeAIPanel()
  }

  const insertPreviewBelowSelection = () => {
    if (!preview) return

    editor
      .chain()
      .focus()
      .insertContentAt(preview.selection.to, `<p></p>${markdownRenderer.render(preview.resultMarkdown)}`)
      .run()
    onContentChange(editor.getHTML())

    closeAIPanel()
  }

  const appendPreviewToEnd = () => {
    if (!preview) return

    const currentHTML = editor.getHTML()
    const nextHTML = currentHTML && currentHTML !== '<p></p>'
      ? `${currentHTML}<p></p>${markdownRenderer.render(preview.resultMarkdown)}`
      : markdownRenderer.render(preview.resultMarkdown)

    editor.commands.setContent(nextHTML, true)
    onContentChange(editor.getHTML())
    closeAIPanel()
  }

  const copyPreview = async () => {
    if (!preview) return

    await navigator.clipboard.writeText(preview.resultMarkdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
      <div className="px-4 py-2 flex items-center gap-2">
        <MediaPicker
          id="editor-media-picker-trigger"
          label="Sisipkan Gambar" 
          onSelect={(item) => {
            if (item.url) {
              editor.chain().focus().setImage({ src: item.url, alt: item.alt_text || item.file_name || 'Gambar sisipan' }).run();
            }
          }} 
        />
        <div className="w-[1px] h-4 bg-gray-200 mx-2" />
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Hapus elemen terpilih"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {aiConfig && (
          <>
            <div className="w-[1px] h-4 bg-gray-200 mx-1" />
            <button
              type="button"
              onClick={() => openAITool('rewrite')}
              disabled={!hasSelection || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Tulis ulang teks yang dipilih"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Rewrite
            </button>
            <button
              type="button"
              onClick={() => openAITool('expand')}
              disabled={!hasSelection || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Perluas teks yang dipilih"
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-500" />
              Expand
            </button>
            <button
              type="button"
              onClick={() => openAITool('faq')}
              disabled={!hasSelection || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Buat FAQ dari teks yang dipilih"
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-amber-500" />
              FAQ
            </button>
          </>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => onSwitchToMarkdown(editor)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-200"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-500" />
          Markdown Mode
        </button>
      </div>

      {aiConfig && activeTool && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-arkara-green">
                {activeTool === 'rewrite' && 'AI Rewrite Selection'}
                {activeTool === 'expand' && 'AI Expand Selection'}
                {activeTool === 'faq' && 'AI Generate FAQ'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Hasil AI selalu ditinjau dulu sebelum mengganti atau menambahkan konten ke editor.
              </p>
            </div>
            <button
              type="button"
              onClick={closeAIPanel}
              className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-200 transition-all"
            >
              Tutup
            </button>
          </div>

          {(activeTool === 'rewrite' || activeTool === 'expand') && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Instruksi Tambahan
              </label>
              <input
                type="text"
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                placeholder={
                  activeTool === 'rewrite'
                    ? 'Contoh: buat lebih ringkas, lebih persuasif, atau lebih formal'
                    : 'Contoh: tambahkan contoh praktis atau langkah yang lebih detail'
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none text-sm"
              />
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Teks Terpilih
            </span>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {selectedText || 'Pilih teks di editor untuk memakai AI tools ini.'}
            </p>
          </div>

          {!preview && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => runAITool(activeTool)}
                disabled={!hasSelection || isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-arkara-amber text-arkara-green text-sm font-bold hover:bg-arkara-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Jalankan AI
              </button>
              {!hasSelection && (
                <span className="text-xs text-red-500">
                  Pilih teks dulu agar tool AI bisa dijalankan.
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Sebelum
                  </span>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {preview.originalText}
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                    Saran AI
                  </span>
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-sans leading-relaxed">
                    {preview.resultMarkdown}
                  </pre>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {(preview.operation === 'rewrite' || preview.operation === 'expand') && (
                  <button
                    type="button"
                    onClick={replaceSelectionWithPreview}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-arkara-amber text-arkara-green text-sm font-bold hover:bg-arkara-amber/90 transition-all"
                  >
                    <Replace className="w-4 h-4" />
                    Replace Selection
                  </button>
                )}
                <button
                  type="button"
                  onClick={insertPreviewBelowSelection}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                >
                  <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                  Insert di Bawah
                </button>
                {preview.operation === 'faq' && (
                  <button
                    type="button"
                    onClick={appendPreviewToEnd}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-amber-300 hover:bg-amber-50 transition-all"
                  >
                    <ArrowDownToLine className="w-4 h-4 text-amber-600" />
                    Append ke Akhir
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyPreview}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  {copied ? <Sparkles className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  {copied ? 'Tersalin' : 'Copy Hasil'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatFAQMarkdown(data: GenerateFAQOutput): string {
  return [
    '## FAQ',
    '',
    ...data.faqs.flatMap((item) => [`### ${item.question}`, '', item.answer, '']),
  ].join('\n').trim()
}
