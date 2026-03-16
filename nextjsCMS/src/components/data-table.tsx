"use client"

import React from 'react'

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'Tidak ada data ditemukan.',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/20 overflow-hidden border border-gray-100">
        <div className="animate-pulse space-y-6 p-10">
          <div className="h-6 bg-gray-100 rounded-full w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/30 overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em] ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-8 py-20 text-center"
                >
                  <p className="text-gray-400 font-bold tracking-tight italic">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="group hover:bg-arkara-cream/30 transition-colors duration-300">
                  {columns.map((col, idx) => (
                    <td
                      key={idx}
                      className={`px-8 py-6 text-sm font-medium text-arkara-green/80 ${col.className || ''}`}
                    >
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
