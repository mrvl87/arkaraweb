"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, Loader2, Star, Type, AlignLeft, Link as LinkIcon } from 'lucide-react'
import { updateHeroSection } from '@/app/cms/settings/actions'

interface HeroFormProps {
  data: any
}

export function HeroForm({ data }: HeroFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { register, handleSubmit } = useForm({
    defaultValues: data || {
      headline: '',
      subheadline: '',
      body_text: '',
      cta_primary_text: '',
      cta_primary_href: '',
      cta_secondary_text: '',
      cta_secondary_href: '',
    }
  })

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      await updateHeroSection({ ...formData, id: data.id })
      setMessage({ type: 'success', text: 'Hero Section berhasil diperbarui!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui: ' + (error as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500 text-left">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2" style={{ color: '#1a2e1a' }}>
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          Hero Section
        </h2>
        <p className="text-gray-500 text-sm mt-1">Kelola konten utama yang muncul di bagian atas homepage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* Content Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Konten Teks</h3>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Type className="w-4 h-4" /> Headline
            </label>
            <input
              type="text"
              {...register('headline')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all font-bold text-lg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Sub-Headline</label>
            <input
              type="text"
              {...register('subheadline')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all text-amber-700"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-gray-400" /> Body Text
            </label>
            <textarea
              {...register('body_text')}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tombol Aksi (CTA)</h3>
          
          <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500">CTA Utama</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  {...register('cta_primary_text')}
                  placeholder="Label"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
                <input
                  type="text"
                  {...register('cta_primary_href')}
                  placeholder="URL"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-xs font-bold text-gray-500">CTA Sekunder</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  {...register('cta_secondary_text')}
                  placeholder="Label"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
                <input
                  type="text"
                  {...register('cta_secondary_href')}
                  placeholder="URL"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Hero Section
        </button>
        {message && (
          <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}
