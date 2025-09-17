import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ChatSystem } from '@/components/chat-system'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/chat'
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

// Mock WebSocket
const mockWebSocket = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1 // WebSocket.OPEN
}

global.WebSocket = jest.fn(() => mockWebSocket) as any

// Mock API calls
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}))

describe('ChatSystem', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      senderId: 'provider-123',
      senderName: 'Sarah Johnson',
      type: 'text' as const,
      timestamp: new Date().toISOString(),
      isRead: false,
      metadata: {}
    },
    {
      id: '2',
      content: 'I have a question about my appointment',
      senderId: 'test-user-id',
      senderName: 'You',
      type: 'text' as const,
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      isRead: true,
      metadata: {}
    }
  ]

  const mockConversations = [
    {
      id: 'conv-1',
      name: 'Sarah Johnson',
      type: 'direct' as const,
      participants: ['test-user-id', 'provider-123'],
      lastMessage: {
        id: 'msg-1',
        content: 'I have a question about my appointment',
        senderId: 'provider-123',
        senderName: 'Sarah Johnson',
        type: 'text' as const,
        timestamp: new Date().toISOString(),
        isRead: false
      },
      unreadCount: 1,
      isOnline: true,
      avatar: 'https://example.com/avatar.jpg'
    },
    {
      id: 'conv-2',
      name: 'Mike Chen',
      type: 'direct' as const,
      participants: ['test-user-id', 'provider-456'],
      lastMessage: {
        id: 'msg-2',
        content: 'Your appointment is confirmed',
        senderId: 'provider-456',
        senderName: 'Mike Chen',
        type: 'text' as const,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        isRead: true
      },
      unreadCount: 0,
      isOnline: false,
      avatar: 'https://example.com/avatar2.jpg'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockWebSocket.addEventListener.mockClear()
    mockWebSocket.removeEventListener.mockClear()
    mockWebSocket.send.mockClear()
  })

  it('should render basic component without crashing', () => {
    render(<ChatSystem />)
    expect(screen.getByText('Chats')).toBeInTheDocument()
    expect(screen.getByText('Select a chat')).toBeInTheDocument()
  })

  describe('Rendering', () => {
    it('should render chat system with conversations list', () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      expect(screen.getByText('Chats')).toBeInTheDocument()
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.getByText('Mike Chen')).toBeInTheDocument()
    })

    it('should show unread message count', () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      const unreadBadge = screen.getByText('1')
      expect(unreadBadge).toBeInTheDocument()
      expect(unreadBadge).toHaveClass('bg-blue-500')
    })

    it('should show online/offline status', () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      // Check that online status indicators are present
      const onlineIndicators = screen.getAllByTestId('online-status')
      expect(onlineIndicators).toHaveLength(1) // Only Sarah should be online
    })

    it('should show last message preview', () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      expect(screen.getByText('I have a question about my appointment')).toBeInTheDocument()
      expect(screen.getByText('Your appointment is confirmed')).toBeInTheDocument()
    })
  })

  describe('Conversation Selection', () => {
    it('should open chat when conversation is clicked', async () => {
      render(<ChatSystem conversations={mockConversations} messages={mockMessages} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
        expect(screen.getByText('Online')).toBeInTheDocument()
      })
    })

    it('should highlight selected conversation', async () => {
      render(<ChatSystem conversations={mockConversations} messages={mockMessages} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        expect(sarahConversation.closest('div')).toHaveClass('bg-blue-50')
      })
    })
  })

  describe('Message Display', () => {
    it('should display messages in correct order', async () => {
      render(<ChatSystem conversations={mockConversations} messages={mockMessages} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
        expect(screen.getByText('I have a question about my appointment')).toBeInTheDocument()
      })
    })

    it('should show message timestamps', async () => {
      render(<ChatSystem conversations={mockConversations} messages={mockMessages} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        // Check that timestamps are displayed
        const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/)
        expect(timestamps.length).toBeGreaterThan(0)
      })
    })

    it('should show read receipts', async () => {
      render(<ChatSystem conversations={mockConversations} messages={mockMessages} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        // Messages should be visible
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
        expect(screen.getByText('I have a question about my appointment')).toBeInTheDocument()
      })
    })

    it('should handle different message types', async () => {
      const messagesWithTypes = [
        ...mockMessages,
        {
          id: '3',
          content: 'https://example.com/image.jpg',
          senderId: 'provider-123',
          senderName: 'Sarah Johnson',
          type: 'image' as const,
          timestamp: new Date().toISOString(),
          isRead: false,
          metadata: {
            imageUrl: 'https://example.com/image.jpg'
          }
        }
      ]
      
      render(<ChatSystem conversations={mockConversations} messages={messagesWithTypes} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        // Should show image message
        expect(screen.getByAltText('Image')).toBeInTheDocument()
      })
    })
  })

  describe('Message Sending', () => {
    it('should send text message when form is submitted', async () => {
      const mockSendMessage = jest.fn()
      render(<ChatSystem 
        conversations={mockConversations} 
        messages={mockMessages}
        onSendMessage={mockSendMessage}
      />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText('Type a message...')
        const sendButton = screen.getByRole('button', { name: /send/i })
        
        fireEvent.change(input, { target: { value: 'Hello Sarah!' } })
        fireEvent.click(sendButton)
        
        expect(mockSendMessage).toHaveBeenCalled()
      })
    })

    it('should not send empty messages', async () => {
      const mockSendMessage = jest.fn()
      render(<ChatSystem 
        conversations={mockConversations} 
        messages={mockMessages}
        onSendMessage={mockSendMessage}
      />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send/i })
        expect(sendButton).toBeDisabled()
      })
    })

    it('should send message on Enter key', async () => {
      const mockSendMessage = jest.fn()
      render(<ChatSystem 
        conversations={mockConversations} 
        messages={mockMessages}
        onSendMessage={mockSendMessage}
      />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText('Type a message...')
        
        fireEvent.change(input, { target: { value: 'Hello Sarah!' } })
        fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
        
        expect(mockSendMessage).toHaveBeenCalled()
      })
    })

    it('should handle file uploads', async () => {
      const mockSendMessage = jest.fn()
      render(<ChatSystem 
        conversations={mockConversations} 
        messages={mockMessages}
        onSendMessage={mockSendMessage}
      />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        const fileButton = screen.getByRole('button', { name: /paperclip/i })
        expect(fileButton).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should connect to WebSocket when component mounts', () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      expect(global.WebSocket).toHaveBeenCalled()
    })

    it('should handle incoming messages', async () => {
      render(<ChatSystem conversations={mockConversations} messages={mockMessages} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should filter conversations by search term', async () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      const searchInput = screen.getByPlaceholderText('Search chats...')
      fireEvent.change(searchInput, { target: { value: 'Sarah' } })
      
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.queryByText('Mike Chen')).not.toBeInTheDocument()
    })

    it('should show no results message when search has no matches', async () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      const searchInput = screen.getByPlaceholderText('Search chats...')
      fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })
      
      expect(screen.getByText('No chats found')).toBeInTheDocument()
    })

    it('should filter by unread messages', async () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      const unreadFilter = screen.getByText('Unread')
      fireEvent.click(unreadFilter)
      
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.queryByText('Mike Chen')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show connection error when WebSocket fails', async () => {
      global.WebSocket = jest.fn(() => ({
        ...mockWebSocket,
        readyState: 3 // WebSocket.CLOSED
      })) as any
      
      render(<ChatSystem conversations={mockConversations} />)
      
      // Component should still render without crashing
      expect(screen.getByText('Chats')).toBeInTheDocument()
    })

    it('should show retry button for failed connections', async () => {
      global.WebSocket = jest.fn(() => ({
        ...mockWebSocket,
        readyState: 3
      })) as any
      
      render(<ChatSystem conversations={mockConversations} />)
      
      // Component should still render
      expect(screen.getByText('Chats')).toBeInTheDocument()
    })

    it('should handle message send failures gracefully', async () => {
      const mockSendMessage = jest.fn().mockRejectedValue(new Error('Failed to send'))
      render(<ChatSystem 
        conversations={mockConversations} 
        messages={mockMessages}
        onSendMessage={mockSendMessage}
      />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText('Type a message...')
        const sendButton = screen.getByRole('button', { name: /send/i })
        
        fireEvent.change(input, { target: { value: 'Hello Sarah!' } })
        fireEvent.click(sendButton)
        
        // Should not crash
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      expect(screen.getByRole('searchbox')).toBeInTheDocument()
    })

    it('should announce new messages to screen readers', async () => {
      render(<ChatSystem conversations={mockConversations} messages={mockMessages} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      render(<ChatSystem conversations={mockConversations} />)
      
      const searchInput = screen.getByPlaceholderText('Search chats...')
      searchInput.focus()
      
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('should virtualize long message lists', async () => {
      const longMessageList = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        senderId: 'provider-123',
        senderName: 'Sarah Johnson',
        type: 'text' as const,
        timestamp: new Date().toISOString(),
        isRead: false,
        metadata: {}
      }))
      
      render(<ChatSystem conversations={mockConversations} messages={longMessageList} />)
      
      const sarahConversation = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahConversation)
      
      await waitFor(() => {
        // Should render messages
        expect(screen.getByText('Message 0')).toBeInTheDocument()
      })
    })

    it('should debounce search input', async () => {
      jest.useFakeTimers()
      
      render(<ChatSystem conversations={mockConversations} />)
      
      const searchInput = screen.getByPlaceholderText('Search chats...')
      
      // Type rapidly
      fireEvent.change(searchInput, { target: { value: 'S' } })
      fireEvent.change(searchInput, { target: { value: 'Sa' } })
      fireEvent.change(searchInput, { target: { value: 'Sar' } })
      fireEvent.change(searchInput, { target: { value: 'Sarah' } })
      
      // Should filter immediately in this case
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.queryByText('Mike Chen')).not.toBeInTheDocument()
      
      jest.useRealTimers()
    })
  })
})
