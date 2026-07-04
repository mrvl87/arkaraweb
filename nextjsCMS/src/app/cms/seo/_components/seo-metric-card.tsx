import type { LucideIcon } from 'lucide-react'

const formatter = new Intl.NumberFormat('id-ID')

interface SeoMetricCardProps {
  label: string
  value: number
  icon: LucideIcon
  suffix?: string
  helperText?: string
}

export function SeoMetricCard({
  label,
  value,
  suffix,
  helperText,
  icon: Icon,
}: SeoMetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="rounded-md bg-arkara-cream p-2 text-arkara-green">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-300">SEO</span>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-arkara-green">
        {formatter.format(value)}
        {suffix ? <span className="text-lg text-arkara-amber">{suffix}</span> : null}
      </p>
      {helperText ? (
        <p className="mt-2 text-xs font-semibold leading-relaxed text-gray-400">{helperText}</p>
      ) : null}
    </div>
  )
}
