import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  createNotification, 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  NotificationType,
  NotificationData
} from '@/lib/notifications';
import { z } from 'zod';

// Schema for creating notifications
const CreateNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  userId: z.string().optional(), // Optional for admin creating notifications
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['EMAIL', 'PUSH', 'SMS', 'IN_APP'])).optional(),
});

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    let notifications;
    if (unreadOnly) {
      notifications = await prisma.notification.findMany({
        where: { 
          userId: session.user.id,
          isRead: false 
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } else {
      notifications = await getUserNotifications(session.user.id, limit, offset);
    }

    const unreadCount = await getUnreadNotificationCount(session.user.id);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateNotificationSchema.parse(body);

    // Check if user is admin for creating notifications for other users
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { admin: true },
    });

    if (validatedData.userId && validatedData.userId !== session.user.id) {
      if (!user?.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const notificationData: NotificationData = {
      userId: validatedData.userId || session.user.id,
      type: validatedData.type,
      data: validatedData.data,
      channels: validatedData.channels,
    };

    const notification = await createNotification(notificationData);

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Update notification (mark as read)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId } = body;

    if (action === 'mark-read' && notificationId) {
      const notification = await markNotificationAsRead(notificationId);
      return NextResponse.json({ notification });
    }

    if (action === 'mark-all-read') {
      await markAllNotificationsAsRead(session.user.id);
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteNotification(notificationId);

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
} 