import { prisma } from '@/lib/prisma';
import type { CaseState } from '@/generated/prisma';
import { canPerform, type Action, type Role } from '@/lib/permissions';

export async function hasDownstreamData(caseId: string, action: Action): Promise<boolean> {
  // Check if there is data in stages *after* the given action.
  // This is critical for determining if an edit requires an override or if a delete is blocked.

  switch (action) {
    case 'ors':
      // After ORS comes DV
      const dv = await prisma.dV.count({ where: { caseId } });
      return dv > 0;
    case 'dv':
      // After DV comes Check
      const check = await prisma.check.count({ where: { caseId } });
      return check > 0;
    case 'check':
      // After Check comes Closed/CheckAdvice
      // If check advice exists or case is closed?
      // Usually Check is the last major editable thing before closing.
      // Let's say Check Advice or simple 'CLOSED' state.
      const c = await prisma.procurementCase.findUnique({ where: { id: caseId }, select: { currentState: true } });
      return c?.currentState === 'CLOSED';
    case 'rfq':
      // After RFQ comes Quotations, Abstract
      const quotes = await prisma.quotation.count({ where: { caseId } });
      return quotes > 0;
    case 'quotation':
       // After Quotation comes Abstract
       const abstract = await prisma.abstractOfQuotations.count({ where: { caseId } });
       return abstract > 0;
    case 'abstract':
       const bac = await prisma.bACResolution.count({ where: { caseId } });
       return bac > 0;
    case 'bac_resolution':
       const award = await prisma.award.count({ where: { caseId } });
       return award > 0;
    case 'award':
       const contract = await prisma.contract.count({ where: { caseId } });
       const po = await prisma.purchaseOrder.count({ where: { caseId } });
       return contract > 0 || po > 0;
    case 'contract':
       const ntp = await prisma.noticeToProceed.count({ where: { caseId } });
       return ntp > 0;
    case 'ntp':
       const del = await prisma.delivery.count({ where: { caseId } });
       const billing = await prisma.progressBilling.count({ where: { caseId } });
       return del > 0 || billing > 0;
    case 'delivery':
       const ins = await prisma.inspectionReport.count({ where: { caseId } });
       return ins > 0;
    case 'inspection':
       const acc = await prisma.acceptance.count({ where: { caseId } });
       return acc > 0;
    case 'acceptance':
       const ors = await prisma.oRS.count({ where: { caseId } });
       return ors > 0;
    
    default:
      return false;
  }
}

export async function validateEdit(
  caseId: string,
  action: Action,
  role: Role
): Promise<{ allowed: boolean; reason?: string; requiresOverride?: boolean }> {
  // 1. Check basic permission
  if (!canPerform(role, action, 'edit')) {
    return { allowed: false, reason: `Role ${role} cannot edit ${action}` };
  }

  // 2. Check downstream data
  const hasDownstream = await hasDownstreamData(caseId, action);
  if (hasDownstream) {
    // If downstream data exists, we require ADMIN override
    if (canPerform(role, action, 'admin_override')) {
      return { allowed: true, requiresOverride: true };
    } else {
      return { 
        allowed: false, 
        reason: `Cannot edit ${action} because downstream data exists. Admin override required.` 
      };
    }
  }

  return { allowed: true };
}

export async function validateDelete(
  caseId: string,
  action: Action,
  role: Role
): Promise<{ allowed: boolean; reason?: string; requiresOverride?: boolean }> {
  // 1. Check basic permission
  if (!canPerform(role, action, 'delete')) {
    return { allowed: false, reason: `Role ${role} cannot delete ${action}` };
  }

  // 2. Check downstream data
  // Deletion is more destructive. If downstream data exists, we usually BLOCK it 
  // unless it's a cascading delete handled by Admin.
  const hasDownstream = await hasDownstreamData(caseId, action);
  if (hasDownstream) {
    if (canPerform(role, action, 'admin_override')) {
      return { allowed: true, requiresOverride: true };
    } else {
      return { 
        allowed: false, 
        reason: `Cannot delete ${action} because downstream data exists. Admin override required to cascade delete.` 
      };
    }
  }

  return { allowed: true };
}

export function getPreviousState(currentState: CaseState): CaseState | null {
  // Map current state to the state BEFORE it.
  // Used for rolling back state when an entity is deleted.
  // This is a simplification; exact rollback depends on method. 
  // But usually, if we are at 'ORS' and we delete the ORS, we go back to 'ACCEPTANCE' (or whatever was before).

  // Inverse of the procurement workflow roughly.
  switch (currentState) {
    case 'CLOSED': return 'CHECK';
    case 'CHECK': return 'DV';
    case 'DV': return 'ORS';
    case 'ORS': return 'ACCEPTANCE';
    case 'ACCEPTANCE': return 'INSPECTION';
    case 'INSPECTION': return 'DELIVERY';
    case 'DELIVERY': return 'NTP_ISSUED';
    case 'PMT_INSPECTION': return 'PROGRESS_BILLING';
    case 'PROGRESS_BILLING': return 'NTP_ISSUED';
    case 'NTP_ISSUED': return 'CONTRACT_SIGNED';
    case 'CONTRACT_SIGNED': return 'PO_APPROVED'; // or AWARDED
    case 'PO_APPROVED': return 'AWARDED';
    case 'AWARDED': return 'BAC_RESOLUTION';
    case 'BAC_RESOLUTION': return 'POST_QUALIFICATION'; // or ABSTRACT
    case 'ABSTRACT_OF_QUOTATIONS': return 'QUOTATION_COLLECTION'; // or RFQ_ISSUED
    case 'QUOTATION_COLLECTION': return 'RFQ_ISSUED';
    case 'RFQ_ISSUED': return 'DRAFT'; // or POSTING
    case 'POST_QUALIFICATION': return 'TWG_EVALUATION';
    case 'TWG_EVALUATION': return 'BID_SUBMISSION_OPENING';
    case 'BID_SUBMISSION_OPENING': return 'PRE_BID_CONF'; // or POSTING
    default: return null; 
  }
}


