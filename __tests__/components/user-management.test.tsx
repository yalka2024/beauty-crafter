import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { UserManagement } from '@/components/user-management'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/admin/users'
}))

// Mock authentication
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'admin-user-id',
        email: 'admin@beautycrafter.com',
        role: 'ADMIN'
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

describe('UserManagement', () => {
  const mockUsers = [
    {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T10:30:00Z',
      profile: {
        phone: '+1234567890',
        address: '123 Main St, New York, NY',
        preferences: ['HAIR', 'NAILS']
      }
    },
    {
      id: 'user-2',
      email: 'sarah@example.com',
      name: 'Sarah Johnson',
      role: 'PROVIDER',
      status: 'ACTIVE',
      createdAt: '2024-01-02T00:00:00Z',
      lastLoginAt: '2024-01-15T09:15:00Z',
      profile: {
        phone: '+1987654321',
        address: '456 Oak Ave, Los Angeles, CA',
        specialties: ['HAIR', 'SKIN'],
        licenseNumber: 'CA12345'
      }
    },
    {
      id: 'user-3',
      email: 'mike@example.com',
      name: 'Mike Chen',
      role: 'PROVIDER',
      status: 'PENDING_VERIFICATION',
      createdAt: '2024-01-03T00:00:00Z',
      lastLoginAt: null,
      profile: {
        phone: '+1555666777',
        address: '789 Pine St, Chicago, IL',
        specialties: ['NAILS'],
        licenseNumber: 'IL67890'
      }
    }
  ]

  const mockRoles = [
    { id: 'CLIENT', name: 'Client', permissions: ['read_profile', 'book_appointments'] },
    { id: 'PROVIDER', name: 'Provider', permissions: ['read_profile', 'manage_schedule', 'view_appointments'] },
    { id: 'ADMIN', name: 'Administrator', permissions: ['all'] }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render user management dashboard', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Active Users')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should display user statistics', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      expect(screen.getByText('Clients')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Providers')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Pending Verification')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should show user list with all users', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Client')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.getByText('sarah@example.com')).toBeInTheDocument()
      expect(screen.getByText('Provider')).toBeInTheDocument()
      
      expect(screen.getByText('Mike Chen')).toBeInTheDocument()
      expect(screen.getByText('mike@example.com')).toBeInTheDocument()
      expect(screen.getByText('Pending Verification')).toBeInTheDocument()
    })
  })

  describe('User Search and Filtering', () => {
    it('should filter users by search term', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const searchInput = screen.getByPlaceholderText('Search users...')
      fireEvent.change(searchInput, { target: { value: 'John' } })
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument()
      expect(screen.queryByText('Mike Chen')).not.toBeInTheDocument()
    })

    it('should filter users by role', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const roleFilter = screen.getByText('Filter by Role')
      fireEvent.click(roleFilter)
      
      const providerOption = screen.getByText('Provider')
      fireEvent.click(providerOption)
      
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.getByText('Mike Chen')).toBeInTheDocument()
    })

    it('should filter users by status', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const statusFilter = screen.getByText('Filter by Status')
      fireEvent.click(statusFilter)
      
      const activeOption = screen.getByText('Active')
      fireEvent.click(activeOption)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.queryByText('Mike Chen')).not.toBeInTheDocument()
    })

    it('should show no results message when filters have no matches', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const searchInput = screen.getByPlaceholderText('Search users...')
      fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })
      
      expect(screen.getByText('No users found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument()
    })
  })

  describe('User Details and Actions', () => {
    it('should show user details when user is clicked', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const userRow = screen.getByText('John Doe')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        expect(screen.getByText('User Details')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('+1234567890')).toBeInTheDocument()
        expect(screen.getByText('123 Main St, New York, NY')).toBeInTheDocument()
        expect(screen.getByText('Hair, Nails')).toBeInTheDocument()
      })
    })

    it('should show provider-specific details for providers', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const userRow = screen.getByText('Sarah Johnson')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        expect(screen.getByText('Provider Details')).toBeInTheDocument()
        expect(screen.getByText('Specialties: Hair, Skin')).toBeInTheDocument()
        expect(screen.getByText('License: CA12345')).toBeInTheDocument()
      })
    })

    it('should allow editing user information', async () => {
      const mockUpdateUser = jest.fn().mockResolvedValue({ success: true })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onUpdateUser={mockUpdateUser}
      />)
      
      const userRow = screen.getByText('John Doe')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit User')
        fireEvent.click(editButton)
        
        const nameInput = screen.getByDisplayValue('John Doe')
        fireEvent.change(nameInput, { target: { value: 'John Smith' } })
        
        const saveButton = screen.getByText('Save Changes')
        fireEvent.click(saveButton)
        
        expect(mockUpdateUser).toHaveBeenCalledWith('user-1', {
          name: 'John Smith',
          email: 'john@example.com',
          role: 'CLIENT'
        })
      })
    })

    it('should allow changing user role', async () => {
      const mockUpdateUser = jest.fn().mockResolvedValue({ success: true })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onUpdateUser={mockUpdateUser}
      />)
      
      const userRow = screen.getByText('John Doe')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit User')
        fireEvent.click(editButton)
        
        const roleSelect = screen.getByDisplayValue('Client')
        fireEvent.change(roleSelect, { target: { value: 'PROVIDER' } })
        
        const saveButton = screen.getByText('Save Changes')
        fireEvent.click(saveButton)
        
        expect(mockUpdateUser).toHaveBeenCalledWith('user-1', {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'PROVIDER'
        })
      })
    })

    it('should allow deactivating users', async () => {
      const mockDeactivateUser = jest.fn().mockResolvedValue({ success: true })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onDeactivateUser={mockDeactivateUser}
      />)
      
      const userRow = screen.getByText('John Doe')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const deactivateButton = screen.getByText('Deactivate User')
        fireEvent.click(deactivateButton)
        
        const confirmDialog = screen.getByText('Are you sure you want to deactivate this user?')
        expect(confirmDialog).toBeInTheDocument()
        
        const confirmButton = screen.getByText('Confirm')
        fireEvent.click(confirmButton)
        
        expect(mockDeactivateUser).toHaveBeenCalledWith('user-1')
      })
    })

    it('should allow reactivating users', async () => {
      const mockReactivateUser = jest.fn().mockResolvedValue({ success: true })
      const inactiveUsers = [
        { ...mockUsers[0], status: 'INACTIVE' }
      ]
      
      render(<UserManagement 
        users={inactiveUsers} 
        roles={mockRoles}
        onReactivateUser={mockReactivateUser}
      />)
      
      const userRow = screen.getByText('John Doe')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const reactivateButton = screen.getByText('Reactivate User')
        fireEvent.click(reactivateButton)
        
        expect(mockReactivateUser).toHaveBeenCalledWith('user-1')
      })
    })
  })

  describe('Provider Verification', () => {
    it('should show verification status for providers', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const sarahRow = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahRow)
      
      expect(screen.getByText('Verification Status: Verified')).toBeInTheDocument()
      
      const mikeRow = screen.getByText('Mike Chen')
      fireEvent.click(mikeRow)
      
      expect(screen.getByText('Verification Status: Pending')).toBeInTheDocument()
    })

    it('should allow approving provider verification', async () => {
      const mockApproveVerification = jest.fn().mockResolvedValue({ success: true })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onApproveVerification={mockApproveVerification}
      />)
      
      const userRow = screen.getByText('Mike Chen')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const approveButton = screen.getByText('Approve Verification')
        fireEvent.click(approveButton)
        
        expect(mockApproveVerification).toHaveBeenCalledWith('user-3')
      })
    })

    it('should allow rejecting provider verification', async () => {
      const mockRejectVerification = jest.fn().mockResolvedValue({ success: true })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onRejectVerification={mockRejectVerification}
      />)
      
      const userRow = screen.getByText('Mike Chen')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const rejectButton = screen.getByText('Reject Verification')
        fireEvent.click(rejectButton)
        
        const reasonInput = screen.getByPlaceholderText('Enter rejection reason...')
        fireEvent.change(reasonInput, { target: { value: 'Incomplete documentation' } })
        
        const confirmButton = screen.getByText('Confirm Rejection')
        fireEvent.click(confirmButton)
        
        expect(mockRejectVerification).toHaveBeenCalledWith('user-3', 'Incomplete documentation')
      })
    })

    it('should show verification documents for pending providers', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const userRow = screen.getByText('Mike Chen')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        expect(screen.getByText('Verification Documents')).toBeInTheDocument()
        expect(screen.getByText('License: IL67890')).toBeInTheDocument()
        expect(screen.getByText('View Documents')).toBeInTheDocument()
      })
    })
  })

  describe('Bulk Operations', () => {
    it('should allow selecting multiple users', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      
      // Select first two users
      fireEvent.click(checkboxes[1]) // John Doe
      fireEvent.click(checkboxes[2]) // Sarah Johnson
      
      expect(screen.getByText('2 users selected')).toBeInTheDocument()
      expect(screen.getByText('Bulk Actions')).toBeInTheDocument()
    })

    it('should allow bulk role changes', async () => {
      const mockBulkUpdate = jest.fn().mockResolvedValue({ success: true })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onBulkUpdate={mockBulkUpdate}
      />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      
      // Select first two users
      fireEvent.click(checkboxes[1]) // John Doe
      fireEvent.click(checkboxes[2]) // Sarah Johnson
      
      const bulkActionsButton = screen.getByText('Bulk Actions')
      fireEvent.click(bulkActionsButton)
      
      const changeRoleOption = screen.getByText('Change Role')
      fireEvent.click(changeRoleOption)
      
      const roleSelect = screen.getByDisplayValue('Client')
      fireEvent.change(roleSelect, { target: { value: 'PROVIDER' } })
      
      const applyButton = screen.getByText('Apply to Selected')
      fireEvent.click(applyButton)
      
      expect(mockBulkUpdate).toHaveBeenCalledWith(['user-1', 'user-2'], {
        role: 'PROVIDER'
      })
    })

    it('should allow bulk deactivation', async () => {
      const mockBulkDeactivate = jest.fn().mockResolvedValue({ success: true })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onBulkDeactivate={mockBulkDeactivate}
      />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      
      // Select first two users
      fireEvent.click(checkboxes[1]) // John Doe
      fireEvent.click(checkboxes[2]) // Sarah Johnson
      
      const bulkActionsButton = screen.getByText('Bulk Actions')
      fireEvent.click(bulkActionsButton)
      
      const deactivateOption = screen.getByText('Deactivate Users')
      fireEvent.click(deactivateOption)
      
      const confirmButton = screen.getByText('Confirm Deactivation')
      fireEvent.click(confirmButton)
      
      expect(mockBulkDeactivate).toHaveBeenCalledWith(['user-1', 'user-2'])
    })
  })

  describe('User Analytics', () => {
    it('should display user growth chart', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      expect(screen.getByText('User Growth')).toBeInTheDocument()
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument()
    })

    it('should show role distribution chart', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      expect(screen.getByText('Role Distribution')).toBeInTheDocument()
      expect(screen.getByText('Clients: 1')).toBeInTheDocument()
      expect(screen.getByText('Providers: 2')).toBeInTheDocument()
    })

    it('should display user activity metrics', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      expect(screen.getByText('User Activity')).toBeInTheDocument()
      expect(screen.getByText('Active Today: 2')).toBeInTheDocument()
      expect(screen.getByText('New This Week: 1')).toBeInTheDocument()
    })
  })

  describe('Export and Reporting', () => {
    it('should allow exporting user data', async () => {
      const mockExportUsers = jest.fn().mockResolvedValue({ downloadUrl: '/export/users.csv' })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onExportUsers={mockExportUsers}
      />)
      
      const exportButton = screen.getByText('Export Users')
      fireEvent.click(exportButton)
      
      const csvOption = screen.getByText('CSV')
      fireEvent.click(csvOption)
      
      expect(mockExportUsers).toHaveBeenCalledWith('csv')
    })

    it('should allow generating user reports', async () => {
      const mockGenerateReport = jest.fn().mockResolvedValue({ reportId: 'report-123' })
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onGenerateReport={mockGenerateReport}
      />)
      
      const reportButton = screen.getByText('Generate Report')
      fireEvent.click(reportButton)
      
      const dateRangeInput = screen.getByPlaceholderText('Select date range')
      fireEvent.change(dateRangeInput, { target: { value: '2024-01-01 to 2024-01-31' } })
      
      const generateButton = screen.getByText('Generate')
      fireEvent.click(generateButton)
      
      expect(mockGenerateReport).toHaveBeenCalledWith({
        dateRange: '2024-01-01 to 2024-01-31',
        includeInactive: false
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search users')
    })

    it('should announce user selection changes to screen readers', async () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const userRow = screen.getByText('John Doe')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const liveRegion = screen.getByTestId('live-region')
        expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should support keyboard navigation', () => {
      render(<UserManagement users={mockUsers} roles={mockRoles} />)
      
      const firstUser = screen.getByText('John Doe')
      firstUser.focus()
      
      // Tab to next element
      fireEvent.keyDown(firstUser, { key: 'Tab' })
      
      const nextElement = screen.getByText('Sarah Johnson')
      expect(nextElement).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockUpdateUser = jest.fn().mockRejectedValue(new Error('Update failed'))
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onUpdateUser={mockUpdateUser}
      />)
      
      const userRow = screen.getByText('John Doe')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit User')
        fireEvent.click(editButton)
        
        const nameInput = screen.getByDisplayValue('John Doe')
        fireEvent.change(nameInput, { target: { value: 'John Smith' } })
        
        const saveButton = screen.getByText('Save Changes')
        fireEvent.click(saveButton)
        
        expect(screen.getByText('Failed to update user')).toBeInTheDocument()
        expect(screen.getByText('Please try again')).toBeInTheDocument()
      })
    })

    it('should show loading states during operations', async () => {
      const mockUpdateUser = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      )
      
      render(<UserManagement 
        users={mockUsers} 
        roles={mockRoles}
        onUpdateUser={mockUpdateUser}
      />)
      
      const userRow = screen.getByText('John Doe')
      fireEvent.click(userRow)
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit User')
        fireEvent.click(editButton)
        
        const saveButton = screen.getByText('Save Changes')
        fireEvent.click(saveButton)
        
        expect(saveButton).toBeDisabled()
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })
    })
  })
})


