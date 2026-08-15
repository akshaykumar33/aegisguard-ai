import {
  db,
  users,
  customers,
  plans,
  subscriptions,
  notifications,
  notificationRecipients,
  announcements
} from '@codeguard/database';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { NotificationType, NotificationPriority, Announcement } from '@codeguard/types';
import { logger } from '@codeguard/logger';

export interface TargetAudience {
  type: 'EVERYONE' | 'CUSTOMER_TYPE' | 'PROFESSION' | 'PLAN' | 'ORGANIZATION' | 'INDIVIDUAL';
  value?: string; // e.g. 'STUDENT', 'PRO', or planId / orgId / customerId
}

export class NotificationDispatcher {
  /**
   * Calculate estimated recipients for an audience query before sending.
   */
  async estimateAudience(target: TargetAudience): Promise<{ count: number; description: string }> {
    const recipients = await this.resolveRecipients(target);
    let descText = 'All active users across the platform';
    if (target.type === 'CUSTOMER_TYPE') descText = `All customers of type ${target.value}`;
    if (target.type === 'PROFESSION') descText = `All customers in profession ${target.value}`;
    if (target.type === 'PLAN') descText = `Subscribers on plan tier ${target.value}`;
    if (target.type === 'ORGANIZATION') descText = `Members of organization ${target.value}`;
    if (target.type === 'INDIVIDUAL') descText = `Individual customer ${target.value}`;

    return {
      count: recipients.length,
      description: descText
    };
  }

  /**
   * Broadcast notification to targeted recipients asynchronously.
   */
  async broadcastNotification(params: {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    channels: string[];
    targetAudience: TargetAudience;
    senderUserId?: string;
    actionUrl?: string;
    expiresAt?: Date;
  }): Promise<{ notificationId: string; recipientCount: number }> {
    // 1. Create notification record
    const [notif] = await db
      .insert(notifications)
      .values({
        title: params.title,
        message: params.message,
        type: params.type,
        priority: params.priority,
        channelsJson: params.channels,
        targetAudienceJson: params.targetAudience as any,
        senderUserId: params.senderUserId,
        actionUrl: params.actionUrl,
        expiresAt: params.expiresAt
      })
      .returning();

    // 2. Resolve audience
    const targetUsers = await this.resolveRecipients(params.targetAudience);

    // 3. Batch insert recipient delivery records
    if (targetUsers.length > 0) {
      const recipientRows = targetUsers.map((u) => ({
        notificationId: notif.id,
        userId: u.userId,
        customerId: u.customerId,
        isRead: false
      }));

      // Insert in chunks of 500
      for (let i = 0; i < recipientRows.length; i += 500) {
        await db.insert(notificationRecipients).values(recipientRows.slice(i, i + 500));
      }
    }

    logger.info(
      { notificationId: notif.id, recipientsCount: targetUsers.length, type: params.type },
      'Notification broadcast delivered'
    );

    return {
      notificationId: notif.id,
      recipientCount: targetUsers.length
    };
  }

  /**
   * Helper to resolve target recipients.
   */
  private async resolveRecipients(target: TargetAudience): Promise<Array<{ userId: string; customerId: string }>> {
    if (target.type === 'INDIVIDUAL' && target.value) {
      const [cust] = await db.select().from(customers).where(eq(customers.id, target.value)).limit(1);
      if (cust && cust.primaryUserId) {
        return [{ userId: cust.primaryUserId, customerId: cust.id }];
      }
      return [];
    }

    if (target.type === 'CUSTOMER_TYPE' && target.value) {
      const custs = await db.select().from(customers).where(eq(customers.type, target.value));
      return custs.filter((c) => c.primaryUserId).map((c) => ({ userId: c.primaryUserId!, customerId: c.id }));
    }

    if (target.type === 'PLAN' && target.value) {
      const subs = await db
        .select({ customerId: subscriptions.customerId })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(eq(plans.tier, target.value as any));

      const customerIds = subs.map((s) => s.customerId);
      if (customerIds.length === 0) return [];

      const custs = await db.select().from(customers).where(inArray(customers.id, customerIds));
      return custs.filter((c) => c.primaryUserId).map((c) => ({ userId: c.primaryUserId!, customerId: c.id }));
    }

    // Default: EVERYONE - all customers with primary user
    const allCusts = await db.select().from(customers).where(eq(customers.status, 'ACTIVE'));
    return allCusts.filter((c) => c.primaryUserId).map((c) => ({ userId: c.primaryUserId!, customerId: c.id }));
  }

  /**
   * Fetch in-app notifications for a user.
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    const records = await db
      .select({
        recipientId: notificationRecipients.id,
        isRead: notificationRecipients.isRead,
        readAt: notificationRecipients.readAt,
        createdAt: notificationRecipients.createdAt,
        notification: notifications
      })
      .from(notificationRecipients)
      .innerJoin(notifications, eq(notificationRecipients.notificationId, notifications.id))
      .where(and(eq(notificationRecipients.userId, userId), eq(notificationRecipients.isDismissed, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return records.map((r) => ({
      id: r.recipientId,
      notificationId: r.notification.id,
      title: r.notification.title,
      message: r.notification.message,
      type: r.notification.type,
      priority: r.notification.priority,
      actionUrl: r.notification.actionUrl,
      isRead: r.isRead,
      readAt: r.readAt,
      createdAt: r.notification.createdAt
    }));
  }

  /**
   * Mark notification as read.
   */
  async markAsRead(recipientId: string): Promise<void> {
    await db
      .update(notificationRecipients)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notificationRecipients.id, recipientId));
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notificationRecipients)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notificationRecipients.userId, userId), eq(notificationRecipients.isRead, false)));
  }

  /**
   * Fetch active announcements.
   */
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const list = await db
      .select()
      .from(announcements)
      .where(eq(announcements.status, 'PUBLISHED'))
      .orderBy(desc(announcements.createdAt));

    return list as any;
  }
}

export const notificationDispatcher = new NotificationDispatcher();
