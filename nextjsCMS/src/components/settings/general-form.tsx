"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, Loader2, Globe, Tag, FileText, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { updateGeneralSettings } from '@/app/cms/settings/actions'

interface GeneralFormProps {
  data: any[]
}

export function GeneralForm({ data }: GeneralFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Transform array [{key: '...', value: '...'}] to object {key: value}
  const defaultValues = data.reduce((acc, curr) => {
    acc[curr.key] = curr.value || ''
    return acc
  }, {} as any)

  const { register, handleSubmit } = useForm({
    defaultValues
  })

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      await updateGeneralSettings(formData)
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + (error as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fields = [
    { name: 'site_name', label: 'Nama Website', icon: Globe, placeholder: 'Arkara' },
    { name: 'tagline', label: 'Tagline', icon: Tag, placeholder: 'Survive with Knowledge' },
    { name: 'description', label: 'Deskripsi Website', icon: FileText, isTextArea: true },
    { name: 'site_url', label: 'URL Website', icon: LinkIcon, placeholder: 'https://arkara.id' },
    { name: 'og_image', label: 'OG Image URL (Default)', icon: ImageIcon, placeholder: '/images/og-default.webp' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500 text-left">
      <div>
        <h2 className="text-xl font-bold text-gray-900" style={{ color: '#1a2e1a' }}>General Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Konfigurasi dasar website Arkara.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <field.icon className="w-4 h-4 text-gray-400" />
              {field.label}
            </label>
            {field.isTextArea ? (
              <textarea
                {...register(field.name)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all resize-none"
              />
            ) : (
              <input
                type="text"
                {...register(field.name)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
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
