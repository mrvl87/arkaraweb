"use client"

import { useState } from 'react'
import { Sparkles, Loader2, Type, CheckCircle, X } from 'lucide-react'
import { generateAIImage } from '@/app/cms/media/ai-actions'

export function AIGenerator() {
  const [prompt, setPrompt] = useState('')
  const [contextName, setContextName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim() || !contextName.trim()) {
      setError('Mohon isi prompt dan Alt Text.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      await generateAIImage(prompt, contextName)
      setPrompt('')
      setContextName('')
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat generate gambar.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white/50 border border-amber-100 rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      
      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Generate AI Image
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Gemini 3 Pro Image</span>
            </h3>
            <p className="text-sm text-gray-500">Buat gambar otomatis dengan deskripsi teks (Gemini 3 Pro Image Preview).</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Deskripsi Gambar (Prompt) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Alat survival lengkap di atas meja kayu estetik, pencahayaan dramatis..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all outline-none resize-none min-h-[100px]"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-500" />
              Konteks Gambar (Alt Text & SEO) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contextName}
              onChange={(e) => setContextName(e.target.value)}
              placeholder="Misal: Gear Survival Kit"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all outline-none"
              disabled={isGenerating}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-2">
              <X className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !contextName.trim()}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Membuat Gambar AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate & Simpan ke Galeri
                </>
              )}
            </button>
            <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
               Otomatis dikonversi ke WebP multi-size seperti upload biasa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
