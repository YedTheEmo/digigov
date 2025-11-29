import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logActivity, logEdit, logDelete } from '@/lib/activity';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    activityLog: {
      create: vi.fn(),
    },
  },
}));

describe('activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logActivity', () => {
    it('creates activity log with all fields', async () => {
      const params = {
        caseId: 'case-123',
        action: 'test-action',
        fromState: 'DRAFT' as const,
        toState: 'POSTING' as const,
        legalBasis: 'Legal basis',
        payload: { test: 'data' },
        actorId: 'actor-123',
        changeType: 'TRANSITION' as const,
        entity: 'RFQ',
        entityId: 'rfq-123',
        before: { old: 'value' },
        after: { new: 'value' },
        reason: 'Test reason',
        performedByRole: 'ADMIN' as const,
        isOverride: true,
      };

      await logActivity(params);

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case-123',
          action: 'test-action',
          fromState: 'DRAFT',
          toState: 'POSTING',
          legalBasis: 'Legal basis',
          payload: { test: 'data' },
          actorId: 'actor-123',
          changeType: 'TRANSITION',
          entity: 'RFQ',
          entityId: 'rfq-123',
          before: { old: 'value' },
          after: { new: 'value' },
          reason: 'Test reason',
          performedByRole: 'ADMIN',
          isOverride: true,
        },
      });
    });

    it('uses default values for optional fields', async () => {
      await logActivity({
        caseId: 'case-123',
        action: 'test-action',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case-123',
          action: 'test-action',
          fromState: null,
          toState: null,
          legalBasis: null,
          payload: undefined,
          actorId: undefined,
          changeType: 'TRANSITION',
          entity: null,
          entityId: null,
          before: undefined,
          after: undefined,
          reason: null,
          performedByRole: undefined,
          isOverride: false,
        },
      });
    });

    it('handles null values correctly', async () => {
      await logActivity({
        caseId: 'case-123',
        action: 'test-action',
        actorId: null,
        reason: null,
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: undefined,
            reason: null,
          }),
        }),
      );
    });
  });

  describe('logEdit', () => {
    it('creates edit activity log', async () => {
      await logEdit({
        caseId: 'case-123',
        entity: 'RFQ',
        entityId: 'rfq-123',
        before: { old: 'value' },
        after: { new: 'value' },
        reason: 'Updated',
        actorId: 'actor-123',
        role: 'ADMIN' as const,
        isOverride: false,
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          caseId: 'case-123',
          action: 'update_rfq',
          changeType: 'UPDATE',
          entity: 'RFQ',
          entityId: 'rfq-123',
          before: { old: 'value' },
          after: { new: 'value' },
          reason: 'Updated',
          actorId: 'actor-123',
          performedByRole: 'ADMIN',
          isOverride: false,
        }),
      });
    });

    it('lowercases entity name in action', async () => {
      await logEdit({
        caseId: 'case-123',
        entity: 'ORS',
        before: {},
        after: {},
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'update_ors',
        }),
      });
    });
  });

  describe('logDelete', () => {
    it('creates delete activity log', async () => {
      await logDelete({
        caseId: 'case-123',
        entity: 'RFQ',
        entityId: 'rfq-123',
        before: { deleted: 'data' },
        reason: 'No longer needed',
        actorId: 'actor-123',
        role: 'ADMIN' as const,
        isOverride: true,
        fromState: 'DRAFT' as const,
        toState: 'DRAFT' as const,
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          caseId: 'case-123',
          action: 'delete_rfq',
          changeType: 'DELETE',
          entity: 'RFQ',
          entityId: 'rfq-123',
          before: { deleted: 'data' },
          reason: 'No longer needed',
          actorId: 'actor-123',
          performedByRole: 'ADMIN',
          isOverride: true,
          fromState: 'DRAFT',
          toState: 'DRAFT',
        }),
      });
    });

    it('lowercases entity name in action', async () => {
      await logDelete({
        caseId: 'case-123',
        entity: 'DV',
        before: {},
        reason: 'Deleted',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'delete_dv',
        }),
      });
    });
  });
});

