import { createClient } from '@/lib/supabase/server'
import { CMSLayoutClient } from '@/components/cms-layout-client'
import { redirect } from 'next/navigation'

export default async function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50">
      <CMSLayoutClient user={user}>
        {children}
      </CMSLayoutClient>
    </div>
  )
}
