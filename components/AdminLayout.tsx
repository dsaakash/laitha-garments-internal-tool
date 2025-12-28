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

  useEffect(() => {
    checkAuth().then((auth) => {
      setAuthenticated(auth)
      setLoading(false)
      if (!auth) {
        router.push('/admin/login')
      }
    })
  }, [router])

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-purple-600 to-purple-800 text-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-purple-500 flex-shrink-0">
            <h1 className="text-2xl font-bold">Lalitha Garments</h1>
            <p className="text-purple-200 text-sm mt-1">Admin Portal</p>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'text-purple-100 hover:bg-purple-500'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-purple-500 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-md"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

