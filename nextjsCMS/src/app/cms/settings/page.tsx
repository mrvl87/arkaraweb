import { createClient } from '@/lib/supabase/server'
import { SettingsTabs } from '@/components/settings/settings-tabs'

export default async function SettingsPage() {
  const supabase = await createClient()

  // 1. Fetch Site Settings (Key-Value)
  let { data: general } = await supabase.from('site_settings').select('*')
  
  // Initialize general settings if empty
  if (!general || general.length === 0) {
    const initialSettings = [
      { key: 'site_name', value: 'Arkara' },
      { key: 'tagline', value: 'Knowledge for the Unprepared' },
      { key: 'description', value: 'Platform pengetahuan survival dan kesiapsiagaan.' },
      { key: 'site_url', value: 'https://arkara.id' },
      { key: 'og_image', value: '' }
    ]
    await supabase.from('site_settings').insert(initialSettings)
    const { data } = await supabase.from('site_settings').select('*')
    general = data
  }

  // 2. Fetch Navigation
  const { data: navigation } = await supabase
    .from('navigation')
    .select('*')
    .order('sort_order', { ascending: true })

  // 3. Fetch Hero Section (Single Row)
  let { data: heroData } = await supabase.from('hero_section').select('*').single()
  if (!heroData) {
    const { data } = await supabase.from('hero_section').insert({
      headline: 'Siap Hadapi Apapun',
      subheadline: 'Survival Knowledge Platform',
      body_text: 'Pelajari teknik bertahan hidup, manajemen sumber daya, dan kesiapsiagaan bencana.',
    }).select().single()
    heroData = data
  }

  // 4. Fetch CTA Section (Single Row)
  let { data: ctaData } = await supabase.from('cta_section').select('*').single()
  if (!ctaData) {
    const { data } = await supabase.from('cta_section').insert({
      headline: 'Mulai Belajar Sekarang',
      body_text: 'Dapatkan akses ke ratusan panduan teknis dan artikel survival.',
    }).select().single()
    ctaData = data
  }

  // 5. Fetch Footer (Single Row)
  let { data: footerData } = await supabase.from('footer').select('*').single()
  if (!footerData) {
    const { data } = await supabase.from('footer').insert({
      tagline: 'Arkara - Survival Knowledge Platform',
      copyright_text: `© ${new Date().getFullYear()} Arkara`,
      social_links: []
    }).select().single()
    footerData = data
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="text-left">
        <h1 className="text-3xl font-bold" style={{ color: '#1a2e1a' }}>
          Site Settings
        </h1>
        <p className="text-gray-500 mt-1">Kelola konfigurasi website, navigasi, dan konten bagian statis.</p>
      </div>

      <SettingsTabs 
        initialData={{
          general: general || [],
          navigation: navigation || [],
          hero: heroData,
          cta: ctaData,
          footer: footerData
        }} 
      />
    </div>
  )
}

