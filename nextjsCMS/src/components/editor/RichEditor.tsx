"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
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
  ChevronLeft,
  Layout,
  Table as TableIcon,
  Sparkles,
  Search,
  Loader2
} from 'lucide-react'
import { MediaPicker } from '../media/media-picker'
import MarkdownIt from 'markdown-it'
import { createPortal } from 'react-dom'
import type {
  VerifyLatestFactsInput,
  VerifyLatestFactsOutput,
} from '@/lib/ai/schemas'
import type { InternalLinkAuditResult } from '@/lib/internal-link-opportunities'
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

export interface RichEditorAIConfig {
  title: string
  verifyLatestFacts: (
    input: VerifyLatestFactsInput
  ) => Promise<
    | { success: true; data: VerifyLatestFactsOutput; model: string }
    | { success: false; error: string }
  >
  getInternalLinkSuggestions?: (input: {
    title: string
    content: string
  }) => Promise<InternalLinkAuditResult>
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
  insertContent: (content: string, options?: { format?: 'html' | 'markdown' }) => void
  getHTML: () => string
  getMarkdown: () => string
}

function resolveInternalLinksMenuStage(
  status: 'idle' | 'loading' | 'ready' | 'error'
): 'loading' | 'results' | 'error' {
  if (status === 'error') {
    return 'error'
  }

  if (status === 'loading') {
    return 'loading'
  }

  return 'results'
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
            immediatelyRender={false}
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
  const [selectionAIState, setSelectionAIState] = useState<{
    open: boolean
    stage: 'menu' | 'loading' | 'results'
    mode: 'hallucination' | 'fact_check' | null
    query: string
    selection: { from: number; to: number; text: string } | null
    suggestions: Array<{
      id: string
      label: string
      reason: string
      replacement: string
      status: VerifyLatestFactsOutput['claims'][number]['status']
    }>
    summary: string | null
    error: string | null
  }>({
    open: false,
    stage: 'menu',
    mode: null,
    query: '',
    selection: null,
    suggestions: [],
    summary: null,
    error: null,
  })
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const internalLinksRefreshTimerRef = useRef<number | null>(null)
  const internalLinksCacheRef = useRef<{
    requestKey: string
    status: 'idle' | 'loading' | 'ready' | 'error'
    suggestions: InternalLinkAuditResult['suggestions']
    error: string | null
  }>({
    requestKey: '',
    status: 'idle',
    suggestions: [],
    error: null,
  })
  const [internalLinksMenu, setInternalLinksMenu] = useState<{
    open: boolean
    x: number
    y: number
    stage: 'loading' | 'results' | 'error'
    suggestions: InternalLinkAuditResult['suggestions']
    error: string | null
  }>({
    open: false,
    x: 0,
    y: 0,
    stage: 'loading',
    suggestions: [],
    error: null,
  })
  const [internalLinksCache, setInternalLinksCache] = useState<{
    requestKey: string
    status: 'idle' | 'loading' | 'ready' | 'error'
    suggestions: InternalLinkAuditResult['suggestions']
    error: string | null
  }>({
    requestKey: '',
    status: 'idle',
    suggestions: [],
    error: null,
  })

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
      insertContent: (content, options) => {
        if (options?.format === 'markdown') {
          const html = markdownRenderer.render(content)
          editor.chain().focus().insertContent(html).run()
          syncContent()
          return
        }

        editor.chain().focus().insertContent(content).run()
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

  const selection = editor?.state.selection
  const hasSelection = Boolean(selection && !selection.empty)
  const selectedText = hasSelection && selection
    ? editor.state.doc.textBetween(selection.from, selection.to, '\n\n').trim()
    : ''

  useEffect(() => {
    if (!hasSelection && selectionAIState.open) {
      setSelectionAIState((current) => ({
        ...current,
        open: false,
        stage: 'menu',
        mode: null,
        query: '',
        selection: null,
        suggestions: [],
        summary: null,
        error: null,
      }))
    }
  }, [hasSelection, selectionAIState.open])

  if (!editor || !selection) return null;

  const filteredModes = useMemo(() => {
    const options = [
      {
        id: 'hallucination' as const,
        label: 'Hallucination Check',
        description: 'Cari overclaim, unsupported phrasing, dan bagian yang terasa ngarang.',
        icon: AlertTriangle,
      },
      {
        id: 'fact_check' as const,
        label: 'Fact Check',
        description: 'Cek klaim yang sensitif waktu, angka, regulasi, atau data terbaru.',
        icon: Search,
      },
    ]

    const query = selectionAIState.query.trim().toLowerCase()
    if (!query) {
      return options
    }

    return options.filter((option) =>
      `${option.label} ${option.description}`.toLowerCase().includes(query)
    )
  }, [selectionAIState.query])

  const resetSelectionAI = () => {
    setSelectionAIState({
      open: false,
      stage: 'menu',
      mode: null,
      query: '',
      selection: null,
      suggestions: [],
      summary: null,
      error: null,
    })
  }

  const closeInternalLinksMenu = () => {
    setInternalLinksMenu((current) => ({
      ...current,
      open: false,
      suggestions: [],
      error: null,
      stage: 'loading',
    }))
  }

  useEffect(() => {
    internalLinksCacheRef.current = internalLinksCache
  }, [internalLinksCache])

  const openSelectionAI = () => {
    if (!hasSelection || !selectedText) {
      return
    }

    setSelectionAIState({
      open: true,
      stage: 'menu',
      mode: null,
      query: '',
      selection: {
        from: selection.from,
        to: selection.to,
        text: selectedText,
      },
      suggestions: [],
      summary: null,
      error: null,
    })
  }

  const runSelectionAICheck = async (mode: 'hallucination' | 'fact_check') => {
    if (!aiConfig || !selectionAIState.selection?.text) {
      return
    }

    setSelectionAIState((current) => ({
      ...current,
      stage: 'loading',
      mode,
      error: null,
      suggestions: [],
      summary: null,
    }))

    try {
      const response = await aiConfig.verifyLatestFacts({
        title: aiConfig.title,
        content: selectionAIState.selection.text,
        focus_area:
          mode === 'hallucination'
            ? 'Hallucination check: prioritaskan unsupported, uncertain, overclaim, absolute phrasing, internal inconsistency, dan revisi yang lebih jujur.'
            : 'Fact check: prioritaskan klaim yang sensitif waktu, angka, tanggal, regulasi, safety, dan revisi yang lebih aman secara faktual.',
      })

      if (!response.success) {
        setSelectionAIState((current) => ({
          ...current,
          stage: 'results',
          mode,
          error: response.error,
        }))
        return
      }

      const prioritizedStatuses =
        mode === 'hallucination'
          ? ['unsupported', 'uncertain', 'needs_update', 'needs_web_verification']
          : ['needs_web_verification', 'needs_update', 'unsupported', 'uncertain']

      const suggestions = response.data.claims
        .filter((claim) => claim.suggested_revision?.trim())
        .sort(
          (a, b) =>
            prioritizedStatuses.indexOf(a.status) - prioritizedStatuses.indexOf(b.status)
        )
        .slice(0, 4)
        .map((claim, index) => ({
          id: `${claim.status}-${index}`,
          label:
            mode === 'hallucination'
              ? `Perhalus klaim ${index + 1}`
              : `Perbaiki fakta ${index + 1}`,
          reason: claim.reason,
          replacement: claim.suggested_revision!.trim(),
          status: claim.status,
        }))

      setSelectionAIState((current) => ({
        ...current,
        stage: 'results',
        mode,
        summary: response.data.summary,
        error: null,
        suggestions,
      }))
    } catch (err) {
      setSelectionAIState((current) => ({
        ...current,
        stage: 'results',
        mode,
        error: err instanceof Error ? err.message : 'AI check gagal dijalankan.',
      }))
    }
  }

  const applySelectionSuggestion = (replacement: string) => {
    if (!selectionAIState.selection) {
      return
    }

    editor.chain().focus().insertContentAt(
      {
        from: selectionAIState.selection.from,
        to: selectionAIState.selection.to,
      },
      replacement
    ).run()
    onContentChange(editor.getHTML())
    resetSelectionAI()
  }

  const insertInternalLinkSuggestion = (path: string, anchor: string) => {
    editor.chain().focus().insertContent(`<a href="${path}">${anchor}</a>`).run()
    onContentChange(editor.getHTML())
    closeInternalLinksMenu()
  }

  useEffect(() => {
    if (!editor || !aiConfig?.getInternalLinkSuggestions) {
      return
    }

    const refreshSuggestions = async (force = false) => {
      if (!aiConfig.getInternalLinkSuggestions) {
        return
      }

      const title = aiConfig.title.trim()
      const content = editor.storage.markdown?.getMarkdown?.() || ''
      const requestKey = `${title}::${content}`

      if (!title) {
        setInternalLinksCache({
          requestKey,
          status: 'idle',
          suggestions: [],
          error: null,
        })
        return
      }

      if (
        !force &&
        internalLinksCacheRef.current.requestKey === requestKey &&
        (internalLinksCacheRef.current.status === 'loading' ||
          internalLinksCacheRef.current.status === 'ready')
      ) {
        return
      }

      setInternalLinksCache((current) => ({
        requestKey,
        status: 'loading',
        suggestions: current.requestKey === requestKey ? current.suggestions : current.suggestions,
        error: null,
      }))

      try {
        const result = await aiConfig.getInternalLinkSuggestions({
          title: aiConfig.title,
          content,
        })

        setInternalLinksCache((current) => {
          if (current.requestKey !== requestKey) {
            return current
          }

          return {
            requestKey,
            status: 'ready',
            suggestions: result.suggestions,
            error: null,
          }
        })
      } catch (error) {
        console.error('[internal-links] failed to refresh cached suggestions', error)

        setInternalLinksCache((current) => {
          if (current.requestKey !== requestKey) {
            return current
          }

          return {
            requestKey,
            status: 'error',
            suggestions: [],
            error: error instanceof Error ? error.message : 'Gagal memuat saran internal link.',
          }
        })
      }
    }

    const scheduleRefresh = () => {
      if (internalLinksRefreshTimerRef.current) {
        window.clearTimeout(internalLinksRefreshTimerRef.current)
      }

      internalLinksRefreshTimerRef.current = window.setTimeout(() => {
        void refreshSuggestions()
      }, 800)
    }

    scheduleRefresh()
    editor.on('update', scheduleRefresh)

    return () => {
      if (internalLinksRefreshTimerRef.current) {
        window.clearTimeout(internalLinksRefreshTimerRef.current)
      }

      editor.off('update', scheduleRefresh)
    }
  }, [aiConfig, editor])

  useEffect(() => {
    if (!editor || !aiConfig?.getInternalLinkSuggestions) {
      return
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      resetSelectionAI()

      const position = editor.view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      })

      if (position?.pos != null) {
        editor.chain().focus().setTextSelection(position.pos).run()
      } else {
        editor.chain().focus().run()
      }

      setInternalLinksMenu({
        open: true,
        x: Math.min(event.clientX, window.innerWidth - 340),
        y: Math.min(event.clientY, window.innerHeight - 260),
        stage: resolveInternalLinksMenuStage(internalLinksCacheRef.current.status),
        suggestions: internalLinksCacheRef.current.suggestions,
        error: internalLinksCacheRef.current.error,
      })

    }

    const dom = editor.view.dom
    dom.addEventListener('contextmenu', handleContextMenu, true)

    return () => {
      dom.removeEventListener('contextmenu', handleContextMenu, true)
    }
  }, [aiConfig, editor])

  useEffect(() => {
    if (!internalLinksMenu.open) return

    setInternalLinksMenu((current) => ({
      ...current,
      stage: resolveInternalLinksMenuStage(internalLinksCache.status),
      suggestions: internalLinksCache.suggestions,
      error: internalLinksCache.error,
    }))
  }, [internalLinksCache, internalLinksMenu.open])

  useEffect(() => {
    if (!internalLinksMenu.open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (event.button !== 0) {
        return
      }

      if (contextMenuRef.current?.contains(event.target as Node)) {
        return
      }

      closeInternalLinksMenu()
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeInternalLinksMenu()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('resize', closeInternalLinksMenu)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('resize', closeInternalLinksMenu)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [internalLinksMenu.open])

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

      {internalLinksMenu.open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={contextMenuRef}
              className="fixed z-[9999] w-[320px] overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl"
              style={{ left: internalLinksMenu.x, top: internalLinksMenu.y }}
            >
              <div className="border-b border-red-100 bg-red-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-500">Internal Links</p>
                <p className="mt-1 text-sm font-bold text-red-900">Saran link baru untuk naskah ini</p>
              </div>

              {internalLinksMenu.stage === 'loading' ? (
                <div className="flex items-center gap-3 px-4 py-4 text-sm text-red-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memeriksa konten baru yang relevan...
                </div>
              ) : null}

              {internalLinksMenu.stage === 'error' ? (
                <div className="px-4 py-4 text-sm text-red-700">{internalLinksMenu.error}</div>
              ) : null}

              {internalLinksMenu.stage === 'results' ? (
                internalLinksMenu.suggestions.length > 0 ? (
                  <div className="max-h-[280px] overflow-y-auto p-2">
                    {internalLinksMenu.suggestions.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => insertInternalLinkSuggestion(item.path, item.suggestedAnchor)}
                        className="block w-full rounded-xl px-3 py-3 text-left hover:bg-red-50 transition-colors"
                      >
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-400">
                          {item.type === 'post' ? 'blog' : 'panduan'}
                        </p>
                        <p className="mt-1 text-sm font-bold leading-snug text-red-900">{item.title}</p>
                        <p className="mt-1 font-mono text-[11px] text-red-500">{item.path}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm text-red-700">
                    Belum ada konten baru yang relevan untuk disisipkan.
                  </div>
                )
              ) : null}
            </div>,
            document.body
          )
        : null}

      <EditorBubble
        className={
          selectionAIState.open
            ? 'w-[420px] max-w-[92vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl'
            : 'flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl'
        }
      >
        {selectionAIState.open ? (
          <div className="w-full">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 bg-gray-50/80">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">AI Selection Check</p>
                <p className="text-xs text-gray-500 truncate">
                  {selectionAIState.selection?.text || 'Pilih teks untuk memulai'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectionAIState.stage !== 'menu' && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectionAIState((current) => ({
                        ...current,
                        stage: 'menu',
                        mode: null,
                        query: '',
                        suggestions: [],
                        summary: null,
                        error: null,
                      }))
                    }
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Kembali
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetSelectionAI}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>

            {selectionAIState.stage === 'menu' && (
              <div className="p-3 space-y-3">
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <input
                    type="text"
                    value={selectionAIState.query}
                    onChange={(event) =>
                      setSelectionAIState((current) => ({
                        ...current,
                        query: event.target.value,
                      }))
                    }
                    placeholder="Cari command..."
                    className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                  {filteredModes.length > 0 ? (
                    filteredModes.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => runSelectionAICheck(option.id)}
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                            <Icon className="h-4 w-4 text-gray-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                            <p className="text-xs leading-relaxed text-gray-500">{option.description}</p>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-gray-400">
                      Command tidak ditemukan.
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectionAIState.stage === 'loading' && (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-arkara-amber" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectionAIState.mode === 'hallucination' ? 'Menjalankan Hallucination Check' : 'Menjalankan Fact Check'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Mengolah teks terpilih dan menyiapkan beberapa saran revisi yang bisa langsung dipakai.
                  </p>
                </div>
              </div>
            )}

            {selectionAIState.stage === 'results' && (
              <div className="p-3 space-y-3">
                {selectionAIState.summary && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                      Ringkasan
                    </p>
                    <p className="mt-1 text-sm text-amber-950">{selectionAIState.summary}</p>
                  </div>
                )}

                {selectionAIState.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                    {selectionAIState.error}
                  </div>
                )}

                {!selectionAIState.error && selectionAIState.suggestions.length === 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
                    Tidak ada saran revisi yang cukup kuat untuk mengganti teks ini.
                  </div>
                )}

                {selectionAIState.suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => applySelectionSuggestion(suggestion.replacement)}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm hover:border-arkara-amber/50 hover:bg-amber-50/40 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900">{suggestion.label}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {suggestion.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{suggestion.reason}</p>
                    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <p className="line-clamp-4 text-sm leading-relaxed text-gray-800">
                        {suggestion.replacement}
                      </p>
                    </div>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-arkara-green">
                      Klik untuk replace selection
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
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
            <button
              type="button"
              onClick={openSelectionAI}
              disabled={!aiConfig || !hasSelection}
              className='flex h-10 items-center justify-center gap-1.5 border-l border-gray-200 px-3 text-xs font-bold text-arkara-green hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40'
            >
              <Sparkles className='h-4 w-4 text-arkara-amber' />
              AI
            </button>
          </>
        )}
      </EditorBubble>

    </div>
  )
}
