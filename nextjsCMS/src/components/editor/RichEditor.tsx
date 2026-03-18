"use client"

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
  TiptapImage
} from 'novel'
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
  Type
} from 'lucide-react'
import { useState } from 'react'
import "./editor.css"

// Predefined extensions for Arkara
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
]

interface RichEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  return (
    <div className="novel-editor w-full group relative">
      <EditorRoot>
        <EditorContent
          initialContent={undefined} 
          extensions={extensions}
          className="relative min-h-[500px] w-full bg-white rounded-2xl border border-gray-200 
                     focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-50 
                     transition-all overflow-hidden shadow-sm pt-4"
          onUpdate={({ editor }) => {
            // For now sending HTML as fallback since we haven't integrated a markdown serializer extension yet
            const content = editor.getHTML(); 
            onChange(content);
          }}
          editorProps={{
            attributes: {
              class: `prose prose-lg prose-stone dark:prose-invert focus:outline-none max-w-full p-8`,
            },
          }}
        >
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
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  )
}
