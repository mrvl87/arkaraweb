"use client"

import { useState } from 'react'
import { Sparkles, Send, Copy, Check, RotateCcw, Lightbulb, Terminal, Search, AlertTriangle, Loader2 } from 'lucide-react'
import { AI_TEMPLATES } from './prompt-templates'
import { generateAIContent } from '@/app/cms/ai/actions'

const iconMap: any = {
  Lightbulb,
  Terminal,
  Search,
  AlertTriangle,
}

export function AIInterface() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt
    if (!finalPrompt.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const data = await generateAIContent(finalPrompt)
      setResult(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi AI.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      {/* Input Side */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ color: '#1a2e1a' }}>
              <Sparkles className="w-5 h-5 text-amber-500" />
              Tanya Asisten Arkara
            </h2>
            <p className="text-sm text-gray-500">Gunakan AI untuk membuat draf konten survival Anda.</p>
          </div>

          <div className="space-y-4">
             <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Buat draf artikel tentang cara mencari air di hutan hujan..."
                className="w-full h-40 px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all outline-none resize-none text-sm"
             />
             
             <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-100"
                style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
             >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sedang Berpikir...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Konten
                  </>
                )}
             </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">Template Cepat</h3>
           <div className="grid grid-cols-1 gap-2">
              {AI_TEMPLATES.map((t) => {
                const Icon = iconMap[t.icon]
                return (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t.prompt)}
                    className="flex items-center gap-3 p-3 text-left bg-white border border-gray-100 rounded-2xl hover:border-amber-200 hover:bg-amber-50 transition-all group"
                  >
                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-amber-900">{t.label}</span>
                  </button>
                )
              })}
           </div>
        </div>
      </div>

      {/* Result Side */}
      <div className="lg:col-span-7">
        <div className="bg-white h-full min-h-[500px] rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Hasil Generate</span>
              <div className="flex items-center gap-2">
                 <button
                   onClick={() => setResult('')}
                   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                   title="Reset"
                 >
                    <RotateCcw className="w-4 h-4" />
                 </button>
                 <button
                   onClick={handleCopy}
                   disabled={!result}
                   className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                 >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Teks
                      </>
                    )}
                 </button>
              </div>
           </div>

           <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
              {result ? (
                <div className="prose prose-amber max-w-none text-gray-800 font-serif">
                   {/* In a real app we would use react-markdown, here we display as pre-wrap for simplicity in this demo */}
                   <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed animate-in fade-in slide-in-from-top-4 duration-500">
                      {result}
                   </pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-gray-200" />
                   </div>
                   <div className="max-w-xs">
                      <p className="text-sm font-bold text-gray-400">Belum ada konten.</p>
                      <p className="text-xs text-gray-300 mt-1">Masukkan prompt di kiri untuk mulai berkolaborasi dengan AI.</p>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
