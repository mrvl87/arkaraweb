import Link from 'next/link'

export default function AIGeneratorPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold mb-4" style={{ color: '#1a2e1a' }}>
        AI Generator
      </h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        AI Generator — Coming Soon (Part 5)
      </p>
      <Link
        href="/cms/dashboard"
        className="px-6 py-2 rounded-lg font-medium"
        style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
      >
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
