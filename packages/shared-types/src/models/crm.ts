/**
 * CRM Models — TIK TAK RUN Shared Types
 * Campaign, CustomerSegment, PipelineDeal
 */

import type { CampaignType, CampaignStatus, PipelineStage } from '../enums';
import type { User } from './user';

export interface CustomerSegment {
  id: number;
  name: string;
  conditions: SegmentConditions;
  color: string;
  icon: string;
  cachedCount: number;
  lastComputedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentConditions {
  rules: SegmentRule[];
}

export interface SegmentRule {
  field: string;
  op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between' | 'contains';
  value: unknown;
}

export interface Campaign {
  id: number;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  segmentId?: number;
  content: CampaignContent;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  /** BigInt → string */
  budget: string;
  revenue: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  segment?: CustomerSegment;
  creator?: Pick<User, 'id' | 'fullName'>;
}

export interface CampaignContent {
  subject?: string;
  body?: string;
  templateId?: string;
  templateVars?: Record<string, unknown>;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CampaignStats {
  openRate: string;
  clickRate: string;
  conversionRate: string;
  roi: string;
}

export interface PipelineDeal {
  id: number;
  name: string;
  customerId?: number;
  /** BigInt → string (تومان) */
  value: string;
  stage: PipelineStage;
  position: number;
  ownerId: number;
  tag?: string;
  expectedCloseDate?: string;
  notes?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;

  customer?: Pick<User, 'id' | 'fullName' | 'mobile'>;
  owner?: Pick<User, 'id' | 'fullName'>;
}

/** Board view برای Kanban پایپ‌لاین */
export interface PipelineBoard {
  leads: PipelineDeal[];
  contacted: PipelineDeal[];
  proposed: PipelineDeal[];
  negotiating: PipelineDeal[];
  closedWon: PipelineDeal[];
  closedLost: PipelineDeal[];
}
