import { prisma } from './prisma';
import { Resend } from 'resend';
import { z } from 'zod';

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);

// Notification types
export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PROVIDER_APPROVED = 'PROVIDER_APPROVED',
  PROVIDER_REJECTED = 'PROVIDER_REJECTED',
  COMPLIANCE_ALERT = 'COMPLIANCE_ALERT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SECURITY_ALERT = 'SECURITY_ALERT',
}

// Notification priority levels
export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Notification delivery channels
export enum DeliveryChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

// Notification template schema
const NotificationTemplateSchema = z.object({
  title: z.string(),
  subject: z.string().optional(), // for emails
  body: z.string(),
  htmlBody: z.string().optional(), // for rich email content
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
});

export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;

// Notification templates
const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.BOOKING_CONFIRMED]: {
    title: 'Booking Confirmed',
    subject: 'Your beauty appointment is confirmed!',
    body: 'Great news! Your appointment with {providerName} on {date} at {time} has been confirmed.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">🎉 Booking Confirmed!</h2>
        <p>Great news! Your appointment with <strong>{providerName}</strong> has been confirmed.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Appointment Details</h3>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Time:</strong> {time}</p>
          <p><strong>Service:</strong> {serviceName}</p>
          <p><strong>Location:</strong> {location}</p>
        </div>
        <a href="{actionUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
      </div>
    `,
    actionUrl: '/dashboard/bookings/{bookingId}',
    actionText: 'View Details',
  },
  [NotificationType.BOOKING_CANCELLED]: {
    title: 'Booking Cancelled',
    subject: 'Appointment cancellation notice',
    body: 'Your appointment with {providerName} on {date} has been cancelled.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">❌ Booking Cancelled</h2>
        <p>Your appointment with <strong>{providerName}</strong> has been cancelled.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Cancelled Appointment</h3>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Time:</strong> {time}</p>
          <p><strong>Service:</strong> {serviceName}</p>
        </div>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    `,
    actionUrl: '/dashboard/bookings',
    actionText: 'Book Again',
  },
  [NotificationType.BOOKING_REMINDER]: {
    title: 'Appointment Reminder',
    subject: 'Reminder: Your appointment is tomorrow',
    body: 'Reminder: You have an appointment with {providerName} tomorrow at {time}.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⏰ Appointment Reminder</h2>
        <p>Don't forget! You have an appointment with <strong>{providerName}</strong> tomorrow.</p>
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Appointment Details</h3>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Time:</strong> {time}</p>
          <p><strong>Service:</strong> {serviceName}</p>
          <p><strong>Location:</strong> {location}</p>
        </div>
        <a href="{actionUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
      </div>
    `,
    actionUrl: '/dashboard/bookings/{bookingId}',
    actionText: 'View Details',
  },
  [NotificationType.PAYMENT_RECEIVED]: {
    title: 'Payment Received',
    subject: 'Payment confirmation',
    body: 'We have received your payment of ${amount} for your appointment with {providerName}.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">💳 Payment Received</h2>
        <p>Thank you! We have received your payment.</p>
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Details</h3>
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>Provider:</strong> {providerName}</p>
          <p><strong>Service:</strong> {serviceName}</p>
          <p><strong>Date:</strong> {date}</p>
        </div>
        <a href="{actionUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Receipt</a>
      </div>
    `,
    actionUrl: '/dashboard/payments/{paymentId}',
    actionText: 'View Receipt',
  },
  [NotificationType.PAYMENT_FAILED]: {
    title: 'Payment Failed',
    subject: 'Payment issue - action required',
    body: 'Your payment for the appointment with {providerName} has failed. Please update your payment method.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">⚠️ Payment Failed</h2>
        <p>We encountered an issue processing your payment. Please update your payment method to avoid cancellation.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Issue</h3>
          <p><strong>Provider:</strong> {providerName}</p>
          <p><strong>Service:</strong> {serviceName}</p>
          <p><strong>Date:</strong> {date}</p>
        </div>
        <a href="{actionUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Payment</a>
      </div>
    `,
    actionUrl: '/dashboard/payments/update',
    actionText: 'Update Payment',
  },
  [NotificationType.REVIEW_RECEIVED]: {
    title: 'New Review Received',
    subject: 'You received a new review',
    body: 'You received a {rating}-star review from {clientName} for your {serviceName} service.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">⭐ New Review Received</h2>
        <p>Great news! You received a new review from <strong>{clientName}</strong>.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Review Details</h3>
          <p><strong>Rating:</strong> {'⭐'.repeat(rating)}</p>
          <p><strong>Service:</strong> {serviceName}</p>
          <p><strong>Comment:</strong> "{comment}"</p>
        </div>
        <a href="{actionUrl}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Review</a>
      </div>
    `,
    actionUrl: '/dashboard/reviews',
    actionText: 'View Review',
  },
  [NotificationType.PROVIDER_APPROVED]: {
    title: 'Provider Account Approved',
    subject: 'Welcome to Beauty Crafter!',
    body: 'Congratulations! Your provider account has been approved. You can now start accepting bookings.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Welcome to Beauty Crafter!</h2>
        <p>Congratulations! Your provider account has been approved.</p>
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Next Steps</h3>
          <p>1. Complete your profile</p>
          <p>2. Add your services</p>
          <p>3. Set your availability</p>
          <p>4. Start accepting bookings!</p>
        </div>
        <a href="{actionUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Get Started</a>
      </div>
    `,
    actionUrl: '/provider/dashboard',
    actionText: 'Get Started',
  },
  [NotificationType.PROVIDER_REJECTED]: {
    title: 'Provider Account Update',
    subject: 'Account application status',
    body: 'We regret to inform you that your provider account application requires additional information.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">📋 Account Application Update</h2>
        <p>We need additional information to complete your provider account application.</p>
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Required Information</h3>
          <p>{requirements}</p>
        </div>
        <p>Please review and submit the required documents to proceed.</p>
        <a href="{actionUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Application</a>
      </div>
    `,
    actionUrl: '/provider/onboarding',
    actionText: 'Update Application',
  },
  [NotificationType.COMPLIANCE_ALERT]: {
    title: 'Compliance Alert',
    subject: 'Action required: Compliance update',
    body: 'Your account requires attention: {alertMessage}. Please address this within {deadline} days.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🚨 Compliance Alert</h2>
        <p>Your account requires immediate attention to maintain compliance.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Alert Details</h3>
          <p><strong>Issue:</strong> {alertMessage}</p>
          <p><strong>Deadline:</strong> {deadline} days</p>
          <p><strong>Severity:</strong> {severity}</p>
        </div>
        <a href="{actionUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Resolve Issue</a>
      </div>
    `,
    actionUrl: '/provider/compliance',
    actionText: 'Resolve Issue',
  },
  [NotificationType.SYSTEM_MAINTENANCE]: {
    title: 'System Maintenance',
    subject: 'Scheduled maintenance notice',
    body: 'Beauty Crafter will be undergoing scheduled maintenance on {date} from {startTime} to {endTime}.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">🔧 Scheduled Maintenance</h2>
        <p>Beauty Crafter will be temporarily unavailable during scheduled maintenance.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Maintenance Window</h3>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Start Time:</strong> {startTime}</p>
          <p><strong>End Time:</strong> {endTime}</p>
          <p><strong>Duration:</strong> {duration}</p>
        </div>
        <p>We apologize for any inconvenience. The platform will be fully functional after maintenance.</p>
      </div>
    `,
  },
  [NotificationType.SECURITY_ALERT]: {
    title: 'Security Alert',
    subject: 'Important security notice',
    body: 'We detected unusual activity on your account. Please verify your recent activity.',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🔒 Security Alert</h2>
        <p>We detected unusual activity on your account that requires your attention.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Security Notice</h3>
          <p><strong>Activity:</strong> {activity}</p>
          <p><strong>Location:</strong> {location}</p>
          <p><strong>Time:</strong> {time}</p>
        </div>
        <p>If this was you, no action is needed. If not, please secure your account immediately.</p>
        <a href="{actionUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Secure Account</a>
      </div>
    `,
    actionUrl: '/security/account',
    actionText: 'Secure Account',
  },
};

// Notification data interface
export interface NotificationData {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  channels?: DeliveryChannel[];
  data?: Record<string, any>;
  scheduledFor?: Date;
  expiresAt?: Date;
}

// Create notification function
export async function createNotification(notificationData: NotificationData) {
  try {
    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        title: NOTIFICATION_TEMPLATES[notificationData.type].title,
        message: NOTIFICATION_TEMPLATES[notificationData.type].body,
        type: notificationData.type,
        data: notificationData.data || {},
      },
    });

    // Send notifications through different channels
    const channels = notificationData.channels || [DeliveryChannel.EMAIL, DeliveryChannel.IN_APP];
    
    for (const channel of channels) {
      switch (channel) {
        case DeliveryChannel.EMAIL:
          await sendEmailNotification(notificationData);
          break;
        case DeliveryChannel.PUSH:
          await sendPushNotification(notificationData);
          break;
        case DeliveryChannel.SMS:
          await sendSMSNotification(notificationData);
          break;
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Send email notification
async function sendEmailNotification(notificationData: NotificationData) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: notificationData.userId },
      select: { email: true, name: true },
    });

    if (!user?.email) return;

    const template = NOTIFICATION_TEMPLATES[notificationData.type];
    const htmlBody = template.htmlBody ? 
      replaceTemplateVariables(template.htmlBody, notificationData.data || {}) : 
      template.body;

    await resend.emails.send({
      from: 'Beauty Crafter <notifications@beautycrafter.com>',
      to: user.email,
      subject: template.subject || template.title,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

// Send push notification (placeholder for future implementation)
async function sendPushNotification(notificationData: NotificationData) {
  // TODO: Implement push notification service (Firebase, OneSignal, etc.)
  console.log('Push notification not yet implemented');
}

// Send SMS notification (placeholder for future implementation)
async function sendSMSNotification(notificationData: NotificationData) {
  // TODO: Implement SMS service (Twilio, AWS SNS, etc.)
  console.log('SMS notification not yet implemented');
}

// Replace template variables
function replaceTemplateVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match;
  });
}

// Get user notifications
export async function getUserNotifications(userId: string, limit = 50, offset = 0) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  return await prisma.notification.delete({
    where: { id: notificationId },
  });
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string) {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
}

// Send bulk notifications
export async function sendBulkNotifications(
  userIds: string[],
  notificationData: Omit<NotificationData, 'userId'>
) {
  const notifications = [];
  
  for (const userId of userIds) {
    try {
      const notification = await createNotification({
        ...notificationData,
        userId,
      });
      notifications.push(notification);
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
    }
  }
  
  return notifications;
}

// Schedule notification for future delivery
export async function scheduleNotification(
  notificationData: NotificationData,
  scheduledFor: Date
) {
  // TODO: Implement job queue system (Bull, Agenda, etc.) for scheduled notifications
  console.log('Scheduled notifications not yet implemented');
  
  // For now, create the notification immediately
  return await createNotification(notificationData);
}

// Send booking reminder notifications
export async function sendBookingReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const bookings = await prisma.booking.findMany({
    where: {
      scheduledDate: {
        gte: tomorrow,
        lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      },
      status: 'CONFIRMED',
    },
    include: {
      client: { include: { user: true } },
      provider: { include: { user: true } },
      service: true,
    },
  });

  for (const booking of bookings) {
    await createNotification({
      userId: booking.client.userId,
      type: NotificationType.BOOKING_REMINDER,
      priority: NotificationPriority.NORMAL,
      channels: [DeliveryChannel.EMAIL, DeliveryChannel.IN_APP],
      data: {
        providerName: booking.provider.user.name,
        date: booking.scheduledDate.toLocaleDateString(),
        time: booking.startTime,
        serviceName: booking.service.name,
        location: booking.location,
        bookingId: booking.id,
      },
    });
  }
} 