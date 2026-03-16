"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, Loader2, MousePointer2 } from 'lucide-react'
import { updateCtaSection } from '@/app/cms/settings/actions'

interface CtaFormProps {
  data: any
}

export function CtaForm({ data }: CtaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { register, handleSubmit } = useForm({
    defaultValues: data || {
      headline: '',
      body_text: '',
      button_text: '',
      button_href: '',
    }
  })

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      await updateCtaSection({ ...formData, id: data.id })
      setMessage({ type: 'success', text: 'CTA Section berhasil diperbarui!' })
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
          <MousePointer2 className="w-5 h-5 text-amber-500" />
          CTA Section
        </h2>
        <p className="text-gray-500 text-sm mt-1">Atur bagian Call-to-Action yang muncul di tengah atau bawah halaman.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Headline</label>
          <input
            type="text"
            {...register('headline')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all font-bold text-lg"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Body Text</label>
          <textarea
            {...register('body_text')}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all resize-none"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Label Tombol</label>
            <input
              type="text"
              {...register('button_text')}
              className="w-full px-4 py-2 shadow-sm border border-gray-200 rounded-lg text-sm bg-gray-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">URL Tombol</label>
            <input
              type="text"
              {...register('button_href')}
              className="w-full px-4 py-2 shadow-sm border border-gray-200 rounded-lg text-sm bg-gray-50"
            />
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
          Simpan CTA Section
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
