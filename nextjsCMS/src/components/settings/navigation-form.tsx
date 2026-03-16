"use client"

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Save, Loader2, ExternalLink, Power } from 'lucide-react'
import { updateNavigationItems, deleteNavigationItem } from '@/app/cms/settings/actions'
import { v4 as uuidv4 } from 'uuid'

interface NavigationFormProps {
  data: any[]
}

export function NavigationForm({ data }: NavigationFormProps) {
  const [items, setItems] = useState(data.sort((a, b) => a.sort_order - b.sort_order))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      label: 'Menu Baru',
      href: '/',
      sort_order: items.length,
      is_external: false,
      is_active: true,
    }
    setItems([...items, newItem])
  }

  const removeItem = async (id: string, index: number) => {
    // If it's an existing item (UUID vs temporary ID - though here we use uuidv4 always for UI)
    // Actually, check if it exists in the original 'data' 
    const isExisting = data.some(d => d.id === id)
    
    if (isExisting) {
      if (confirm('Hapus item menu ini permanen?')) {
        try {
          await deleteNavigationItem(id)
          setItems(items.filter(item => item.id !== id))
        } catch (error) {
          alert('Gagal menghapus: ' + (error as Error).message)
        }
      }
    } else {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const onSubmit = async () => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      await updateNavigationItems(items)
      setMessage({ type: 'success', text: 'Navigasi berhasil diperbarui!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui: ' + (error as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simple move up/down instead of full dnd kit for now to speed up implementation
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[newIndex]
    newItems[newIndex] = temp
    setItems(newItems)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ color: '#1a2e1a' }}>Header Navigation</h2>
          <p className="text-gray-500 text-sm mt-1">Susun menu navigasi publik website.</p>
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-100"
        >
          <Plus className="w-4 h-4" /> Tambah Menu
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center text-gray-400">
            Daftar menu kosong. Klik tombol di atas untuk menambah.
          </div>
        ) : (
          items.map((item, index) => (
            <div 
              key={item.id} 
              className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                !item.is_active ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-300 hover:text-amber-600 disabled:opacity-20"
                >
                  <GripVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Label Menu</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-100 focus:border-amber-500 outline-none text-sm font-medium"
                  />
                </div>
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">HREF / URL</label>
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => updateItem(index, 'href', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-100 focus:border-amber-500 outline-none text-sm font-mono"
                  />
                </div>
                
                <div className="md:col-span-3 flex items-center gap-4 pt-4">
                  <button
                    onClick={() => updateItem(index, 'is_external', !item.is_external)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                      item.is_external ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}
                  >
                    <ExternalLink className="w-3 h-3" /> External
                  </button>
                  <button
                    onClick={() => updateItem(index, 'is_active', !item.is_active)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                      item.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'
                    }`}
                  >
                    <Power className="w-3 h-3" /> {item.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => removeItem(item.id, index)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-all ml-auto focus:bg-red-50 rounded-lg outline-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t flex items-center gap-4">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Urutan & Data Navigasi
        </button>
        {message && (
          <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  )
}
