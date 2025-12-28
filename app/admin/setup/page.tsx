'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { storage } from '@/lib/storage'

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    checkCompletedSteps()
  }, [])

  const checkCompletedSteps = () => {
    const steps: number[] = []
    const profile = storage.getBusinessProfile()
    const suppliers = storage.getSuppliers()
    const purchaseOrders = storage.getPurchaseOrders()
    const inventory = storage.getInventory()
    const customers = storage.getCustomers()
    const catalogues = storage.getCatalogues()
    const sales = storage.getSales()

    if (profile) steps.push(1)
    if (suppliers.length > 0) steps.push(2)
    if (purchaseOrders.length > 0) steps.push(3)
    if (inventory.length > 0) steps.push(4)
    if (customers.length > 0) steps.push(5)
    if (catalogues.length > 0) steps.push(6)
    if (sales.length > 0) steps.push(7)

    setCompletedSteps(steps)
    
    // Auto-advance to first incomplete step
    if (!profile) setCurrentStep(1)
    else if (suppliers.length === 0) setCurrentStep(2)
    else if (purchaseOrders.length === 0) setCurrentStep(3)
    else if (inventory.length === 0) setCurrentStep(4)
    else if (customers.length === 0) setCurrentStep(5)
    else if (catalogues.length === 0) setCurrentStep(6)
    else if (sales.length === 0) setCurrentStep(7)
    else setCurrentStep(8) // All done
  }

  const steps = [
    {
      number: 1,
      title: 'Business Setup',
      description: 'Configure your business profile',
      route: '/admin/business',
      icon: '⚙️',
    },
    {
      number: 2,
      title: 'Add Suppliers',
      description: 'Create supplier database',
      route: '/admin/suppliers',
      icon: '🏭',
    },
    {
      number: 3,
      title: 'Record Purchase Orders',
      description: 'Track products purchased from suppliers',
      route: '/admin/purchases',
      icon: '🛒',
    },
    {
      number: 4,
      title: 'Create Inventory',
      description: 'Add your products with prices',
      route: '/admin/inventory',
      icon: '📦',
    },
    {
      number: 5,
      title: 'Add Customers',
      description: 'Create customer database',
      route: '/admin/customers',
      icon: '👥',
    },
    {
      number: 6,
      title: 'Create Catalogue',
      description: 'Organize products into catalogues',
      route: '/admin/catalogues',
      icon: '📚',
    },
    {
      number: 7,
      title: 'Record Sales',
      description: 'Start recording your sales',
      route: '/admin/sales',
      icon: '💰',
    },
    {
      number: 8,
      title: 'Create Invoices',
      description: 'Generate and send invoices',
      route: '/admin/invoices',
      icon: '📄',
    },
  ]

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber)
    const step = steps.find(s => s.number === stepNumber)
    if (step) {
      router.push(step.route)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      const nextStep = steps.find(s => s.number === currentStep + 1)
      if (nextStep) {
        router.push(nextStep.route)
      }
    }
  }

  const handleComplete = () => {
    router.push('/admin/dashboard')
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Setup Wizard</h1>
        <p className="text-gray-600 mb-8">Follow these steps to set up your business system</p>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.number)
              const isCurrent = currentStep === step.number
              
              return (
                <div
                  key={step.number}
                  className={`border-2 rounded-lg p-6 transition-all ${
                    isCurrent
                      ? 'border-purple-500 bg-purple-50'
                      : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {isCompleted ? '✓' : step.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{step.icon}</span>
                          <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                          {isCompleted && (
                            <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <button
                          onClick={() => handleStepClick(step.number)}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            isCompleted
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : isCurrent
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isCompleted ? 'Review' : isCurrent ? 'Continue' : 'Start'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {currentStep === steps.length && (
            <div className="mt-8 pt-8 border-t">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 Setup Complete!</h3>
                <p className="text-green-700 mb-4">You&apos;re all set to start managing your business</p>
                <button
                  onClick={handleComplete}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

