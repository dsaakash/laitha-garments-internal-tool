'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { checkAuth, logout } from '@/lib/auth'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    checkAuth().then((auth) => {
      setAuthenticated(auth)
      setLoading(false)
      if (!auth) {
        router.push('/admin/login')
      }
    })
  }, [router])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/setup', label: 'Setup Wizard', icon: '🚀' },
    { href: '/admin/business', label: 'Business Setup', icon: '⚙️' },
    { href: '/admin/suppliers', label: 'Suppliers', icon: '🏭' },
    { href: '/admin/purchases', label: 'Purchase Orders', icon: '🛒' },
    { href: '/admin/inventory', label: 'Inventory', icon: '📦' },
    { href: '/admin/customers', label: 'Customers', icon: '👥' },
    { href: '/admin/catalogues', label: 'Catalogues', icon: '📚' },
    { href: '/admin/sales', label: 'Sales', icon: '💰' },
    { href: '/admin/invoices', label: 'Invoices', icon: '📄' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-purple-400/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Lalitha Garments</h1>
                <p className="text-purple-200 text-sm mt-1 font-medium">Admin Portal</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-purple-200 hover:text-white p-2 rounded-lg hover:bg-purple-500/50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-transparent">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-white text-purple-700 shadow-lg shadow-purple-500/20 scale-105'
                      : 'text-purple-100 hover:bg-purple-500/50 hover:text-white hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-2 h-2 bg-purple-600 rounded-full"></span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-purple-400/30 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-md sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 hover:text-purple-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Lalitha Garments</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
