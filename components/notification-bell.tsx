'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, Check, X, AlertCircle, Info, MessageSquare } from 'lucide-react'
import { apiClient } from '@/lib/api'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
  actionText?: string
}

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.get(`/api/notifications?userId=${session.user.id}`)
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.notifications?.filter((n: Notification) => !n.isRead).length || 0)
    } catch (err) {
      setError('Failed to fetch notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`)
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.patch('/api/notifications/mark-all-read', {
        userId: session?.user?.id
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }, [session?.user?.id])

  // Handle notification action
  const handleNotificationAction = useCallback((notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setIsOpen(false)
    }
  }, [router])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      // Update unread count if notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId)
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }, [notifications])

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <X className="w-4 h-4 text-red-500" />
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Fetch notifications on mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session?.user?.id, fetchNotifications])

  // Set up real-time updates (WebSocket or polling)
  useEffect(() => {
    if (!session?.user?.id) return

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [session?.user?.id, fetchNotifications])

  if (!session?.user?.id) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                <p>{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete notification"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Mark as read
                              </button>
                            )}
                            {notification.actionUrl && notification.actionText && (
                              <button
                                onClick={() => handleNotificationAction(notification)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                {notification.actionText}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{unreadCount} unread</span>
                <button
                  onClick={() => router.push('/notifications')}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 