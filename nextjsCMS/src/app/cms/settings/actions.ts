"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { triggerFrontendRevalidate } from '@/lib/revalidate'

// 1. General Settings Action
export async function updateGeneralSettings(settings: Record<string, string>) {
  const supabase = await createClient()
  
  // Update each key-value pair
  const updates = Object.entries(settings).map(async ([key, value]) => {
    return supabase
      .from('site_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
  })

  await Promise.all(updates)
  revalidatePath('/cms/settings')
  await triggerFrontendRevalidate({ type: 'settings' })
}

// 2. Navigation Actions
export async function updateNavigationItems(items: any[]) {
  const supabase = await createClient()
  
  // Upsert all items with their sort_order
  const { error } = await supabase
    .from('navigation')
    .upsert(items.map((item, index) => ({
      ...item,
      sort_order: index,
    })))

  if (error) throw new Error(error.message)
  revalidatePath('/cms/settings')
  await triggerFrontendRevalidate({ type: 'settings' })
}

export async function deleteNavigationItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('navigation').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/cms/settings')
  await triggerFrontendRevalidate({ type: 'settings' })
}

// 3. Hero Section Action
export async function updateHeroSection(data: any) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('hero_section')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', data.id)

  if (error) throw new Error(error.message)
  revalidatePath('/cms/settings')
  await triggerFrontendRevalidate({ type: 'settings' })
}

// 4. CTA Section Action
export async function updateCtaSection(data: any) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cta_section')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', data.id)

  if (error) throw new Error(error.message)
  revalidatePath('/cms/settings')
  await triggerFrontendRevalidate({ type: 'settings' })
}

// 5. Footer Action
export async function updateFooter(data: any) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('footer')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', data.id)

  if (error) throw new Error(error.message)
  revalidatePath('/cms/settings')
  await triggerFrontendRevalidate({ type: 'settings' })
}
