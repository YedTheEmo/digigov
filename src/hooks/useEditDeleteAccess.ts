import { useMemo } from 'react';
import { type Role, type Action, canPerform } from '@/lib/permissions';
import type { ProcurementCase, ORS, DV, Check, RFQ, Quotation, AbstractOfQuotations, BACResolution, Award, Contract, NoticeToProceed, Delivery, InspectionReport, Acceptance } from '@/generated/prisma';

// Define a type that includes the relations we check for downstream data
type CaseWithRelations = ProcurementCase & {
  rfq?: RFQ | null;
  quotations?: Quotation[];
  abstract?: AbstractOfQuotations | null;
  bacResolution?: BACResolution | null;
  award?: Award | null;
  contract?: Contract | null;
  ntp?: NoticeToProceed | null;
  deliveries?: Delivery[];
  inspection?: InspectionReport | null;
  acceptance?: Acceptance | null;
  ors?: ORS | null;
  dv?: DV | null;
  check?: Check | null;
};

export function useEditDeleteAccess({
  role,
  action,
  caseData,
}: {
  role: Role;
  action: Action;
  caseData: CaseWithRelations;
}) {
  return useMemo(() => {
    const basicEdit = canPerform(role, action, 'edit');
    const basicDelete = canPerform(role, action, 'delete');
    const adminOverride = canPerform(role, action, 'admin_override');

    let locked = false;
    let lockedReason: string | undefined;

    // Check downstream data to determine if locked
    // This mirrors hasDownstreamData logic but on client
    switch (action) {
      case 'ors':
        if (caseData.dv) {
          locked = true;
          lockedReason = 'DV already created';
        }
        break;
      case 'dv':
        if (caseData.check) {
          locked = true;
          lockedReason = 'Check already created';
        }
        break;
      case 'check':
        if (caseData.currentState === 'CLOSED') {
          locked = true;
          lockedReason = 'Case is Closed';
        }
        break;
      case 'rfq':
        if (caseData.quotations && caseData.quotations.length > 0) {
          locked = true;
          lockedReason = 'Quotations already collected';
        }
        break;
      case 'quotation':
        if (caseData.abstract) {
          locked = true;
          lockedReason = 'Abstract of Quotations already created';
        }
        break;
      // Add other cases as needed
    }

    // If locked, only admin can edit/delete (override)
    // If not locked, standard permissions apply
    
    const canEdit = locked ? adminOverride : basicEdit;
    const canDelete = locked ? adminOverride : basicDelete;

    return {
      canEdit,
      canDelete,
      isLocked: locked,
      lockedReason,
      requiresOverride: locked && adminOverride,
    };
  }, [role, action, caseData]);
}


