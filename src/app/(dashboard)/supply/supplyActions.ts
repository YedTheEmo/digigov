import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DeliverySchema, InspectionSchema, AcceptanceSchema } from '@/lib/validators/post_award';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { ensureRole } from '@/lib/authz';
import { logActivity } from '@/lib/activity';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function recordDelivery(formData: FormData) {
  'use server';
  try {
    const authz = await ensureRole(['SUPPLY_MANAGER', 'ADMIN'] as UserRole[]);
    if (!authz.ok) {
      return { success: false, error: 'Not authorized to record delivery.' };
    }
    const actorId = authz.user.id;

    const id = String(formData.get('id'));
    const deliveredAt = String(formData.get('deliveredAt') || '');
    const notes = String(formData.get('notes') || '');

    const parsed = DeliverySchema.safeParse({
      deliveredAt: deliveredAt || undefined,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      throw new Error('Invalid delivery data');
    }

    const existing = await prisma.procurementCase.findUnique({ where: { id } });
    if (!existing) throw new Error('Case not found');

    const currentState = existing.currentState as CaseState;
    const previousState = currentState;
    const canFirstTransition = currentState === 'NTP_ISSUED';
    const canAppendDelivery = ['DELIVERY', 'INSPECTION', 'ACCEPTANCE', 'ORS', 'DV', 'CHECK', 'CLOSED'].includes(
      currentState,
    );
    const deliveredAtDate = parsed.data.deliveredAt ? new Date(parsed.data.deliveredAt) : new Date();
    const notesValue = parsed.data.notes ?? null;

    if (!canFirstTransition && !canAppendDelivery) {
      throw new Error('Cannot record delivery in the current state.');
    }

    if (canFirstTransition) {
      await assertCanTransition(existing, 'DELIVERY' as CaseState);
    }

    await prisma.$transaction(async (tx) => {
      await tx.delivery.create({
        data: {
          caseId: id,
          deliveredAt: deliveredAtDate,
          notes: notesValue,
        },
      });
      if (canFirstTransition) {
        await tx.procurementCase.update({
          where: { id },
          data: { currentState: 'DELIVERY' as CaseState },
        });
      }
    });
    const nextState = canFirstTransition ? 'DELIVERY' : previousState;
    try {
      await logActivity({
        caseId: id,
        action: 'delivery_recorded',
        fromState: previousState,
        toState: nextState as CaseState,
        actorId,
        payload: {
          deliveredAt: deliveredAtDate.toISOString(),
          notes: notesValue,
        },
      });
    } catch (error) {
      console.error('Failed to log delivery activity:', error);
    }

    revalidatePath('/(dashboard)/supply');
    revalidatePath(`/(dashboard)/supply/${id}`);
    revalidatePath(`/(dashboard)/procurement/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to record delivery from Supply workspace:', error);
    const message = (error as Error)?.message || 'Failed to record delivery from Supply workspace.';
    console.error(message);
    return { success: false, error: message };
  }
}

export async function submitInspection(formData: FormData) {
  'use server';
  try {
    const authz = await ensureRole(['SUPPLY_MANAGER', 'ADMIN'] as UserRole[]);
    if (!authz.ok) {
      return { success: false, error: 'Not authorized to record inspection.' };
    }
    const actorId = authz.user.id;

    const id = String(formData.get('id'));
    const status = String(formData.get('status') || '');
    const inspector = String(formData.get('inspector') || '');

    const parsed = InspectionSchema.safeParse({
      status: status || undefined,
      inspector: inspector || undefined,
    });
    if (!parsed.success) {
      throw new Error('Invalid inspection data');
    }
    const statusValue = parsed.data.status ?? null;
    const inspectorValue = parsed.data.inspector ?? null;
    const inspectedAtDate = new Date();

    const existing = await prisma.procurementCase.findUnique({ where: { id } });
    if (!existing) throw new Error('Case not found');

    const currentState = existing.currentState as CaseState;
    const previousState = currentState;
    const canFirstTransition = currentState === 'DELIVERY';
    const canEditInspection = ['INSPECTION', 'ACCEPTANCE', 'ORS', 'DV', 'CHECK', 'CLOSED'].includes(currentState);

    if (!canFirstTransition && !canEditInspection) {
      throw new Error('Cannot record inspection in the current state.');
    }

    if (canFirstTransition) {
      await assertCanTransition(existing, 'INSPECTION' as CaseState);
    }

    await prisma.$transaction(async (tx) => {
      await tx.inspectionReport.upsert({
        where: { caseId: id },
        update: {
          status: statusValue,
          inspector: inspectorValue,
          inspectedAt: inspectedAtDate,
        },
        create: {
          caseId: id,
          status: statusValue,
          inspector: inspectorValue,
          inspectedAt: inspectedAtDate,
        },
      });
      if (canFirstTransition) {
        await tx.procurementCase.update({
          where: { id },
          data: { currentState: 'INSPECTION' as CaseState },
        });
      }
    });
    const nextState = canFirstTransition ? 'INSPECTION' : previousState;
    try {
      await logActivity({
        caseId: id,
        action: 'inspection_recorded',
        fromState: previousState,
        toState: nextState as CaseState,
        actorId,
        payload: {
          status: statusValue,
          inspector: inspectorValue,
          inspectedAt: inspectedAtDate.toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to log inspection activity:', error);
    }

    revalidatePath('/(dashboard)/supply');
    revalidatePath(`/(dashboard)/supply/${id}`);
    revalidatePath(`/(dashboard)/procurement/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to submit inspection from Supply workspace:', error);
    const message = (error as Error)?.message || 'Failed to submit inspection from Supply workspace.';
    console.error(message);
    return { success: false, error: message };
  }
}

export async function submitAcceptance(formData: FormData) {
  'use server';
  try {
    const authz = await ensureRole(['SUPPLY_MANAGER', 'ADMIN'] as UserRole[]);
    if (!authz.ok) {
      return { success: false, error: 'Not authorized to record acceptance.' };
    }
    const actorId = authz.user.id;

    const id = String(formData.get('id'));
    const officer = String(formData.get('officer') || '');

    const parsed = AcceptanceSchema.safeParse({
      officer: officer || undefined,
    });
    if (!parsed.success) {
      throw new Error('Invalid acceptance data');
    }
    const officerValue = parsed.data.officer ?? null;
    const acceptedAtDate = new Date();

    const existing = await prisma.procurementCase.findUnique({ where: { id } });
    if (!existing) throw new Error('Case not found');

    const currentState = existing.currentState as CaseState;
    const previousState = currentState;
    const canFirstTransition = currentState === 'INSPECTION';
    const canEditAcceptance = ['ACCEPTANCE', 'ORS', 'DV', 'CHECK', 'CLOSED'].includes(currentState);

    if (!canFirstTransition && !canEditAcceptance) {
      throw new Error('Cannot record acceptance in the current state.');
    }

    if (canFirstTransition) {
      await assertCanTransition(existing, 'ACCEPTANCE' as CaseState);
    }

    await prisma.$transaction(async (tx) => {
      await tx.acceptance.upsert({
        where: { caseId: id },
        update: {
          acceptedAt: acceptedAtDate,
          officer: officerValue,
        },
        create: {
          caseId: id,
          acceptedAt: acceptedAtDate,
          officer: officerValue,
        },
      });
      if (canFirstTransition) {
        await tx.procurementCase.update({
          where: { id },
          data: { currentState: 'ACCEPTANCE' as CaseState },
        });
      }
    });
    const nextState = canFirstTransition ? 'ACCEPTANCE' : previousState;
    try {
      await logActivity({
        caseId: id,
        action: 'acceptance_recorded',
        fromState: previousState,
        toState: nextState as CaseState,
        actorId,
        payload: {
          officer: officerValue,
          acceptedAt: acceptedAtDate.toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to log acceptance activity:', error);
    }

    revalidatePath('/(dashboard)/supply');
    revalidatePath(`/(dashboard)/supply/${id}`);
    revalidatePath(`/(dashboard)/procurement/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to submit acceptance from Supply workspace:', error);
    const message = (error as Error)?.message || 'Failed to submit acceptance from Supply workspace.';
    console.error(message);
    return { success: false, error: message };
  }
}


