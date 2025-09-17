'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'

export interface Service {
  id: string
  name: string
  description: string
  category: string
  duration: number
  price: number
  isActive: boolean
  providerCount: number
  appointmentCount: number
  revenue: number
  createdAt: string
  updatedAt: string
  requirements: string[]
  aftercare: string[]
  images: string[]
}

export interface ServiceCategory {
  id: string
  name: string
  description: string
}

export interface ServiceFormData {
  name: string
  description: string
  category: string
  duration: number
  price: number
  requirements: string[]
  aftercare: string[]
  images: string[]
}

export function ServiceManagement({ 
  className = '',
  services = [],
  categories = [],
  onCreateService,
  onUpdateService,
  onDeleteService,
  onActivateService,
  onDeactivateService,
  onBulkUpdate,
  onExportServices,
  onGenerateReport
}: { 
  className?: string
  services?: Service[]
  categories?: ServiceCategory[]
  onCreateService?: (data: ServiceFormData) => Promise<any>
  onUpdateService?: (id: string, data: ServiceFormData) => Promise<any>
  onDeleteService?: (id: string) => Promise<any>
  onActivateService?: (id: string) => Promise<any>
  onDeactivateService?: (id: string) => Promise<any>
  onBulkUpdate?: (ids: string[], data: any) => Promise<any>
  onExportServices?: () => Promise<any>
  onGenerateReport?: () => Promise<any>
}) {
  const { data: session, status } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: '',
    duration: 30,
    price: 0,
    requirements: [''],
    aftercare: [''],
    images: []
  })

  // Filter and sort services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && service.isActive) ||
                         (statusFilter === 'inactive' && !service.isActive)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const sortedServices = [...filteredServices].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Service]
    let bValue: any = b[sortBy as keyof Service]
    
    if (sortBy === 'price' || sortBy === 'duration' || sortBy === 'revenue') {
      aValue = Number(aValue)
      bValue = Number(bValue)
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${className}`}>
      {/* Live region for screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        data-testid="live-region"
      >
        {selectedService && `Selected service: ${selectedService.name}`}
      </div>
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Management</h1>
          <p className="text-gray-600">Manage beauty services, pricing, and availability</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">🏷️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.reduce((sum, s) => sum + s.appointmentCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">$</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(services.reduce((sum, s) => sum + s.revenue, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Search services"
                    role="searchbox"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  aria-label="Add new service"
                >
                  <span className="mr-2">+</span>
                  Add Service
                </button>
                
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  Bulk Actions
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && selectedServices.length > 0 && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedServices.length} service(s) selected
                </span>
                <button
                  onClick={() => onBulkUpdate?.(selectedServices, { isActive: true })}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => onBulkUpdate?.(selectedServices, { isActive: false })}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => onBulkUpdate?.(selectedServices, {})}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
                <option value="revenue">Revenue</option>
                <option value="createdAt">Created Date</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedServices.length === services.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServices(services.map(s => s.id))
                        } else {
                          setSelectedServices([])
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label="Select all services"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedServices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No services found
                    </td>
                  </tr>
                ) : (
                  sortedServices.map((service) => (
                    <tr 
                      key={service.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedService(service)
                        setShowViewModal(true)
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices(prev => [...prev, service.id])
                            } else {
                              setSelectedServices(prev => prev.filter(id => id !== service.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {service.images.length > 0 ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={service.images[0]}
                                alt={service.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400">🖼️</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                            <div className="text-sm text-gray-500">{service.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryName(service.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(service.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(service.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <span className="mr-1">👥</span>
                            {service.providerCount} providers
                          </div>
                          <div className="flex items-center text-xs">
                            <span className="mr-1">📅</span>
                            {service.appointmentCount} appointments
                          </div>
                          <div className="flex items-center text-xs">
                            <span className="mr-1">$</span>
                            {formatCurrency(service.revenue)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedService(service)
                              setShowViewModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => {
                              setSelectedService(service)
                              setFormData({
                                name: service.name,
                                description: service.description,
                                category: service.category,
                                duration: service.duration,
                                price: service.price,
                                requirements: service.requirements,
                                aftercare: service.aftercare,
                                images: service.images
                              })
                              setShowEditModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (service.isActive) {
                                onDeactivateService?.(service.id)
                              } else {
                                onActivateService?.(service.id)
                              }
                            }}
                            className={`${
                              service.isActive
                                ? 'text-yellow-600 hover:text-yellow-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {service.isActive ? '❌' : '✅'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedService(service)
                              setShowDeleteModal(true)
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Performance */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Revenue by Service</h3>
              <div className="space-y-2">
                {sortedServices.slice(0, 5).map(service => (
                  <div key={service.id} className="flex justify-between">
                    <span className="text-sm text-gray-600">{service.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(service.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Top Performing Services</h3>
              <div className="space-y-2">
                {sortedServices
                  .sort((a, b) => b.appointmentCount - a.appointmentCount)
                  .slice(0, 5)
                  .map((service, index) => (
                    <div key={service.id} className="flex justify-between">
                      <span className="text-sm text-gray-600">{index + 1}. {service.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(service.revenue)}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Appointments by Category</h3>
              <div className="space-y-2">
                {categories.map(category => {
                  const categoryServices = services.filter(s => s.category === category.id)
                  const totalAppointments = categoryServices.reduce((sum, s) => sum + s.appointmentCount, 0)
                  return (
                    <div key={category.id} className="flex justify-between">
                      <span className="text-sm text-gray-600">{category.name}</span>
                      <span className="text-sm font-medium">{totalAppointments}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Service</h3>
              <form onSubmit={(e) => { e.preventDefault(); onCreateService?.(formData); setShowCreateModal(false); }} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      min="15"
                      step="15"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                                    <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Create Service
                  </button>
                  </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Service</h3>
              <form onSubmit={(e) => { e.preventDefault(); onUpdateService?.(selectedService.id, formData); setShowEditModal(false); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      min="15"
                      step="15"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                                    <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Update Service
                  </button>
                  </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <span className="mx-auto flex items-center justify-center h-12 w-12 text-red-400 text-2xl">⚠️</span>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Service</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete "{selectedService.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteService?.(selectedService.id)
                    setShowDeleteModal(false)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Service Modal */}
      {showViewModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedService.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedService.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{getCategoryName(selectedService.category)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDuration(selectedService.duration)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedService.price)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requirements</label>
                  <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                    {selectedService.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Aftercare</label>
                  <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                    {selectedService.aftercare.map((care, index) => (
                      <li key={index}>{care}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Images</label>
                  <div className="mt-1 flex space-x-2">
                    {selectedService.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedService.name} ${index + 1}`}
                        className="h-16 w-16 rounded object-cover"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setFormData({
                      name: selectedService.name,
                      description: selectedService.description,
                      category: selectedService.category,
                      duration: selectedService.duration,
                      price: selectedService.price,
                      requirements: selectedService.requirements,
                      aftercare: selectedService.aftercare,
                      images: selectedService.images
                    })
                    setShowEditModal(true)
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Edit Service
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
