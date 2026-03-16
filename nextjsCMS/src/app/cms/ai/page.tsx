import { AIInterface } from '@/components/ai/ai-interface'
import { Sparkles } from 'lucide-react'

export default function AIPage() {
  return (
    <div className="space-y-12 pb-20">
      <div className="text-left border-b border-arkara-green/5 pb-8">
        <h1 className="text-4xl font-extrabold flex items-center gap-4 text-arkara-green uppercase tracking-tighter">
          <div className="bg-arkara-amber p-3 rounded-2xl shadow-lg shadow-arkara-amber/20">
             <Sparkles className="w-8 h-8 text-arkara-green animate-pulse" />
          </div>
          ASISTEN <span className="text-arkara-amber">CERDAS</span>
        </h1>
        <p className="text-gray-500 mt-4 font-medium max-w-2xl leading-relaxed">
           Berdayakan konten survival Anda dengan kecerdasan buatan. Hasilkan kerangka artikel, riset mendalam, atau ringkasan teknis secara instan.
        </p>
      </div>

      <AIInterface />
    </div>
  )
}

