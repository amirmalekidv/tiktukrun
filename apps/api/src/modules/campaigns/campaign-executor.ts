import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { SegmentEvaluator } from '../segments/segment-evaluator';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../sms/sms.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CampaignExecutor {
  private readonly logger = new Logger(CampaignExecutor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluator: SegmentEvaluator,
    private readonly notifications: NotificationsService,
    private readonly sms: SmsService,
  ) {}

  async execute(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });

    // Get recipients
    const recipients = await this.getRecipients(campaign);
    this.logger.log(
      `Campaign "${campaign.name}" sending to ${recipients.length} users`,
    );

    let sentCount = 0;
    let failedCount = 0;

    for (const user of recipients) {
      try {
        const trackingToken = randomBytes(16).toString('hex');

        await this.sendToUser(campaign, user, trackingToken);

        await this.prisma.campaignRecipient.upsert({
          where: {
            campaignId_userId: { campaignId, userId: user.id },
          },
          create: {
            campaignId,
            userId: user.id,
            status: 'SENT',
            trackingToken,
            sentAt: new Date(),
          },
          update: {
            status: 'SENT',
            sentAt: new Date(),
            trackingToken,
          },
        });

        sentCount++;
      } catch (err) {
        this.logger.error(
          `Failed to send campaign to user ${user.id}: ${err.message}`,
        );
        failedCount++;
      }
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    this.logger.log(
      `Campaign "${campaign.name}" completed: ${sentCount} sent, ${failedCount} failed`,
    );
  }

  private async sendToUser(
    campaign: any,
    user: any,
    trackingToken: string,
  ): Promise<void> {
    const content = campaign.content as any;

    // Resolve variables
    const body = this.resolveTemplate(content.body, {
      name: user.fullName ?? user.nickname ?? '',
      phone: user.mobile ?? '',
      mobile: user.mobile ?? '',
      trackingToken,
    });

    const type =
      campaign.type === 'IN_APP' ? 'INAPP' : campaign.type;

    switch (type) {
      case 'SMS':
        if (!user.mobile) {
          this.logger.warn(`Skipping SMS campaign for user ${user.id}: no mobile`);
          return;
        }
        await this.sms.send(user.mobile, body);
        break;

      case 'INAPP':
        await this.notifications.send({
          userId: user.id,
          type: NotificationType.CAMPAIGN,
          channel: NotificationChannel.INAPP,
          title: content.subject ?? campaign.name,
          body,
          data: { campaignId: campaign.id, trackingToken },
        });
        break;

      case 'PUSH':
        await this.notifications.send({
          userId: user.id,
          type: NotificationType.PUSH_CAMPAIGN,
          channel: NotificationChannel.INAPP,
          title: content.subject ?? campaign.name,
          body,
          data: { campaignId: campaign.id, trackingToken },
        });
        break;

      case 'EMAIL':
        throw new Error('EMAIL channel is not implemented (501)');
    }
  }

  private resolveTemplate(
    template: string,
    vars: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value ?? '');
    }
    return result;
  }

  private async getRecipients(campaign: any): Promise<any[]> {
    if (campaign.segmentId) {
      return this.evaluator.getMembers(campaign.segmentId, 100000);
    }

    // All users if no segment
    return this.prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, fullName: true, mobile: true, email: true },
    });
  }

  /**
   * Track conversion: booking within 7 days of click
   */
  async trackConversion(trackingToken: string): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000);

    const recipient = await this.prisma.campaignRecipient.findFirst({
      where: {
        trackingToken,
        clickedAt: { gte: sevenDaysAgo },
      },
    });

    if (!recipient) return;

    await this.prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: { status: 'CONVERTED', convertedAt: new Date() },
    });

    await this.prisma.campaign.update({
      where: { id: recipient.campaignId },
      data: { convertedCount: { increment: 1 } },
    });
  }

  /**
   * Track click event
   */
  async trackClick(trackingToken: string): Promise<void> {
    await this.prisma.campaignRecipient.updateMany({
      where: { trackingToken },
      data: { status: 'CLICKED', clickedAt: new Date() },
    });

    await this.prisma.campaign.updateMany({
      where: {
        recipients: { some: { trackingToken } },
      },
      data: { clickedCount: { increment: 1 } },
    });
  }

  /**
   * Track open event
   */
  async trackOpen(trackingToken: string): Promise<void> {
    await this.prisma.campaignRecipient.updateMany({
      where: { trackingToken, status: 'SENT' },
      data: { status: 'OPENED', openedAt: new Date() },
    });
  }
}
