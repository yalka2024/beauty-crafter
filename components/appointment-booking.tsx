'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, User, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns'
import { apiClient } from '@/lib/api'

export interface Service {
  id: string
  name: string
  description: string
  duration: number // in minutes
  price: number
  category: string
  imageUrl?: string
}

export interface Provider {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  rating: number
  reviewCount: number
  avatar?: string
  location: string
  availability: {
    days: string[]
    startTime: string
    endTime: string
  }
}

export interface TimeSlot {
  id: string
  time: string
  available: boolean
  providerId: string
}

export interface Appointment {
  id: string
  serviceId: string
  providerId: string
  clientId: string
  date: string
  time: string
  duration: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  totalPrice: number
  notes?: string
  createdAt: string
}

interface AppointmentBookingProps {
  className?: string
  initialServiceId?: string
  initialProviderId?: string
}

export function AppointmentBooking({ 
  className = '', 
  initialServiceId, 
  initialProviderId 
}: AppointmentBookingProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<'service' | 'provider' | 'datetime' | 'summary' | 'confirmation'>('service')
  const [services, setServices] = useState<Service[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [notes, setNotes] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.get('/api/services')
      setServices(response.data.services || [])
    } catch (err) {
      setError('Failed to fetch services')
      console.error('Error fetching services:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/providers')
      setProviders(response.data.providers || [])
    } catch (err) {
      console.error('Error fetching providers:', err)
    }
  }, [])

  // Fetch available time slots
  const fetchAvailableSlots = useCallback(async (providerId: string, date: string) => {
    try {
      const response = await apiClient.get(`/api/providers/${providerId}/availability?date=${date}`)
      setAvailableSlots(response.data.slots || [])
    } catch (err) {
      console.error('Error fetching available slots:', err)
    }
  }, [])

  // Filter services based on search and filters
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    const matchesPrice = service.price >= priceRange[0] && service.price <= priceRange[1]
    
    return matchesSearch && matchesCategory && matchesPrice
  })

  // Filter providers based on selected service
  const filteredProviders = providers.filter(provider => {
    if (!selectedService) return true
    return provider.specialties.includes(selectedService.category)
  })

  // Handle service selection
  const handleServiceSelect = useCallback((service: Service) => {
    setSelectedService(service)
    setStep('provider')
  }, [])

  // Handle provider selection
  const handleProviderSelect = useCallback((provider: Provider) => {
    setSelectedProvider(provider)
    setStep('datetime')
  }, [])

  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setSelectedTime('')
    if (selectedProvider) {
      fetchAvailableSlots(selectedProvider.id, format(date, 'yyyy-MM-dd'))
    }
  }, [selectedProvider, fetchAvailableSlots])

  // Handle time selection
  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time)
  }, [])

  // Handle booking
  const handleBooking = useCallback(async () => {
    if (!selectedService || !selectedProvider || !selectedDate || !selectedTime || !session?.user?.id) {
      return
    }

    try {
      setIsBooking(true)
      setError(null)

      const appointmentData = {
        serviceId: selectedService.id,
        providerId: selectedProvider.id,
        clientId: session.user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        duration: selectedService.duration,
        notes: notes.trim() || undefined,
        totalPrice: selectedService.price
      }

      const response = await apiClient.post('/api/appointments', appointmentData)
      setBookingSuccess(true)
      setStep('confirmation')
    } catch (err) {
      setError('Failed to book appointment')
      console.error('Error booking appointment:', err)
    } finally {
      setIsBooking(false)
    }
  }, [selectedService, selectedProvider, selectedDate, selectedTime, notes, session?.user?.id])

  // Generate available dates (next 30 days)
  const availableDates = Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i))

  // Get service categories
  const serviceCategories = Array.from(new Set(services.map(s => s.category)))

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim()
    }
    return `${mins}m`
  }

  // Fetch data on mount
  useEffect(() => {
    fetchServices()
    fetchProviders()
  }, [fetchServices, fetchProviders])

  // Set initial selections if provided
  useEffect(() => {
    if (initialServiceId) {
      const service = services.find(s => s.id === initialServiceId)
      if (service) {
        setSelectedService(service)
        setStep('provider')
      }
    }
    if (initialProviderId) {
      const provider = providers.find(p => p.id === initialProviderId)
      if (provider) {
        setSelectedProvider(provider)
        setStep('datetime')
      }
    }
  }, [initialServiceId, initialProviderId, services, providers])

  if (!session?.user?.id) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">Please sign in to book appointments</p>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['service', 'provider', 'datetime', 'summary', 'confirmation'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepName 
                  ? 'bg-blue-500 text-white' 
                  : step === 'confirmation' || ['service', 'provider', 'datetime', 'summary'].indexOf(step) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step === 'confirmation' || ['service', 'provider', 'datetime', 'summary'].indexOf(step) > index ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 4 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  ['service', 'provider', 'datetime', 'summary'].indexOf(step) > index 
                    ? 'bg-green-500' 
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Service</span>
          <span>Provider</span>
          <span>Date & Time</span>
          <span>Summary</span>
          <span>Confirmation</span>
        </div>
      </div>

      {/* Service Selection Step */}
      {step === 'service' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Service</h2>
            <p className="text-gray-600">Choose from our range of beauty and wellness services</p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="flex flex-wrap gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {serviceCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Price:</span>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-32"
                />
                <span className="text-sm text-gray-600">{formatPrice(priceRange[1])}</span>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading services...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchServices}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No services found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  {service.imageUrl && (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(service.price)}</span>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(service.duration)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provider Selection Step */}
      {step === 'provider' && selectedService && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Provider</h2>
            <p className="text-gray-600">Choose from our qualified professionals for {selectedService.name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                onClick={() => handleProviderSelect(provider)}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    {provider.avatar ? (
                      <img src={provider.avatar} alt={provider.name} className="w-16 h-16 rounded-full" />
                    ) : (
                      <span className="text-gray-600 font-medium text-xl">
                        {provider.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < Math.floor(provider.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="text-sm text-gray-500 ml-1">
                        ({provider.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{provider.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{provider.availability.startTime} - {provider.availability.endTime}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Specialties:</h4>
                  <div className="flex flex-wrap gap-2">
                    {provider.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date & Time Selection Step */}
      {step === 'datetime' && selectedService && selectedProvider && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date & Time</h2>
            <p className="text-gray-600">
              Book your {selectedService.name} with {selectedProvider.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Date Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
              <div className="grid grid-cols-7 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    className={`p-3 text-center rounded-lg border transition-colors ${
                      selectedDate && isSameDay(date, selectedDate)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">{format(date, 'EEE')}</div>
                    <div className="text-lg font-bold">{format(date, 'd')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time</h3>
              {selectedDate ? (
                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`p-3 text-center rounded-lg border transition-colors ${
                        selectedTime === slot.time
                          ? 'bg-blue-500 text-white border-blue-500'
                          : slot.available
                            ? 'bg-white border-gray-200 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Please select a date first</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <button
              onClick={() => setStep('provider')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('summary')}
              disabled={!selectedDate || !selectedTime}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Summary Step */}
      {step === 'summary' && selectedService && selectedProvider && selectedDate && selectedTime && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Summary</h2>
            <p className="text-gray-600">Review your appointment details before confirming</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formatDuration(selectedService.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium text-blue-600">{formatPrice(selectedService.price)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">{selectedProvider.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{selectedProvider.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">{selectedProvider.rating}/5 ({selectedProvider.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">{formatPrice(selectedService.price)}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <button
              onClick={() => setStep('datetime')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleBooking}
              disabled={isBooking}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isBooking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Booking...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Confirm Booking</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Step */}
      {step === 'confirmation' && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h2>
            <p className="text-gray-600">
              Your {selectedService?.name} appointment has been successfully booked.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium">{selectedProvider?.name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You will receive a confirmation email shortly. You can also view your appointment details in your dashboard.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/appointments')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                View Appointments
              </button>
              <button
                onClick={() => {
                  setStep('service')
                  setSelectedService(null)
                  setSelectedProvider(null)
                  setSelectedDate(null)
                  setSelectedTime('')
                  setNotes('')
                  setBookingSuccess(false)
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Book Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


