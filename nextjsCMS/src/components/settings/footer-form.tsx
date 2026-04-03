"use client"

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Save, Loader2, PanelBottom, Plus, Trash2 } from 'lucide-react'
import { updateFooter } from '@/app/cms/settings/actions'

interface FooterFormProps {
  data: any
}

const SOCIAL_PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'tiktok', label: 'TikTok' },
] as const

function normalizeSocialLinks(links: unknown) {
  if (!Array.isArray(links)) return []

  return links.map((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const platform = typeof record.platform === 'string' ? record.platform : 'facebook'
    const normalizedPlatform = platform === 'twitter'
      ? 'x'
      : SOCIAL_PLATFORM_OPTIONS.some((option) => option.value === platform)
        ? platform
        : 'facebook'

    return {
      platform: normalizedPlatform,
      url: typeof record.url === 'string' ? record.url : '',
    }
  })
}

export function FooterForm({ data }: FooterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      tagline: data?.tagline || '',
      copyright_text: data?.copyright_text || '',
      social_links: normalizeSocialLinks(data?.social_links),
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "social_links"
  })

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      await updateFooter({ ...formData, id: data.id })
      setMessage({ type: 'success', text: 'Pengaturan Footer berhasil disimpan!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + (error as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500 text-left">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2" style={{ color: '#1a2e1a' }}>
          <PanelBottom className="w-5 h-5 text-amber-500" />
          Footer Settings
        </h2>
        <p className="text-gray-500 text-sm mt-1">Kelola konten kaki website Arkara.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl">
        {/* Basic Info */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Informasi Dasar</h3>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Footer Tagline</label>
            <input
              type="text"
              {...register('tagline')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Text Hak Cipta (Copyright)</label>
            <input
              type="text"
              {...register('copyright_text')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all text-sm"
              placeholder="© 2026 Arkara"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Social Links</h3>
            <button
              type="button"
              onClick={() => append({ platform: 'facebook', url: '' })}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" /> Tambah Link
            </button>
          </div>
          <p className="text-xs text-gray-500 -mt-3">
            Pilih platform lalu isi URL. Baris bisa ditambah atau dihapus sesuai kebutuhan footer.
          </p>
          
          <div className="space-y-4">
            {fields.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-100 rounded-2xl text-center text-gray-400 italic text-sm">
                Belum ada social link. Klik tombol di atas untuk menambah.
              </div>
            ) : (
              fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                  <div className="flex-1 grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Platform</label>
                      <select 
                        {...register(`social_links.${index}.platform` as any)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">URL</label>
                      <input
                        type="text"
                        {...register(`social_links.${index}.url` as any)}
                        placeholder="https://..."
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2.5 mt-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
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
          Simpan Footer
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
