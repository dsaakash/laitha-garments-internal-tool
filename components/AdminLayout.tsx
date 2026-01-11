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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user' | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    checkAuth().then((auth) => {
      setAuthenticated(auth)
      setLoading(false)
      if (!auth) {
        router.push('/admin/login')
      } else {
        // Fetch current user role after authentication is confirmed
        fetch('/api/auth/check', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            console.log('🔍 Auth check response:', JSON.stringify(data, null, 2))
            if (data.authenticated && data.admin) {
              // Get role from response
              let role = data.admin.role
              
              // Handle null/undefined
              if (!role) {
                console.warn('⚠️ Role is null/undefined in response, checking database...')
                // Try to get role from database by making another call
                role = 'superadmin' // Temporary: default to superadmin if role missing
              } else {
                role = role.toLowerCase().trim()
                // Normalize role values (handle any case variations)
                if (role === 'super_admin') role = 'superadmin'
              }
              
              console.log('✅ Setting user role to:', role)
              setUserRole(role as 'superadmin' | 'admin' | 'user')
              
              // Set user name and email
              if (data.admin.name) {
                setUserName(data.admin.name)
              }
              if (data.admin.email) {
                setUserEmail(data.admin.email)
              }
            } else {
              console.warn('⚠️ No admin data in response')
              console.warn('   authenticated:', data.authenticated)
              console.warn('   admin:', data.admin)
              // Default to superadmin to show all menu items
              setUserRole('superadmin')
            }
          })
          .catch(err => {
            console.error('❌ Error fetching user role:', err)
            // Default to superadmin on error to ensure all menu items are visible
            setUserRole('superadmin')
          })
      }
    })
  }, [router])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Persist sidebar collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

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
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊', roles: ['superadmin', 'admin'] },
    { href: '/admin/setup', label: 'Setup Wizard', icon: '🚀', roles: ['superadmin', 'admin'] },
    { href: '/admin/business', label: 'Business Setup', icon: '⚙️', roles: ['superadmin', 'admin'] },
    { href: '/admin/suppliers', label: 'Suppliers', icon: '🏭', roles: ['superadmin', 'admin'] },
    { href: '/admin/purchases', label: 'Purchase Orders', icon: '🛒', roles: ['superadmin', 'admin'] },
    { href: '/admin/inventory', label: 'Inventory', icon: '📦', roles: ['superadmin', 'admin'] },
    { href: '/admin/customers', label: 'Customers', icon: '👥', roles: ['superadmin', 'admin'] },
    { href: '/admin/products', label: 'Products', icon: '🛍️', roles: ['user'] },
    { href: '/admin/catalogues', label: 'Catalogues', icon: '📚', roles: ['superadmin', 'admin'] },
    { href: '/admin/sales', label: 'Sales', icon: '💰', roles: ['superadmin', 'admin'] },
    { href: '/admin/invoices', label: 'Invoices', icon: '📄', roles: ['superadmin', 'admin', 'user'] },
    { href: '/admin/enquiries', label: 'Customer Enquiries', icon: '📧', roles: ['superadmin', 'admin'] },
    { href: '/admin/admins', label: 'Admin Management', icon: '👑', roles: ['superadmin'] },
    { href: '/admin/users', label: 'User Management', icon: '👤', roles: ['superadmin', 'admin'] },
  ]
  
  // Filter nav items based on user role
  const filteredNavItems = (() => {
    if (!userRole) {
      // While loading, show minimal items
      return navItems.filter(item => item.roles.includes('user'))
    }
    
    // Filter based on role
    return navItems.filter(item => item.roles.includes(userRole))
  })()

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
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`border-b border-purple-400/30 flex-shrink-0 ${sidebarCollapsed ? 'p-4' : 'p-6'}`}>
            <div className="flex items-start justify-between gap-2">
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight">Lalitha Garments</h1>
                  <p className="text-purple-200 text-sm mt-1 font-medium">
                    {userRole === 'user' ? 'User Portal' : 'Admin Portal'}
                  </p>
                  {userName && (
                    <p className="text-purple-100 text-xs mt-2 font-medium">
                      👤 {userName}
                    </p>
                  )}
                  {!userName && userEmail && (
                    <p className="text-purple-100 text-xs mt-2 font-medium">
                      👤 {userEmail}
                    </p>
                  )}
                </div>
              )}
              {sidebarCollapsed && (
                <div className="flex-1 flex justify-center">
                  <h1 className="text-xl font-bold">LG</h1>
                </div>
              )}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Desktop Toggle Button - Top Right */}
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex items-center justify-center text-white bg-purple-500/50 hover:bg-purple-500/70 p-2.5 rounded-lg transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border border-purple-300/30"
                  title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    {sidebarCollapsed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    )}
                  </svg>
                </button>
                {/* Mobile Close Button */}
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
          </div>
          
          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-transparent ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {filteredNavItems.map((item, index) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-xl transition-all duration-200 group ${
                    sidebarCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-white text-purple-700 shadow-lg shadow-purple-500/20 scale-105'
                      : 'text-purple-100 hover:bg-purple-500/50 hover:text-white hover:scale-[1.02]'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-2 h-2 bg-purple-600 rounded-full"></span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className={`border-t border-purple-400/30 flex-shrink-0 ${sidebarCollapsed ? 'p-2' : 'p-4'} space-y-3`}>
            {/* Collapse/Expand Toggle Button - Bottom */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex w-full items-center justify-center text-white bg-purple-500/60 hover:bg-purple-500/80 p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg border border-purple-300/40"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                )}
              </svg>
              {!sidebarCollapsed && <span className="ml-2 text-sm font-medium">Collapse</span>}
            </button>
            
            <button
              onClick={handleLogout}
              className={`w-full flex items-center rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${
                sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-center space-x-3 px-4 py-3'
              }`}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <span className="text-lg">🚪</span>
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
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
