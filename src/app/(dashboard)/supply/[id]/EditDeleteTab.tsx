"use client";

import { EntityEditDelete } from '@/components/app/EntityEditDelete';
import { useEditDeleteAccess } from '@/hooks/useEditDeleteAccess';
import type { Role } from '@/lib/permissions';
import type { ProcurementCase, Delivery, InspectionReport, Acceptance } from '@/generated/prisma';

type SupplyEditDeleteProps = {
  caseData: ProcurementCase & {
    deliveries?: Delivery[];
    inspection?: InspectionReport | null;
    acceptance?: Acceptance | null;
  };
  userRole: Role;
};

export function EditDeleteTab({ caseData, userRole }: SupplyEditDeleteProps) {
  // Get permissions for each entity
  const deliveryAccess = useEditDeleteAccess({ role: userRole, action: 'delivery', caseData });
  const inspectionAccess = useEditDeleteAccess({ role: userRole, action: 'inspection', caseData });
  const acceptanceAccess = useEditDeleteAccess({ role: userRole, action: 'acceptance', caseData });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Supply Management - Edit & Delete
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Manage all supply-related entities for this case including deliveries, inspections, and acceptance records. 
          All modifications are logged in the activity timeline. 
          <strong className="block mt-2">Warning:</strong> Deleting entities may affect downstream budget and accounting processes. 
          Only admins can override locks when downstream data exists.
        </p>
      </div>

      {/* Deliveries Section */}
      {caseData.deliveries && caseData.deliveries.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Deliveries</h3>
          {caseData.deliveries.map((delivery, index) => (
            <EntityEditDelete
              key={delivery.id}
              entityName="delivery"
              entityDisplayName={`Delivery ${index + 1}`}
              exists={true}
              currentData={{
                deliveredAt: delivery.deliveredAt,
                notes: delivery.notes,
              }}
              fields={[
                { name: 'deliveredAt', label: 'Delivered At', type: 'datetime-local' },
                { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Delivery details...' },
                { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
              ]}
              canEdit={deliveryAccess.canEdit}
              canDelete={deliveryAccess.canDelete}
              isLocked={deliveryAccess.isLocked}
              lockedReason={deliveryAccess.lockedReason}
              caseId={caseData.id}
              apiEndpoint={`/api/cases/${caseData.id}/deliveries/${delivery.id}`}
              deleteWarning="Deleting this delivery may affect inspection and acceptance records."
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">No deliveries recorded yet for this case.</p>
        </div>
      )}

      {/* Inspection Report */}
      <EntityEditDelete
        entityName="inspection"
        entityDisplayName="Inspection Report"
        exists={!!caseData.inspection}
        currentData={caseData.inspection ? {
          status: caseData.inspection.status,
          inspector: caseData.inspection.inspector,
          inspectedAt: caseData.inspection.inspectedAt,
          notes: caseData.inspection.notes,
        } : {}}
        fields={[
          { name: 'status', label: 'Status', type: 'text', placeholder: 'PASSED or FAILED' },
          { name: 'inspector', label: 'Inspector', type: 'text', placeholder: 'Inspector name' },
          { name: 'inspectedAt', label: 'Inspected At', type: 'datetime-local' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Inspection findings...' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={inspectionAccess.canEdit}
        canDelete={inspectionAccess.canDelete}
        isLocked={inspectionAccess.isLocked}
        lockedReason={inspectionAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/inspection`}
        deleteWarning="Deleting the Inspection Report will affect acceptance and budget processes (ORS)."
      />

      {/* Acceptance */}
      <EntityEditDelete
        entityName="acceptance"
        entityDisplayName="Acceptance"
        exists={!!caseData.acceptance}
        currentData={caseData.acceptance ? {
          acceptedAt: caseData.acceptance.acceptedAt,
          officer: caseData.acceptance.officer,
        } : {}}
        fields={[
          { name: 'acceptedAt', label: 'Accepted At', type: 'datetime-local' },
          { name: 'officer', label: 'Accepting Officer', type: 'text', placeholder: 'Officer name' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={acceptanceAccess.canEdit}
        canDelete={acceptanceAccess.canDelete}
        isLocked={acceptanceAccess.isLocked}
        lockedReason={acceptanceAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/acceptance`}
        deleteWarning="Deleting Acceptance will affect ORS, DV, Check, and entire financial process. This is a critical action."
      />
    </div>
  );
}

