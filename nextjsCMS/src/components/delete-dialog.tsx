"use client"

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteDialogProps {
  title: string
  description?: string
  onConfirm: () => Promise<void>
  trigger?: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
}

export function DeleteDialog({
  title,
  description = "Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen dari server.",
  onConfirm,
  trigger,
  isOpen: propsIsOpen,
  onClose: propsOnClose
}: DeleteDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : internalIsOpen
  const onClose = propsOnClose || (() => setInternalIsOpen(false))

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {trigger && (
        <div onClick={() => setInternalIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      )}

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {description}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    "Hapus Permanen"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
