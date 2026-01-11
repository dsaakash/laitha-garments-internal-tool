'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, checkAuth } from '@/lib/auth'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin')

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (authenticated) {
        // Check user role to redirect appropriately
        fetch('/api/auth/check', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.authenticated && data.admin) {
              const role = (data.admin.role || 'admin').toLowerCase().trim()
              if (role === 'user') {
                router.push('/admin/products')
              } else {
                router.push('/admin/dashboard')
              }
            } else {
              router.push('/admin/dashboard')
            }
          })
          .catch(() => {
            router.push('/admin/dashboard')
          })
      } else {
        setChecking(false)
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        // Check user role to redirect appropriately
        // If user tab is selected, try to verify it's actually a user
        if (activeTab === 'user') {
          // Verify the logged-in user is actually a user
          const checkRes = await fetch('/api/auth/check', { credentials: 'include' })
          const checkData = await checkRes.json()
          if (checkData.authenticated && checkData.admin) {
            const role = (checkData.admin.role || 'admin').toLowerCase().trim()
            if (role === 'user') {
              router.push('/admin/products')
            } else {
              setError('This account is not a user account. Please use the Admin tab.')
              setLoading(false)
              return
            }
          }
        } else {
          // Admin tab - check if it's actually an admin
          const checkRes = await fetch('/api/auth/check', { credentials: 'include' })
          const checkData = await checkRes.json()
          if (checkData.authenticated && checkData.admin) {
            const role = (checkData.admin.role || 'admin').toLowerCase().trim()
            if (role === 'user') {
              setError('This account is a user account. Please use the User tab.')
              setLoading(false)
              return
            } else {
              router.push('/admin/dashboard')
            }
          } else {
            router.push('/admin/dashboard')
          }
        }
      } else {
        setError(result.message || 'Invalid credentials')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Lalitha Garments Portal
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin')
              setError('')
              setEmail('')
              setPassword('')
            }}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
              activeTab === 'admin'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👑 Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('user')
              setError('')
              setEmail('')
              setPassword('')
            }}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
              activeTab === 'user'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 User
          </button>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : `Sign in as ${activeTab === 'admin' ? 'Admin' : 'User'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

