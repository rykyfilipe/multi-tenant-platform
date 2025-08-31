"use client"

import React, { useState } from "react"
import { PremiumTabs, PremiumTabsList, PremiumTabsTrigger, PremiumTabsContent, PremiumTabNavigation, PremiumTabContentWrapper } from "./premium-tabs"
import { motion } from "framer-motion"
import { 
  Home, 
  User, 
  Settings, 
  BarChart3, 
  Database, 
  Shield, 
  CreditCard,
  Zap,
  Building2,
  Globe,
  Palette
} from "lucide-react"

export function PremiumTabsDemo() {
  const [activeTab, setActiveTab] = useState("home")
  const [activeSidebarTab, setActiveSidebarTab] = useState("dashboard")

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ]

  const sidebarTabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, description: "Overview and metrics" },
    { id: "database", label: "Database", icon: Database, description: "Data management" },
    { id: "security", label: "Security", icon: Shield, description: "Access control" },
    { id: "billing", label: "Billing", icon: CreditCard, description: "Payment & plans" },
    { id: "integrations", label: "Integrations", icon: Zap, description: "Third-party apps" },
    { id: "organization", label: "Organization", icon: Building2, description: "Team settings" },
    { id: "localization", label: "Localization", icon: Globe, description: "Language & region" },
    { id: "themes", label: "Themes", icon: Palette, description: "Visual customization" },
  ]

  return (
    <div className="p-8 space-y-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent mb-4">
          Premium Tab System
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Experience luxury design with smooth animations, premium styling, and exceptional UX
        </p>
      </div>

      {/* Default Tabs */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6 text-center">
          Default Tabs
        </h2>
        <PremiumTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <PremiumTabsList className="w-full justify-center mb-8">
            {tabs.map((tab) => (
              <PremiumTabsTrigger key={tab.id} value={tab.id} className="px-6 py-3">
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </PremiumTabsTrigger>
            ))}
          </PremiumTabsList>

          {tabs.map((tab) => (
            <PremiumTabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <tab.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                  {tab.label} Content
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  This is the {tab.label.toLowerCase()} tab content with premium styling and smooth animations.
                </p>
              </motion.div>
            </PremiumTabsContent>
          ))}
        </PremiumTabs>
      </div>

      {/* Pill Tabs */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6 text-center">
          Pill Tabs
        </h2>
        <PremiumTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <PremiumTabsList variant="pills" className="w-full justify-center mb-8">
            {tabs.map((tab) => (
              <PremiumTabsTrigger key={tab.id} value={tab.id} variant="pills" className="px-6 py-3">
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </PremiumTabsTrigger>
            ))}
          </PremiumTabsList>

          {tabs.map((tab) => (
            <PremiumTabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <tab.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                  {tab.label} Content
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Pill-style tabs with rounded corners and premium hover effects.
                </p>
              </motion.div>
            </PremiumTabsContent>
          ))}
        </PremiumTabs>
      </div>

      {/* Underline Tabs */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6 text-center">
          Underline Tabs
        </h2>
        <PremiumTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <PremiumTabsList variant="underline" className="w-full justify-center mb-8">
            {tabs.map((tab) => (
              <PremiumTabsTrigger key={tab.id} value={tab.id} variant="underline" className="px-6 py-3">
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </PremiumTabsTrigger>
            ))}
          </PremiumTabsList>

          {tabs.map((tab) => (
            <PremiumTabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <tab.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                  {tab.label} Content
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Clean underline tabs with smooth transitions and elegant styling.
                </p>
              </motion.div>
            </PremiumTabsContent>
          ))}
        </PremiumTabs>
      </div>

      {/* Card Tabs */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6 text-center">
          Card Tabs
        </h2>
        <PremiumTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <PremiumTabsList variant="cards" className="w-full justify-center mb-8">
            {tabs.map((tab) => (
              <PremiumTabsTrigger key={tab.id} value={tab.id} variant="cards" className="px-6 py-3">
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </PremiumTabsTrigger>
            ))}
          </PremiumTabsList>

          {tabs.map((tab) => (
            <PremiumTabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <tab.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                  {tab.label} Content
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Card-style tabs with elevated design and premium shadows.
                </p>
              </motion.div>
            </PremiumTabsContent>
          ))}
        </PremiumTabs>
      </div>

      {/* Sidebar Navigation */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6 text-center">
          Sidebar Navigation
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                Navigation
              </h3>
              <PremiumTabNavigation
                tabs={sidebarTabs}
                activeTab={activeSidebarTab}
                onTabChange={setActiveSidebarTab}
                variant="sidebar"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <PremiumTabContentWrapper isActive={true}>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    {React.createElement(sidebarTabs.find(t => t.id === activeSidebarTab)?.icon || Settings, { className: "w-10 h-10 text-primary" })}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    {sidebarTabs.find(t => t.id === activeSidebarTab)?.label} Content
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {sidebarTabs.find(t => t.id === activeSidebarTab)?.description}
                  </p>
                </div>
              </div>
            </PremiumTabContentWrapper>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6 text-center">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Smooth Animations", description: "Framer Motion powered transitions" },
            { icon: Palette, title: "Premium Design", description: "Luxury styling with gradients" },
            { icon: Shield, title: "Accessibility", description: "Full keyboard and screen reader support" },
            { icon: Smartphone, title: "Responsive", description: "Perfect on all device sizes" },
            { icon: Settings, title: "Customizable", description: "Multiple variants and themes" },
            { icon: Heart, title: "User Experience", description: "Intuitive and delightful interactions" },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Missing icon components
const Smartphone = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const Heart = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)
