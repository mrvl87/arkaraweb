"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, Loader2, Type, CheckCircle, X, Wrench, Brush, ImagePlus, Trash2 } from 'lucide-react'
import { generateAIImage } from '@/app/cms/media/ai-actions'
import { removeTemporaryReferenceImage, uploadTemporaryReferenceImage } from '@/app/cms/media/actions'
import { useRouter } from 'next/navigation'

type GeneratorMode = 'illustration' | 'technical'

interface TemporaryReferenceImage {
  publicUrl: string
  path: string
  mimeType: string
  size: number
}

export function AIGenerator() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [contextName, setContextName] = useState('')
  const [mode, setMode] = useState<GeneratorMode>('illustration')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploadingReference, setIsUploadingReference] = useState(false)
  const [referenceImage, setReferenceImage] = useState<TemporaryReferenceImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modeCopy = useMemo(() => ({
    illustration: {
      label: 'Illustration',
      helper: 'Text-to-image untuk thumbnail atau ilustrasi editorial ringan.',
      icon: Brush,
    },
    technical: {
      label: 'Technical drawing',
      helper: 'Lebih ketat untuk alat, bahan, susunan, dan detail proses. Reference image opsional aktif di mode ini.',
      icon: Wrench,
    },
  }), [])

  useEffect(() => {
    return () => {
      if (referenceImage?.path) {
        void removeTemporaryReferenceImage(referenceImage.path)
      }
    }
  }, [referenceImage?.path])

  const handleReferenceFileChange = async (file: File | null) => {
    if (!file) return

    setIsUploadingReference(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      if (referenceImage?.path) {
        await removeTemporaryReferenceImage(referenceImage.path)
      }

      const uploaded = await uploadTemporaryReferenceImage(formData)
      setReferenceImage(uploaded)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat upload reference image.')
    } finally {
      setIsUploadingReference(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveReference = async () => {
    if (!referenceImage?.path) {
      setReferenceImage(null)
      return
    }

    try {
      await removeTemporaryReferenceImage(referenceImage.path)
    } finally {
      setReferenceImage(null)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || !contextName.trim()) {
      setError('Mohon isi prompt dan Alt Text.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      await generateAIImage({
        prompt,
        contextName,
        mode,
        referenceImage: mode === 'technical' ? referenceImage : null,
      })
      setPrompt('')
      setContextName('')
      setReferenceImage(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat generate gambar.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white border border-amber-100 rounded-[28px] p-6 lg:p-7 shadow-sm">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-gray-900">Generate AI Image</h3>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                  Nano Banana 2
                </span>
              </div>
              <p className="max-w-2xl text-sm text-gray-500">
                Gunakan generator ringkas untuk ilustrasi editorial atau gambar teknis dengan detail yang lebih terkendali.
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
            {(['illustration', 'technical'] as GeneratorMode[]).map((value) => {
              const config = modeCopy[value]
              const Icon = config.icon
              const active = mode === value

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">{modeCopy[mode].label}.</span> {modeCopy[mode].helper}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Deskripsi Gambar (Prompt) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'technical'
                  ? 'Contoh: susunan alat pemurni air darurat di meja kerja, botol, pipa, kain saring, arang aktif, potongan proses perakitan yang jelas dan realistis...'
                  : 'Contoh: ilustrasi editorial alat survival di meja kayu, pencahayaan hangat, komposisi bersih, premium, siap jadi thumbnail...'
              }
              className="h-56 w-full resize-none overflow-y-auto rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
              disabled={isGenerating || isUploadingReference}
            />
            <p className="mt-2 text-xs text-gray-400">
              Prompt panjang tetap boleh, tapi jaga tetap konkret agar token tidak boros dan hasil lebih presisi.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Type className="h-4 w-4 text-amber-500" />
                Konteks Gambar (Alt Text & SEO) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contextName}
                onChange={(e) => setContextName(e.target.value)}
                placeholder="Misal: gear survival kit rumahan"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                disabled={isGenerating || isUploadingReference}
              />
            </div>

            {mode === 'technical' && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Reference Image</p>
                    <p className="text-xs text-gray-500">
                      Opsional. Gunakan jika Anda ingin struktur, alat, atau proporsi lebih mirip referensi.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                    Optional
                  </span>
                </div>

                {referenceImage ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <img
                        src={referenceImage.publicUrl}
                        alt="Reference preview"
                        className="h-40 w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        Reference aktif. Akan dipakai sekali lalu dibersihkan otomatis setelah generate.
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveReference}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        disabled={isGenerating || isUploadingReference}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReferenceFileChange(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating || isUploadingReference}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300 bg-white px-4 py-6 text-sm font-semibold text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploadingReference ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mengunggah reference...
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4" />
                          Tambahkan Reference Image
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-400">
                      File akan dioptimasi ringan ke bucket sementara agar input tetap efisien.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Preset Aktif
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  {mode === 'illustration'
                    ? 'Text-to-image ringan dengan output lebih hemat token untuk visual thumbnail/editorial.'
                    : 'Preset teknis lebih ketat untuk menjaga alat, detail, relasi komponen, dan proses tetap terbaca.'}
                </li>
                <li>
                  {mode === 'illustration'
                    ? 'Ukuran gambar default dibuat lebih efisien untuk eksplorasi cepat.'
                    : 'Ukuran gambar dijaga tetap efisien sambil memberi ruang detail lebih stabil.'}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-xs text-gray-400">
            Output akan otomatis diproses ke WebP multi-size dan masuk ke galeri seperti upload biasa.
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isUploadingReference || !prompt.trim() || !contextName.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Membuat Gambar AI...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Generate & Simpan ke Galeri
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
