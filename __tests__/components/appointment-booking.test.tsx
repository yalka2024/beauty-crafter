import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AppointmentBooking } from '@/components/appointment-booking'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/booking'
}))

// Mock authentication
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'CLIENT'
      }
    },
    status: 'authenticated'
  })
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => date.toISOString().split('T')[0]),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  isSameDay: jest.fn((date1, date2) => date1.toDateString() === date2.toDateString()),
  startOfDay: jest.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())),
  isBefore: jest.fn((date1, date2) => date1 < date2),
  isAfter: jest.fn((date1, date2) => date1 > date2)
}))

// Mock API calls
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}))

describe('AppointmentBooking', () => {
  const mockServices = [
    {
      id: 'service-1',
      name: 'Haircut & Styling',
      description: 'Professional haircut and styling service',
      duration: 60,
      price: 45.00,
      category: 'HAIR',
      isActive: true
    },
    {
      id: 'service-2',
      name: 'Manicure',
      description: 'Classic manicure service',
      duration: 30,
      price: 25.00,
      category: 'NAILS',
      isActive: true
    },
    {
      id: 'service-3',
      name: 'Facial Treatment',
      description: 'Rejuvenating facial treatment',
      duration: 90,
      price: 75.00,
      category: 'SKIN',
      isActive: true
    }
  ]

  const mockProviders = [
    {
      id: 'provider-1',
      name: 'Sarah Johnson',
      avatar: 'https://example.com/avatar1.jpg',
      specialties: ['HAIR', 'NAILS'],
      rating: 4.8,
      reviewCount: 127,
      isAvailable: true
    },
    {
      id: 'provider-2',
      name: 'Mike Chen',
      avatar: 'https://example.com/avatar2.jpg',
      specialties: ['SKIN', 'HAIR'],
      rating: 4.9,
      reviewCount: 89,
      isAvailable: true
    }
  ]

  const mockTimeSlots = [
    { time: '09:00', isAvailable: true },
    { time: '10:00', isAvailable: true },
    { time: '11:00', isAvailable: false },
    { time: '12:00', isAvailable: true },
    { time: '13:00', isAvailable: true },
    { time: '14:00', isAvailable: true },
    { time: '15:00', isAvailable: false },
    { time: '16:00', isAvailable: true }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render appointment booking form', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      expect(screen.getByText('Book Appointment')).toBeInTheDocument()
      expect(screen.getByText('Select Service')).toBeInTheDocument()
      expect(screen.getByText('Select Provider')).toBeInTheDocument()
      expect(screen.getByText('Select Date')).toBeInTheDocument()
      expect(screen.getByText('Select Time')).toBeInTheDocument()
    })

    it('should display all available services', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      expect(screen.getByText('Haircut & Styling')).toBeInTheDocument()
      expect(screen.getByText('Manicure')).toBeInTheDocument()
      expect(screen.getByText('Facial Treatment')).toBeInTheDocument()
    })

    it('should display service details', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      expect(screen.getByText('Professional haircut and styling service')).toBeInTheDocument()
      expect(screen.getByText('60 min')).toBeInTheDocument()
      expect(screen.getByText('$45.00')).toBeInTheDocument()
    })

    it('should display all available providers', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.getByText('Mike Chen')).toBeInTheDocument()
    })

    it('should display provider details', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      expect(screen.getByText('4.8 ★')).toBeInTheDocument()
      expect(screen.getByText('(127 reviews)')).toBeInTheDocument()
      expect(screen.getByText('Hair, Nails')).toBeInTheDocument()
    })
  })

  describe('Service Selection', () => {
    it('should allow user to select a service', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        expect(haircutService.closest('div')).toHaveClass('ring-2', 'ring-blue-500')
      })
    })

    it('should show selected service details', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        expect(screen.getByText('Selected Service: Haircut & Styling')).toBeInTheDocument()
        expect(screen.getByText('Duration: 60 minutes')).toBeInTheDocument()
        expect(screen.getByText('Price: $45.00')).toBeInTheDocument()
      })
    })

    it('should filter providers by service specialty', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const facialService = screen.getByText('Facial Treatment')
      fireEvent.click(facialService)
      
      await waitFor(() => {
        // Only Mike Chen specializes in SKIN
        expect(screen.getByText('Mike Chen')).toBeInTheDocument()
        expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument()
      })
    })

    it('should show no providers message when no providers match service', async () => {
      const limitedProviders = [mockProviders[0]] // Only Sarah (no SKIN specialty)
      
      render(<AppointmentBooking services={mockServices} providers={limitedProviders} />)
      
      const facialService = screen.getByText('Facial Treatment')
      fireEvent.click(facialService)
      
      await waitFor(() => {
        expect(screen.getByText('No providers available for this service')).toBeInTheDocument()
      })
    })
  })

  describe('Provider Selection', () => {
    it('should allow user to select a provider', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // First select a service
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        expect(sarahProvider.closest('div')).toHaveClass('ring-2', 'ring-blue-500')
      })
    })

    it('should show selected provider details', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service and provider
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        expect(screen.getByText('Selected Provider: Sarah Johnson')).toBeInTheDocument()
        expect(screen.getByText('Rating: 4.8 ★')).toBeInTheDocument()
        expect(screen.getByText('Specialties: Hair, Nails')).toBeInTheDocument()
      })
    })

    it('should show provider availability status', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const sarahStatus = screen.getByTestId('status-provider-1')
      expect(sarahStatus).toHaveClass('bg-green-500')
      expect(sarahStatus).toHaveAttribute('title', 'Available')
    })

    it('should disable unavailable providers', () => {
      const unavailableProviders = [
        { ...mockProviders[0], isAvailable: false }
      ]
      
      render(<AppointmentBooking services={mockServices} providers={unavailableProviders} />)
      
      const sarahProvider = screen.getByText('Sarah Johnson')
      expect(sarahProvider.closest('div')).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('Date Selection', () => {
    it('should show calendar with available dates', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service and provider first
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        // Calendar should now be visible
        expect(screen.getByText('Select Date')).toBeInTheDocument()
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })
    })

    it('should highlight today\'s date', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const today = new Date()
      const todayButton = screen.getByText(today.getDate().toString())
      expect(todayButton).toHaveClass('bg-blue-100', 'text-blue-900')
    })

    it('should allow date selection', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service and provider first
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        // Select a date
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        expect(tomorrowButton).toHaveClass('bg-blue-500', 'text-white')
      })
    })

    it('should disable past dates', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayButton = screen.getByText(yesterday.getDate().toString())
      
      expect(yesterdayButton).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('should show next 30 days', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const today = new Date()
      const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      const futureButton = screen.getByText(futureDate.getDate().toString())
      
      expect(futureButton).toBeInTheDocument()
    })
  })

  describe('Time Selection', () => {
    it('should show available time slots after date selection', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service, provider, and date
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        // Time slots should now be visible
        expect(screen.getByText('Select Time')).toBeInTheDocument()
        expect(screen.getByText('09:00')).toBeInTheDocument()
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })
    })

    it('should show only available time slots', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service, provider, and date
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        // Available slots should be clickable
        const availableSlot = screen.getByText('09:00')
        expect(availableSlot).not.toHaveClass('opacity-50')
        
        // Unavailable slots should be disabled
        const unavailableSlot = screen.getByText('11:00')
        expect(unavailableSlot).toHaveClass('opacity-50', 'cursor-not-allowed')
      })
    })

    it('should allow time slot selection', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service, provider, and date
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        // Select a time slot
        const timeSlot = screen.getByText('09:00')
        fireEvent.click(timeSlot)
        
        expect(timeSlot).toHaveClass('bg-blue-500', 'text-white')
      })
    })

    it('should show selected time details', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service, provider, date, and time
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        const timeSlot = screen.getByText('09:00')
        fireEvent.click(timeSlot)
        
        expect(screen.getByText('Selected Time: 09:00')).toBeInTheDocument()
      })
    })
  })

  describe('Appointment Summary', () => {
    it('should show appointment summary after all selections', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        // Select provider
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        // Select date
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        // Select time
        const timeSlot = screen.getByText('09:00')
        fireEvent.click(timeSlot)
        
        // Summary should now be visible
        expect(screen.getByText('Appointment Summary')).toBeInTheDocument()
        expect(screen.getByText('Service: Haircut & Styling')).toBeInTheDocument()
        expect(screen.getByText('Provider: Sarah Johnson')).toBeInTheDocument()
        expect(screen.getByText('Date:')).toBeInTheDocument()
        expect(screen.getByText('Time: 09:00')).toBeInTheDocument()
        expect(screen.getByText('Total: $45.00')).toBeInTheDocument()
      })
    })

    it('should show booking button when all selections are made', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Complete all selections
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        const timeSlot = screen.getByText('09:00')
        fireEvent.click(timeSlot)
        
        const bookButton = screen.getByRole('button', { name: /book appointment/i })
        expect(bookButton).toBeInTheDocument()
        expect(bookButton).not.toBeDisabled()
      })
    })
  })

  describe('Booking Process', () => {
    it('should handle successful booking', async () => {
      const mockBookAppointment = jest.fn().mockResolvedValue({
        id: 'appointment-123',
        status: 'CONFIRMED'
      })
      
      render(<AppointmentBooking 
        services={mockServices} 
        providers={mockProviders}
        onBookAppointment={mockBookAppointment}
      />)
      
      // Complete all selections
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        const timeSlot = screen.getByText('09:00')
        fireEvent.click(timeSlot)
        
        const bookButton = screen.getByRole('button', { name: /book appointment/i })
        fireEvent.click(bookButton)
        
        expect(mockBookAppointment).toHaveBeenCalledWith({
          serviceId: 'service-1',
          providerId: 'provider-1',
          date: expect.any(String),
          time: '09:00',
          duration: 60,
          price: 45.00
        })
      })
    })

    it('should show loading state during booking', async () => {
      const mockBookAppointment = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<AppointmentBooking 
        services={mockServices} 
        providers={mockProviders}
        onBookAppointment={mockBookAppointment}
      />)
      
      // Complete all selections
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        const timeSlot = screen.getByText('09:00')
        fireEvent.click(timeSlot)
        
        const bookButton = screen.getByRole('button', { name: /book appointment/i })
        fireEvent.click(bookButton)
        
        expect(bookButton).toBeDisabled()
        expect(screen.getByText('Booking...')).toBeInTheDocument()
      })
    })

    it('should handle booking errors gracefully', async () => {
      const mockBookAppointment = jest.fn().mockRejectedValue(new Error('Booking failed'))
      
      render(<AppointmentBooking 
        services={mockServices} 
        providers={mockProviders}
        onBookAppointment={mockBookAppointment}
      />)
      
      // Complete all selections
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        const timeSlot = screen.getByText('09:00')
        fireEvent.click(timeSlot)
        
        const bookButton = screen.getByRole('button', { name: /book appointment/i })
        fireEvent.click(bookButton)
        
        expect(screen.getByText('Failed to book appointment')).toBeInTheDocument()
        expect(screen.getByText('Please try again')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should require service selection before proceeding', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Try to select provider without service
      const sarahProvider = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahProvider)
      
      expect(screen.getByText('Please select a service first')).toBeInTheDocument()
    })

    it('should require provider selection before proceeding', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service but not provider
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      // Try to select date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
      fireEvent.click(tomorrowButton)
      
      expect(screen.getByText('Please select a provider first')).toBeInTheDocument()
    })

    it('should require date selection before proceeding', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Select service and provider but not date
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        // Try to select time
        const timeSlot = screen.getByText('09:00')
        fireEvent.click(timeSlot)
        
        expect(screen.getByText('Please select a date first')).toBeInTheDocument()
      })
    })

    it('should require time selection before booking', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Complete all selections except time
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const sarahProvider = screen.getByText('Sarah Johnson')
        fireEvent.click(sarahProvider)
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowButton = screen.getByText(tomorrow.getDate().toString())
        fireEvent.click(tomorrowButton)
        
        // Try to book without time
        const bookButton = screen.getByRole('button', { name: /book appointment/i })
        fireEvent.click(bookButton)
        
        expect(screen.getByText('Please select a time slot')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      expect(screen.getByRole('button', { name: /select service/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select provider/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select date/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select time/i })).toBeInTheDocument()
    })

    it('should announce selection changes to screen readers', async () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const haircutService = screen.getByText('Haircut & Styling')
      fireEvent.click(haircutService)
      
      await waitFor(() => {
        const liveRegion = screen.getByTestId('live-region')
        expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should support keyboard navigation', () => {
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      const firstService = screen.getByText('Haircut & Styling')
      firstService.focus()
      
      // Tab to next element
      fireEvent.keyDown(firstService, { key: 'Tab' })
      
      const nextElement = screen.getByText('Manicure')
      expect(nextElement).toHaveFocus()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      // Should show mobile-optimized layout
      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument()
    })

    it('should show mobile navigation for steps', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<AppointmentBooking services={mockServices} providers={mockProviders} />)
      
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      expect(screen.getByText('Service')).toBeInTheDocument()
      expect(screen.getByText('Provider')).toBeInTheDocument()
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Time')).toBeInTheDocument()
    })
  })
})


