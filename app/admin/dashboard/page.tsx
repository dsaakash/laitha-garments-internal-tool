'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { Sale, SaleItem } from '@/lib/storage'
import { format } from 'date-fns'
import Link from 'next/link'

interface SoldItem {
  dressName: string
  dressType: string
  dressCode: string
  quantity: number
  totalProfit: number
  totalRevenue: number
  customerName: string
  saleDate: string
}

export default function Dashboard() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user' | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalInventory: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    thisMonthSales: 0,
    thisMonthRevenue: 0,
  })
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [soldItems, setSoldItems] = useState<SoldItem[]>([])

  // Check user role on mount
  useEffect(() => {
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.admin) {
          let role = data.admin.role
          if (!role) {
            role = 'admin' // Default to admin if role missing
          } else {
            role = role.toLowerCase().trim()
            if (role === 'super_admin') role = 'superadmin'
          }
          setUserRole(role as 'superadmin' | 'admin' | 'user')
          
          // Redirect users away from dashboard
          if (role === 'user') {
            router.push('/admin/products')
            return
          }
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error checking user role:', err)
        setLoading(false)
      })
  }, [router])

  useEffect(() => {
    // Only load dashboard data if user is admin or superadmin
    if (userRole === 'user' || loading) return
    
    const loadData = async () => {
      try {
        const [inventoryRes, salesRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/sales'),
        ])
        const inventoryResult = await inventoryRes.json()
        const salesResult = await salesRes.json()
        
        const inventory = inventoryResult.success ? inventoryResult.data : []
        const sales = salesResult.success ? salesResult.data : []
        
        const totalRevenue = sales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0)
        const totalProfit = sales.reduce((sum: number, sale: Sale) => {
          const saleProfit = sale.items.reduce((itemSum: number, item: SaleItem) => itemSum + item.profit, 0)
          return sum + saleProfit
        }, 0)

        const now = new Date()
        const thisMonthSales = sales.filter((sale: Sale) => {
          const saleDate = new Date(sale.date)
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear()
        })
        const thisMonthRevenue = thisMonthSales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0)

        // Get recent sales (last 5)
        const recent = sales
          .sort((a: Sale, b: Sale) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)

        // Aggregate sold items with profit
        const itemsMap = new Map<string, SoldItem>()
        sales.forEach((sale: Sale) => {
          sale.items.forEach((item: SaleItem) => {
            const key = `${item.dressCode}-${item.dressName}`
            if (itemsMap.has(key)) {
              const existing = itemsMap.get(key)!
              existing.quantity += item.quantity
              existing.totalProfit += item.profit
              existing.totalRevenue += item.sellingPrice * item.quantity
            } else {
              itemsMap.set(key, {
                dressName: item.dressName,
                dressType: item.dressType,
                dressCode: item.dressCode,
                quantity: item.quantity,
                totalProfit: item.profit,
                totalRevenue: item.sellingPrice * item.quantity,
                customerName: sale.partyName,
                saleDate: sale.date,
              })
            }
          })
        })

        const soldItemsList = Array.from(itemsMap.values())
          .sort((a, b) => b.totalProfit - a.totalProfit)
          .slice(0, 10) // Top 10 by profit

        setStats({
          totalInventory: inventory.length,
          totalSales: sales.length,
          totalRevenue,
          totalProfit,
          thisMonthSales: thisMonthSales.length,
          thisMonthRevenue,
        })
        setRecentSales(recent)
        setSoldItems(soldItemsList)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    }
    loadData()
  }, [userRole, loading])

  // Show loading state while checking role
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // If user role is 'user', they shouldn't see this page (should be redirected)
  if (userRole === 'user') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don&apos;t have permission to access this page.</p>
            <Link
              href="/admin/products"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Go to Products →
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const statCards = [
    {
      title: 'Total Inventory Items',
      value: stats.totalInventory,
      icon: '📦',
      color: 'bg-blue-500',
      link: '/admin/inventory',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: '💰',
      color: 'bg-green-500',
      link: '/admin/sales',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: '💵',
      color: 'bg-purple-500',
      link: '/admin/sales',
    },
    {
      title: 'Total Profit',
      value: `₹${stats.totalProfit.toLocaleString()}`,
      icon: '📈',
      color: 'bg-yellow-500',
      link: '/admin/sales',
    },
    {
      title: 'This Month Sales',
      value: stats.thisMonthSales,
      icon: '📅',
      color: 'bg-pink-500',
      link: '/admin/sales',
    },
    {
      title: 'This Month Revenue',
      value: `₹${stats.thisMonthRevenue.toLocaleString()}`,
      icon: '💎',
      color: 'bg-indigo-500',
      link: '/admin/sales',
    },
  ]

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => (
            <Link key={index} href={card.link}>
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/inventory"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
            >
              ➕ Add Inventory Item
            </Link>
            <Link
              href="/admin/sales"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
            >
              ➕ Record New Sale
            </Link>
            <Link
              href="/admin/invoices"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
            >
              📄 View Invoices
            </Link>
          </div>
        </div>

        {/* Recent Sales */}
        {recentSales.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Sales</h2>
              <Link
                href="/admin/sales"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentSales.map((sale) => {
                const saleProfit = sale.items.reduce((sum, item) => sum + item.profit, 0)
                return (
                  <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{sale.partyName}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(sale.date), 'dd MMM yyyy')} • Bill: {sale.billNumber}
                        </p>
                        <div className="mt-2 space-y-1">
                          {sale.items.map((item, idx) => (
                            <p key={idx} className="text-sm text-gray-600">
                              {item.quantity}x {item.dressName} ({item.dressType}) - ₹{(item.sellingPrice * item.quantity).toLocaleString()}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-green-600">₹{sale.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-green-500">Profit: ₹{saleProfit.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top Sold Items */}
        {soldItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Top Sold Items (by Profit)</h2>
              <Link
                href="/admin/sales"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Profit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {soldItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.dressName}</p>
                          <p className="text-xs text-gray-500">{item.dressType}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dressCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.totalRevenue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">₹{item.totalProfit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">🚀 Setup Wizard</h2>
              <p className="text-gray-600">Follow our step-by-step guide to set up your business system</p>
            </div>
            <Link
              href="/admin/setup"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Start Setup
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

