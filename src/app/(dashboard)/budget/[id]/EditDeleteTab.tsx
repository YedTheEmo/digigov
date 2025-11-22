"use client";

import { EntityEditDelete } from '@/components/app/EntityEditDelete';
import { useEditDeleteAccess } from '@/hooks/useEditDeleteAccess';
import type { Role } from '@/lib/permissions';
import type { ProcurementCase, ORS } from '@/generated/prisma';

type BudgetEditDeleteProps = {
  caseData: ProcurementCase & {
    ors?: ORS | null;
    dv?: { id: string } | null;
  };
  userRole: Role;
};

export function EditDeleteTab({ caseData, userRole }: BudgetEditDeleteProps) {
  // Get permissions for ORS
  const orsAccess = useEditDeleteAccess({ role: userRole, action: 'ors', caseData });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Budget Management - Edit & Delete
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Manage the Obligation Request and Status (ORS) for this case. 
          All modifications are logged in the activity timeline. 
          <strong className="block mt-2">Warning:</strong> Editing or deleting the ORS will affect downstream accounting processes (DV and Check). 
          Only admins can override locks when DV has been created.
        </p>
      </div>

      {/* ORS (Obligation Request and Status) */}
      <EntityEditDelete
        entityName="ors"
        entityDisplayName="Obligation Request and Status (ORS)"
        exists={!!caseData.ors}
        currentData={caseData.ors ? {
          orsNumber: caseData.ors.orsNumber,
          preparedAt: caseData.ors.preparedAt,
          approvedAt: caseData.ors.approvedAt,
          approvedBy: caseData.ors.approvedBy,
        } : {}}
        fields={[
          { name: 'orsNumber', label: 'ORS Number', type: 'text', placeholder: 'ORS-2024-001' },
          { name: 'preparedAt', label: 'Prepared At', type: 'datetime-local' },
          { name: 'approvedAt', label: 'Approved At', type: 'datetime-local' },
          { name: 'approvedBy', label: 'Approved By', type: 'text', placeholder: 'Approver name' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={orsAccess.canEdit}
        canDelete={orsAccess.canDelete}
        isLocked={orsAccess.isLocked}
        lockedReason={orsAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/ors`}
        deleteWarning="CRITICAL: Deleting the ORS will affect the Disbursement Voucher (DV) and Check. This may require reprocessing of accounting and cashier documents."
      />
    </div>
  );
}

