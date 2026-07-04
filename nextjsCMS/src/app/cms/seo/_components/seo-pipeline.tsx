import { Target } from 'lucide-react'

const pipelineSteps = [
  'Audit konten',
  'Keyword gap',
  'Content brief',
  'Writer agent',
  'Visibility check',
]

export function SeoPipeline() {
  return (
    <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-md bg-arkara-cream p-2 text-arkara-green">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pipeline</p>
          <h2 className="text-xl font-black text-arkara-green">Urutan kerja berikutnya</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {pipelineSteps.map((step, index) => (
          <div key={step} className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-arkara-amber">Step {index + 1}</p>
            <p className="text-sm font-black text-arkara-green">{step}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
