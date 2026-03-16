import { AIInterface } from '@/components/ai/ai-interface'
import { Sparkles } from 'lucide-react'

export default function AIPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="text-left">
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: '#1a2e1a' }}>
          <Sparkles className="w-8 h-8 text-amber-500" />
          AI Content Assistant
        </h1>
        <p className="text-gray-500 mt-1">Dapatkan bantuan cerdas untuk riset dan penulisan konten survival.</p>
      </div>

      <AIInterface />
    </div>
  )
}

