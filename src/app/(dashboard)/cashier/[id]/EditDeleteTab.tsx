"use client";

import { EntityEditDelete } from '@/components/app/EntityEditDelete';
import { useEditDeleteAccess } from '@/hooks/useEditDeleteAccess';
import type { Role } from '@/lib/permissions';
import type { ProcurementCase, Check, CheckAdvice } from '@/generated/prisma';

type CashierEditDeleteProps = {
  caseData: ProcurementCase & {
    check?: Check | null;
    checkAdvice?: CheckAdvice | null;
  };
  userRole: Role;
};

export function EditDeleteTab({ caseData, userRole }: CashierEditDeleteProps) {
  // Get permissions for Check and CheckAdvice
  const checkAccess = useEditDeleteAccess({ role: userRole, action: 'check', caseData });
  const checkAdviceAccess = useEditDeleteAccess({ role: userRole, action: 'check_advice', caseData });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Cashier Management - Edit & Delete
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Manage Check and Check Advice documents for this case. 
          All modifications are logged in the activity timeline. 
          <strong className="block mt-2">Warning:</strong> Deleting the Check or Check Advice may affect case closure. 
          Check Advice is typically the final document before closing a case.
        </p>
      </div>

      {/* Check */}
      <EntityEditDelete
        entityName="check"
        entityDisplayName="Check"
        exists={!!caseData.check}
        currentData={caseData.check ? {
          checkNumber: caseData.check.checkNumber,
          preparedAt: caseData.check.preparedAt,
          approvedAt: caseData.check.approvedAt,
          approvedBy: caseData.check.approvedBy,
        } : {}}
        fields={[
          { name: 'checkNumber', label: 'Check Number', type: 'text', placeholder: 'CHK-2024-001' },
          { name: 'preparedAt', label: 'Prepared At', type: 'datetime-local' },
          { name: 'approvedAt', label: 'Approved At', type: 'datetime-local' },
          { name: 'approvedBy', label: 'Approved By', type: 'text', placeholder: 'Approver name' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={checkAccess.canEdit}
        canDelete={checkAccess.canDelete}
        isLocked={checkAccess.isLocked}
        lockedReason={checkAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/check`}
        deleteWarning="CRITICAL: Deleting the Check will affect Check Advice and may prevent case closure. This is a significant financial document."
      />

      {/* Check Advice */}
      <EntityEditDelete
        entityName="check-advice"
        entityDisplayName="Check Advice"
        exists={!!caseData.checkAdvice}
        currentData={caseData.checkAdvice ? {
          adviceNumber: caseData.checkAdvice.adviceNumber,
          approvedAt: caseData.checkAdvice.approvedAt,
        } : {}}
        fields={[
          { name: 'adviceNumber', label: 'Advice Number', type: 'text', placeholder: 'CA-2024-001' },
          { name: 'approvedAt', label: 'Approved At', type: 'datetime-local' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={checkAdviceAccess.canEdit}
        canDelete={checkAdviceAccess.canDelete}
        isLocked={checkAdviceAccess.isLocked}
        lockedReason={checkAdviceAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/check-advice`}
        deleteWarning="CRITICAL: Deleting the Check Advice may prevent case closure. This is the final step in the procurement lifecycle."
      />
    </div>
  );
}

