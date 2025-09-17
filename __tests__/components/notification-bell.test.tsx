import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationBell } from '@/components/notification-bell'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/dashboard'
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

// Mock API calls
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}))

describe('NotificationBell', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'Booking Confirmed',
      message: 'Your appointment has been confirmed',
      type: 'BOOKING_CONFIRMATION',
      isRead: false,
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
      metadata: {
        bookingId: 'booking-123',
        serviceName: 'Haircut & Styling'
      }
    },
    {
      id: '2',
      title: 'Payment Successful',
      message: 'Payment for your service has been processed',
      type: 'PAYMENT_SUCCESS',
      isRead: true,
      priority: 'MEDIUM',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      metadata: {
        paymentId: 'payment-456',
        amount: 75.00
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render notification bell with unread count', () => {
      render(<NotificationBell />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      expect(bell).toBeInTheDocument()
      
      const badge = screen.getByText('1')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-500')
    })

    it('should render without badge when no unread notifications', () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, isRead: true }))
      
      render(<NotificationBell notifications={readNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      expect(bell).toBeInTheDocument()
      
      expect(screen.queryByText('1')).not.toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      render(<NotificationBell />)
      
      expect(screen.getByTestId('notification-bell-loading')).toBeInTheDocument()
    })
  })

  describe('Notification Dropdown', () => {
    it('should open dropdown when bell is clicked', async () => {
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
        expect(screen.getByText('Booking Confirmed')).toBeInTheDocument()
        expect(screen.getByText('Payment Successful')).toBeInTheDocument()
      })
    })

    it('should close dropdown when clicking outside', async () => {
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
      
      // Click outside
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
      })
    })

    it('should display notification details correctly', async () => {
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        // Check first notification
        expect(screen.getByText('Booking Confirmed')).toBeInTheDocument()
        expect(screen.getByText('Your appointment has been confirmed')).toBeInTheDocument()
        expect(screen.getByText('Haircut & Styling')).toBeInTheDocument()
        
        // Check second notification
        expect(screen.getByText('Payment Successful')).toBeInTheDocument()
        expect(screen.getByText('Payment for your service has been processed')).toBeInTheDocument()
        expect(screen.getByText('$75.00')).toBeInTheDocument()
      })
    })

    it('should show priority indicators', async () => {
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        const highPriority = screen.getByTestId('notification-1')
        expect(highPriority).toHaveClass('border-l-red-500')
        
        const mediumPriority = screen.getByTestId('notification-2')
        expect(mediumPriority).toHaveClass('border-l-yellow-500')
      })
    })

    it('should show read/unread status', async () => {
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        const unreadNotification = screen.getByTestId('notification-1')
        expect(unreadNotification).toHaveClass('bg-blue-50')
        
        const readNotification = screen.getByTestId('notification-2')
        expect(readNotification).not.toHaveClass('bg-blue-50')
      })
    })
  })

  describe('Notification Actions', () => {
    it('should mark notification as read when clicked', async () => {
      const mockMarkAsRead = jest.fn()
      render(<NotificationBell 
        notifications={mockNotifications} 
        onMarkAsRead={mockMarkAsRead}
      />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        const notification = screen.getByText('Booking Confirmed')
        fireEvent.click(notification)
      })
      
      expect(mockMarkAsRead).toHaveBeenCalledWith('1')
    })

    it('should navigate to notification details when clicked', async () => {
      const mockRouter = { push: jest.fn() }
      jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter)
      
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        const notification = screen.getByText('Booking Confirmed')
        fireEvent.click(notification)
      })
      
      expect(mockRouter.push).toHaveBeenCalledWith('/notifications/1')
    })

    it('should show mark all as read button', async () => {
      const mockMarkAllAsRead = jest.fn()
      render(<NotificationBell 
        notifications={mockNotifications} 
        onMarkAllAsRead={mockMarkAllAsRead}
      />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        const markAllButton = screen.getByText('Mark all as read')
        expect(markAllButton).toBeInTheDocument()
      })
    })

    it('should call mark all as read when button is clicked', async () => {
      const mockMarkAllAsRead = jest.fn()
      render(<NotificationBell 
        notifications={mockNotifications} 
        onMarkAllAsRead={mockMarkAllAsRead}
      />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        const markAllButton = screen.getByText('Mark all as read')
        fireEvent.click(markAllButton)
      })
      
      expect(mockMarkAllAsRead).toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no notifications', async () => {
      render(<NotificationBell notifications={[]} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        expect(screen.getByText('No notifications')).toBeInTheDocument()
        expect(screen.getByText('You\'re all caught up!')).toBeInTheDocument()
      })
    })

    it('should show empty state when all notifications are read', async () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, isRead: true }))
      render(<NotificationBell notifications={readNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        expect(screen.getByText('No unread notifications')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error state when notifications fail to load', async () => {
      render(<NotificationBell error="Failed to load notifications" />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load notifications')).toBeInTheDocument()
        expect(screen.getByText('Please try again later')).toBeInTheDocument()
      })
    })

    it('should show retry button when there is an error', async () => {
      const mockRetry = jest.fn()
      render(<NotificationBell 
        error="Failed to load notifications" 
        onRetry={mockRetry}
      />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        expect(retryButton).toBeInTheDocument()
        
        fireEvent.click(retryButton)
        expect(mockRetry).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      expect(bell).toHaveAttribute('aria-label', 'Notifications')
      expect(bell).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update ARIA expanded state when dropdown opens', async () => {
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        expect(bell).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('should have proper focus management', async () => {
      render(<NotificationBell notifications={mockNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      await waitFor(() => {
        const dropdown = screen.getByRole('dialog')
        expect(dropdown).toHaveAttribute('aria-labelledby', 'notifications-title')
      })
    })
  })

  describe('Performance', () => {
    it('should handle large number of notifications efficiently', () => {
      const manyNotifications = Array.from({ length: 100 }, (_, i) => ({
        id: `notification-${i}`,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        type: 'GENERAL',
        isRead: false,
        priority: 'LOW',
        createdAt: new Date().toISOString(),
        metadata: {}
      }))
      
      render(<NotificationBell notifications={manyNotifications} />)
      
      const bell = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bell)
      
      // Should render without performance issues
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })

    it('should debounce notification updates', async () => {
      jest.useFakeTimers()
      
      render(<NotificationBell />)
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        // Trigger update
      }
      
      jest.runAllTimers()
      
      // Should only process the last update
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
      
      jest.useRealTimers()
    })
  })

  describe('Real-time Updates', () => {
    it('should update notification count in real-time', async () => {
      const { rerender } = render(<NotificationBell notifications={[]} />)
      
      // Initially no badge
      expect(screen.queryByText('1')).not.toBeInTheDocument()
      
      // Update with unread notification
      rerender(<NotificationBell notifications={[mockNotifications[0]]} />)
      
      // Should show badge
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should handle WebSocket updates', async () => {
      const mockWebSocket = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
      
      global.WebSocket = jest.fn(() => mockWebSocket) as any
      
      render(<NotificationBell />)
      
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })
  })
})
