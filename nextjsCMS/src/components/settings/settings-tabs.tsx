"use client"

import { useState } from 'react'
import { Settings, Menu, Star, MousePointer2, PanelBottom } from 'lucide-react'
import { GeneralForm } from './general-form'
import { HeroForm } from './hero-form'
import { CtaForm } from './cta-form'
import { FooterForm } from './footer-form'
import { NavigationForm } from './navigation-form'

interface SettingsTabsProps {
  initialData: {
    general: any[]
    navigation: any[]
    hero: any
    cta: any
    footer: any
  }
}

export function SettingsTabs({ initialData }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'navigation', label: 'Navigation', icon: Menu },
    { id: 'hero', label: 'Hero Section', icon: Star },
    { id: 'cta', label: 'CTA Section', icon: MousePointer2 },
    { id: 'footer', label: 'Footer', icon: PanelBottom },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-100 text-amber-900 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Form Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {activeTab === 'general' && <GeneralForm data={initialData.general} />}
          {activeTab === 'navigation' && <NavigationForm data={initialData.navigation} />}
          {activeTab === 'hero' && <HeroForm data={initialData.hero} />}
          {activeTab === 'cta' && <CtaForm data={initialData.cta} />}
          {activeTab === 'footer' && <FooterForm data={initialData.footer} />}
        </div>
      </div>
    </div>
  )
}
