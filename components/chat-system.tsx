'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
// import { Search as SearchIcon } from 'lucide-react' // Removed due to type error

export interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  type: 'text' | 'image' | 'file' | 'system'
  timestamp: string
  isRead: boolean
  metadata: {
    imageUrl?: string
    fileName?: string
    fileSize?: number
    serviceName?: string
  }
}

export interface ChatRoom {
  id: string
  name: string
  type: 'direct' | 'group'
  participants: string[]
  lastMessage: Message
  unreadCount: number
  isOnline: boolean
  avatar?: string
}

export interface ChatSystemProps {
  conversations?: ChatRoom[]
  messages?: Message[]
  initialRoomId?: string | null
  onSendMessage?: (message: Omit<Message, 'id' | 'timestamp' | 'isRead' | 'metadata' | 'senderName'>) => void
  className?: string
}

export function ChatSystem({
  conversations = [],
  messages: initialMessages = [],
  initialRoomId = null,
  onSendMessage,
  className
}: ChatSystemProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online'>('all')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = useState<string>('')
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)

  if (!session?.user?.id) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">Please sign in to access chat</p>
      </div>
    )
  }

  // Filter conversations based on search and filter
  const filteredRooms = useMemo(() => {
    return conversations.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterType === 'all' ||
        (filterType === 'unread' && room.unreadCount > 0) ||
        (filterType === 'online' && room.isOnline)

      return matchesSearch && matchesFilter
    })
  }, [conversations, searchQuery, filterType])

  // Get selected room
  const selectedRoom = useMemo(() => {
    return conversations.find(room => room.id === selectedRoomId)
  }, [conversations, selectedRoomId])

  // Get messages for selected room
  const roomMessages = useMemo(() => {
    if (!selectedRoomId) return []
    return messages.filter(msg => 
      msg.senderId === selectedRoomId || 
      msg.senderId === session.user.id ||
      msg.metadata?.serviceName === selectedRoomId
    )
  }, [messages, selectedRoomId, session.user.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [roomMessages])

  // WebSocket connection
  useEffect(() => {
    if (typeof WebSocket !== 'undefined') {
      try {
        const ws = new WebSocket('ws://localhost:3001/chat')
        setWsConnection(ws)

        ws.onopen = () => {
          console.log('WebSocket connected')
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'message') {
              setMessages(prev => [...prev, data.message])
              setAnnouncement(`New message from ${data.message.senderName}: ${data.message.content}`)
              setTimeout(() => setAnnouncement(''), 3000)
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
        }

        return () => {
          ws.close()
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
      }
    }
  }, [])

  // Handle sending message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedRoomId) return

    const message: Omit<Message, 'id' | 'timestamp' | 'isRead' | 'metadata' | 'senderName'> = {
      content: newMessage.trim(),
      senderId: session.user.id,
      type: 'text'
    }

    if (onSendMessage) {
      onSendMessage(message)
    } else {
      // Local message handling
      const newMsg: Message = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        isRead: false,
        senderName: session.user.name || 'You',
        metadata: {}
      }
      setMessages(prev => [...prev, newMsg])
      
      // Announce new message for screen readers
      setAnnouncement(`New message: ${newMsg.content}`)
      setTimeout(() => setAnnouncement(''), 3000)

      // Send via WebSocket if available
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify({
          type: 'message',
          roomId: selectedRoomId,
          message: newMsg
        }))
      }
    }

    setNewMessage('')
  }, [newMessage, selectedRoomId, onSendMessage, session.user.id, session.user.name, wsConnection])

  // Handle room selection
  const handleRoomSelect = useCallback((roomId: string) => {
    setSelectedRoomId(roomId)
  }, [])

  // Handle key press in message input
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  return (
    <div className={`flex h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Chat Rooms Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>

          {/* Search */}
          <div className="mt-3 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              role="searchbox"
              aria-label="Search chats"
            />
          </div>

          {/* Filter */}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filterType === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-pressed={filterType === 'all'}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1 text-sm rounded-full ${
                filterType === 'unread'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-pressed={filterType === 'unread'}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterType('online')}
              className={`px-3 py-1 text-sm rounded-full ${
                filterType === 'online'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-pressed={filterType === 'online'}
            >
              Online
            </button>
          </div>
        </div>

        {/* Chat Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No chats found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedRoomId === room.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleRoomSelect(room.id)}
                  role="button"
                  tabIndex={0}
                  aria-selected={selectedRoomId === room.id}
                  onKeyPress={(e) => e.key === 'Enter' && handleRoomSelect(room.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        {room.avatar ? (
                          <img src={room.avatar} alt={room.name} className="w-12 h-12 rounded-full" />
                        ) : (
                          <span className="text-gray-600 font-medium text-lg">
                            {room.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {room.isOnline && (
                        <div 
                          className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                          data-testid="online-status"
                        ></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {room.name}
                        </h3>
                        {room.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        )}
                      </div>
                      {room.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {room.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {selectedRoom.avatar ? (
                    <img src={selectedRoom.avatar} alt={selectedRoom.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {selectedRoom.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedRoom.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedRoom.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {roomMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                roomMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === session.user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === session.user.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === session.user.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                      {message.isRead && (
                        <div className="text-xs mt-1 text-gray-400">
                          ✓ Read
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Type your message"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">Select a chat</h3>
              <p className="text-sm">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  )
} 