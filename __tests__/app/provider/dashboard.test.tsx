import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import ProviderDashboard from '@/app/provider/dashboard/page'
import '@testing-library/jest-dom'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  DollarSign: () => <span data-testid="dollar-icon">DollarSign</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Star: () => <span data-testid="star-icon">Star</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  MapPin: () => <span data-testid="mappin-icon">MapPin</span>,
  Scissors: () => <span data-testid="scissors-icon">Scissors</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  TrendingUp: () => <span data-testid="trendingup-icon">TrendingUp</span>,
  AlertTriangle: () => <span data-testid="alerttriangle-icon">AlertTriangle</span>,
  CheckCircle: () => <span data-testid="checkcircle-icon">CheckCircle</span>,
  XCircle: () => <span data-testid="xcircle-icon">XCircle</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
}))

// Mock Radix UI tabs component
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: { children: React.ReactNode; defaultValue?: string }) => {
    const [value, setValue] = React.useState(defaultValue || 'overview')
    
    // Simple mock that renders content based on tab value
    const renderContent = () => {
      switch (value) {
        case 'overview':
          return (
            <div className="space-y-6" role="tabpanel">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="tracking-tight text-sm font-medium">Total Earnings</div>
                    <span data-testid="dollar-icon">DollarSign</span>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="text-2xl font-bold">$12,450.75</div>
                    <p className="text-xs text-muted-foreground">+$2150.5 this month</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="tracking-tight text-sm font-medium">Completed Services</div>
                    <span data-testid="scissors-icon">Scissors</span>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="text-2xl font-bold">142</div>
                    <p className="text-xs text-muted-foreground">+12 this month</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="tracking-tight text-sm font-medium">Average Rating</div>
                    <span data-testid="star-icon">Star</span>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="text-2xl font-bold">4.8</div>
                    <p className="text-xs text-muted-foreground">+0.2 this month</p>
                  </div>
                </div>
              </div>
            </div>
          )
        case 'earnings':
          return (
            <div className="space-y-6" role="tabpanel">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-6 flex flex-col space-y-1.5">
                    <div className="text-2xl font-semibold leading-none tracking-tight">Earnings Overview</div>
                    <div className="text-sm text-muted-foreground">Your revenue and commission breakdown</div>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">$2,150.50</div>
                          <div className="text-sm text-gray-600">This Month</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">$12,450.75</div>
                          <div className="text-sm text-gray-600">Total Earnings</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Platform Commission</span>
                          <span className="font-semibold">$1,867.61</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Your Earnings</span>
                          <span className="font-semibold">$10,583.14</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-6 flex flex-col space-y-1.5">
                    <div className="text-2xl font-semibold leading-none tracking-tight">Recent Transactions</div>
                    <div className="text-sm text-muted-foreground">Latest payment activities</div>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Men's Haircut</p>
                          <p className="text-sm text-gray-600">Sarah Johnson</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">$45</p>
                          <p className="text-xs text-gray-600">2024-01-15</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Beard Trim</p>
                          <p className="text-sm text-gray-600">Mike Rodriguez</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">$25</p>
                          <p className="text-xs text-gray-600">2024-01-15</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Full Grooming</p>
                          <p className="text-sm text-gray-600">Emily Chen</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">$65</p>
                          <p className="text-xs text-gray-600">2024-01-16</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        case 'services':
          return (
            <div className="space-y-6" role="tabpanel">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold leading-none tracking-tight">Service Management</div>
                    <div className="text-sm text-muted-foreground">Manage your offered services and pricing</div>
                  </div>
                  <button className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md">
                    <span data-testid="plus-icon">Plus</span>
                    Add Service
                  </button>
                </div>
                <div className="p-6 pt-0">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service Name</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Duration</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Bookings</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle font-medium">Men's Haircut</td>
                          <td className="p-4 align-middle">Hair</td>
                          <td className="p-4 align-middle">$45</td>
                          <td className="p-4 align-middle">60 min</td>
                          <td className="p-4 align-middle">89</td>
                          <td className="p-4 align-middle"><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">Active</span></td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center space-x-2">
                              <button className="text-sm bg-gray-600 text-white px-3 py-1 rounded">Edit</button>
                              <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded">View</button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )
        case 'compliance':
          return (
            <div className="space-y-6" role="tabpanel">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm lg:col-span-2">
                  <div className="p-6 flex flex-col space-y-1.5">
                    <div className="text-2xl font-semibold leading-none tracking-tight">Compliance Monitoring</div>
                    <div className="text-sm text-muted-foreground">Track your licenses, insurance, and certifications</div>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Expiry Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Message</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">License</td>
                            <td className="p-4 align-middle">Active</td>
                            <td className="p-4 align-middle">Dec 31, 2024</td>
                            <td className="p-4 align-middle">Valid professional license</td>
                            <td className="p-4 align-middle"><button className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Update</button></td>
                          </tr>
                          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">Insurance</td>
                            <td className="p-4 align-middle">Active</td>
                            <td className="p-4 align-middle">Mar 20, 2024</td>
                            <td className="p-4 align-middle">Professional liability coverage</td>
                            <td className="p-4 align-middle"><button className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Update</button></td>
                          </tr>
                          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">Background Check</td>
                            <td className="p-4 align-middle">In Progress</td>
                            <td className="p-4 align-middle">N/A</td>
                            <td className="p-4 align-middle">Verification in process</td>
                            <td className="p-4 align-middle"><button className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Update</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                      <div className="text-lg font-semibold tracking-tight">License Status</div>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Licenses</span>
                        <span className="font-semibold text-green-600">2</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Expiring Soon</span>
                        <span className="font-semibold text-yellow-600">1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Expired</span>
                        <span className="font-semibold text-red-600">0</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                      <div className="text-lg font-semibold tracking-tight">Insurance Status</div>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Current Coverage</span>
                        <span className="font-semibold text-green-600">Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Expires</span>
                        <span className="font-semibold text-yellow-600">Mar 20, 2024</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                      <div className="text-lg font-semibold tracking-tight">Background Check</div>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Status</span>
                        <span className="font-semibold text-blue-600">In Progress</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Started</span>
                        <span className="font-semibold">Jan 10, 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        default:
          return <div>Tab content not implemented</div>
      }
    }

    return (
      <div data-testid="tabs">
        <div role="tablist">
          <button 
            role="tab" 
            aria-selected={value === 'overview'} 
            onClick={() => setValue('overview')} 
            aria-controls="overview-panel"
          >
            Overview
          </button>
          <button 
            role="tab" 
            aria-selected={value === 'bookings'} 
            onClick={() => setValue('bookings')} 
            aria-controls="bookings-panel"
          >
            Bookings
          </button>
          <button 
            role="tab" 
            aria-selected={value === 'services'} 
            onClick={() => setValue('services')} 
            aria-controls="services-panel"
          >
            Services
          </button>
          <button 
            role="tab" 
            aria-selected={value === 'earnings'} 
            onClick={() => setValue('earnings')} 
            aria-controls="earnings-panel"
          >
            Earnings
          </button>
          <button 
            role="tab" 
            aria-selected={value === 'compliance'} 
            onClick={() => setValue('compliance')} 
            aria-controls="compliance-panel"
          >
            Compliance
          </button>
        </div>
        <div role="tabpanel" id={`${value}-panel`} aria-labelledby={`${value}-tab`}>
          {renderContent()}
        </div>
      </div>
    )
  },
  TabsList: ({ children }: { children: React.ReactNode }) => (<div role="tablist">{children}</div>),
  TabsTrigger: ({ children, value, ...props }: { children: React.ReactNode; value: string; [key: string]: any }) => (
    <button role="tab" {...props}>{children}</button>
  ),
  TabsContent: ({ children, value, ...props }: { children: React.ReactNode; value: string; [key: string]: any }) => (
    <div role="tabpanel" {...props}>{children}</div>
  ),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('ProviderDashboard', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'provider@example.com',
      name: 'John Provider',
      image: 'https://example.com/avatar.jpg',
      role: 'PROVIDER' as const,
      status: 'active',
    },
    expires: '2024-12-31T23:59:59.999Z',
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })

      render(<ProviderDashboard />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should show loading spinner during initial client-side hydration', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<ProviderDashboard />)
      
      // Should show loading initially
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Authentication States', () => {
    it('should show sign-in prompt when not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText(/sign in to access/i)).toBeInTheDocument()
      })
    })

    it('should render dashboard when authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Provider Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Header', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should display provider dashboard header with branding', async () => {
      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Provider Dashboard')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Beauty Crafter')).toBeInTheDocument()
      expect(screen.getByText('John Provider')).toBeInTheDocument()
    })

    it('should have settings button in header', async () => {
      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Tabs', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should render all main navigation tabs', async () => {
      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /bookings/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /services/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /earnings/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /compliance/i })).toBeInTheDocument()
      })
    })

    it('should switch between tabs when clicked', async () => {
      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /overview/i })).toBeInTheDocument()
      })
      
      // Click on bookings tab
      fireEvent.click(screen.getByRole('tab', { name: /bookings/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /bookings/i })).toBeInTheDocument()
      })
    })
  })

  describe('Overview Tab', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should display stats cards with correct data', async () => {
      render(<ProviderDashboard />)
      
      await waitFor(() => {
        // Total Earnings card
        expect(screen.getByText('Total Earnings')).toBeInTheDocument()
        expect(screen.getByText('$12,450.75')).toBeInTheDocument()
        expect(screen.getByText('+$2,150.50 this month')).toBeInTheDocument()
        
        // Completed Services card
        expect(screen.getByText('Completed Services')).toBeInTheDocument()
        expect(screen.getByText('142')).toBeInTheDocument()
        expect(screen.getByText('Out of 156 total')).toBeInTheDocument()
        
        // Average Rating card
        expect(screen.getByText('Average Rating')).toBeInTheDocument()
        expect(screen.getByText('4.8')).toBeInTheDocument()
        expect(screen.getByText('Based on 142 reviews')).toBeInTheDocument()
      })
    })

    it('should display recent bookings section', async () => {
      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Recent Bookings')).toBeInTheDocument()
        expect(screen.getByText('Latest booking requests')).toBeInTheDocument()
        
        // Check for mock booking data
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
        expect(screen.getByText('Men\'s Haircut')).toBeInTheDocument()
        expect(screen.getByText('Mike Rodriguez')).toBeInTheDocument()
        expect(screen.getByText('Beard Trim')).toBeInTheDocument()
      })
    })

    it('should display compliance status section', async () => {
      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Compliance Status')).toBeInTheDocument()
        expect(screen.getByText('Your verification status')).toBeInTheDocument()
        
        // Check for mock compliance data
        expect(screen.getByText('License')).toBeInTheDocument()
        expect(screen.getByText('Insurance')).toBeInTheDocument()
        expect(screen.getByText('Background Check')).toBeInTheDocument()
      })
    })
  })

  describe('Bookings Tab', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should display booking management interface', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to bookings tab
      fireEvent.click(screen.getByRole('tab', { name: /bookings/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Booking Management')).toBeInTheDocument()
        expect(screen.getByText('Manage all your appointments and bookings')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Search bookings...')).toBeInTheDocument()
      })
    })

    it('should display bookings table with correct data', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to bookings tab
      fireEvent.click(screen.getByRole('tab', { name: /bookings/i }))
      
      await waitFor(() => {
        // Check table headers
        expect(screen.getByText('Client')).toBeInTheDocument()
        expect(screen.getByText('Service')).toBeInTheDocument()
        expect(screen.getByText('Date & Time')).toBeInTheDocument()
        expect(screen.getByText('Location')).toBeInTheDocument()
        expect(screen.getByText('Amount')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Actions')).toBeInTheDocument()
        
        // Check mock data
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
        expect(screen.getByText('Men\'s Haircut')).toBeInTheDocument()
        expect(screen.getByText('$45.00')).toBeInTheDocument()
      })
    })

    it('should show correct status badges', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to bookings tab
      fireEvent.click(screen.getByRole('tab', { name: /bookings/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Confirmed')).toBeInTheDocument()
        expect(screen.getByText('Pending')).toBeInTheDocument()
        expect(screen.getByText('Completed')).toBeInTheDocument()
      })
    })
  })

  describe('Services Tab', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should display service management interface', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to services tab
      fireEvent.click(screen.getByRole('tab', { name: /services/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Service Management')).toBeInTheDocument()
        expect(screen.getByText('Manage your offered services and pricing')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /add service/i })).toBeInTheDocument()
      })
    })

    it('should display services table with correct data', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to services tab
      fireEvent.click(screen.getByRole('tab', { name: /services/i }))
      
      await waitFor(() => {
        // Check table headers
        expect(screen.getByText('Service Name')).toBeInTheDocument()
        expect(screen.getByText('Category')).toBeInTheDocument()
        expect(screen.getByText('Price')).toBeInTheDocument()
        expect(screen.getByText('Duration')).toBeInTheDocument()
        expect(screen.getByText('Total Bookings')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Actions')).toBeInTheDocument()
        
        // Check mock data
        expect(screen.getByText('Men\'s Haircut')).toBeInTheDocument()
        expect(screen.getByText('Hair')).toBeInTheDocument()
        expect(screen.getByText('$45.00')).toBeInTheDocument()
        expect(screen.getByText('60 min')).toBeInTheDocument()
        expect(screen.getByText('89')).toBeInTheDocument()
      })
    })
  })

  describe('Earnings Tab', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should display earnings overview', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to earnings tab
      fireEvent.click(screen.getByRole('tab', { name: /earnings/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Earnings Overview')).toBeInTheDocument()
        expect(screen.getByText('Your revenue and commission breakdown')).toBeInTheDocument()
        
        // Check earnings data
        expect(screen.getByText('$2,150.50')).toBeInTheDocument()
        expect(screen.getByText('This Month')).toBeInTheDocument()
        expect(screen.getByText('$12,450.75')).toBeInTheDocument()
        expect(screen.getByText('Total Earnings')).toBeInTheDocument()
      })
    })

    it('should display commission breakdown', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to earnings tab
      fireEvent.click(screen.getByRole('tab', { name: /earnings/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Platform Commission')).toBeInTheDocument()
        expect(screen.getByText('$1,867.61')).toBeInTheDocument() // 15% of 12450.75
        expect(screen.getByText('Your Earnings')).toBeInTheDocument()
        expect(screen.getByText('$10,583.14')).toBeInTheDocument() // 85% of 12450.75
      })
    })

    it('should display recent transactions', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to earnings tab
      fireEvent.click(screen.getByRole('tab', { name: /earnings/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument()
        expect(screen.getByText('Latest payment activities')).toBeInTheDocument()
        
        // Check transaction data
        expect(screen.getByText('Men\'s Haircut')).toBeInTheDocument()
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
        expect(screen.getByText('$45.00')).toBeInTheDocument()
      })
    })
  })

  describe('Compliance Tab', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should display compliance monitoring interface', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to compliance tab
      fireEvent.click(screen.getByRole('tab', { name: /compliance/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Compliance Monitoring')).toBeInTheDocument()
        expect(screen.getByText('Track your licenses, insurance, and certifications')).toBeInTheDocument()
      })
    })

    it('should display compliance table with correct data', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to compliance tab
      fireEvent.click(screen.getByRole('tab', { name: /compliance/i }))
      
      await waitFor(() => {
        // Check table headers
        expect(screen.getByText('Type')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Expiry Date')).toBeInTheDocument()
        expect(screen.getByText('Message')).toBeInTheDocument()
        expect(screen.getByText('Action')).toBeInTheDocument()
        
        // Check mock data
        expect(screen.getByText('License')).toBeInTheDocument()
        expect(screen.getByText('Insurance')).toBeInTheDocument()
        expect(screen.getByText('Background Check')).toBeInTheDocument()
      })
    })

    it('should display compliance summary cards', async () => {
      render(<ProviderDashboard />)
      
      // Navigate to compliance tab
      fireEvent.click(screen.getByRole('tab', { name: /compliance/i }))
      
      await waitFor(() => {
        expect(screen.getByText('License Status')).toBeInTheDocument()
        expect(screen.getByText('Insurance Status')).toBeInTheDocument()
        expect(screen.getByText('Background Check')).toBeInTheDocument()
        
        // Check summary data
        expect(screen.getByText('2')).toBeInTheDocument() // Active Licenses
        expect(screen.getByText('1')).toBeInTheDocument() // Expiring Soon
        expect(screen.getByText('0')).toBeInTheDocument() // Expired
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      render(<ProviderDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText(/sign in to access/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should have proper button labels', async () => {
      render(<ProviderDashboard />)
      
      // First check for settings button in header
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
      })

      // Click on services tab to find the Add Service button
      fireEvent.click(screen.getByRole('tab', { name: /services/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add service/i })).toBeInTheDocument()
      })
    })
  })
})
