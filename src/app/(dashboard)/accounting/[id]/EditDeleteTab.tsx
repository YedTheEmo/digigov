"use client";

import { EntityEditDelete } from '@/components/app/EntityEditDelete';
import { useEditDeleteAccess } from '@/hooks/useEditDeleteAccess';
import type { Role } from '@/lib/permissions';
import type { ProcurementCase, DV } from '@/generated/prisma';

type AccountingEditDeleteProps = {
  caseData: ProcurementCase & {
    dv?: DV | null;
    check?: { id: string } | null;
  };
  userRole: Role;
};

export function EditDeleteTab({ caseData, userRole }: AccountingEditDeleteProps) {
  // Get permissions for DV
  const dvAccess = useEditDeleteAccess({ role: userRole, action: 'dv', caseData });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Accounting Management - Edit & Delete
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Manage the Disbursement Voucher (DV) for this case. 
          All modifications are logged in the activity timeline. 
          <strong className="block mt-2">Warning:</strong> Editing or deleting the DV will affect downstream cashier processes (Check and Check Advice). 
          Only admins can override locks when Check has been created.
        </p>
      </div>

      {/* DV (Disbursement Voucher) */}
      <EntityEditDelete
        entityName="dv"
        entityDisplayName="Disbursement Voucher (DV)"
        exists={!!caseData.dv}
        currentData={caseData.dv ? {
          dvNumber: caseData.dv.dvNumber,
          preparedAt: caseData.dv.preparedAt,
          approvedAt: caseData.dv.approvedAt,
          approvedBy: caseData.dv.approvedBy,
        } : {}}
        fields={[
          { name: 'dvNumber', label: 'DV Number', type: 'text', placeholder: 'DV-2024-001' },
          { name: 'preparedAt', label: 'Prepared At', type: 'datetime-local' },
          { name: 'approvedAt', label: 'Approved At', type: 'datetime-local' },
          { name: 'approvedBy', label: 'Approved By', type: 'text', placeholder: 'Approver name' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={dvAccess.canEdit}
        canDelete={dvAccess.canDelete}
        isLocked={dvAccess.isLocked}
        lockedReason={dvAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/dv`}
        deleteWarning="CRITICAL: Deleting the DV will affect the Check and Check Advice. This may require reprocessing of cashier documents and payment processing."
      />
    </div>
  );
}

