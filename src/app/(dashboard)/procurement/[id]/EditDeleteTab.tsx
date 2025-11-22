"use client";

import { EntityEditDelete } from '@/components/app/EntityEditDelete';
import { useEditDeleteAccess } from '@/hooks/useEditDeleteAccess';
import type { Role } from '@/lib/permissions';
import type { ProcurementCase, RFQ, Award, PurchaseOrder, Contract, NoticeToProceed, Quotation, AbstractOfQuotations, BACResolution, BidBulletin, PreBidConference, TWGEvaluation, PostQualification, ProgressBilling, PMTInspectionReport } from '@/generated/prisma';

type ProcurementEditDeleteProps = {
  caseData: ProcurementCase & {
    rfq?: RFQ | null;
    quotations?: Quotation[];
    abstract?: AbstractOfQuotations | null;
    bacResolution?: BACResolution | null;
    award?: Award | null;
    purchaseOrder?: PurchaseOrder | null;
    contract?: Contract | null;
    ntp?: NoticeToProceed | null;
    bidBulletins?: BidBulletin[];
    preBid?: PreBidConference | null;
    twgEvaluation?: TWGEvaluation | null;
    postQualification?: PostQualification | null;
    progressBilling?: ProgressBilling | null;
    pmtInspection?: PMTInspectionReport | null;
  };
  userRole: Role;
};

export function EditDeleteTab({ caseData, userRole }: ProcurementEditDeleteProps) {
  const isRFQ = caseData.method === 'SMALL_VALUE_RFQ';
  const isPB = caseData.method === 'PUBLIC_BIDDING';
  const isInfra = caseData.method === 'INFRASTRUCTURE';

  // Get permissions for each entity
  const rfqAccess = useEditDeleteAccess({ role: userRole, action: 'rfq', caseData });
  const abstractAccess = useEditDeleteAccess({ role: userRole, action: 'abstract', caseData });
  const bacAccess = useEditDeleteAccess({ role: userRole, action: 'bac_resolution', caseData });
  const awardAccess = useEditDeleteAccess({ role: userRole, action: 'award', caseData });
  const purchaseOrderAccess = useEditDeleteAccess({ role: userRole, action: 'purchase_order', caseData });
  const contractAccess = useEditDeleteAccess({ role: userRole, action: 'contract', caseData });
  const ntpAccess = useEditDeleteAccess({ role: userRole, action: 'ntp', caseData });
  const quotationAccess = useEditDeleteAccess({ role: userRole, action: 'quotation', caseData });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Edit & Delete Management
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          This tab provides centralized access to edit or delete all stages and entities of this procurement case. 
          All modifications are logged in the activity timeline. 
          <strong className="block mt-2">Warning:</strong> Deleting entities may cause downstream data to be affected. 
          Only admins can override locks when downstream data exists.
        </p>
      </div>

      {/* RFQ Section - For SMALL_VALUE_RFQ */}
      {isRFQ && (
        <EntityEditDelete
          entityName="rfq"
          entityDisplayName="Request for Quotation (RFQ)"
          exists={!!caseData.rfq}
          currentData={caseData.rfq ? {
            rfqNumber: caseData.rfq.rfqNumber,
            issuedAt: caseData.rfq.issuedAt,
          } : {}}
          fields={[
            { name: 'rfqNumber', label: 'RFQ Number', type: 'text', placeholder: 'RFQ-2024-001' },
            { name: 'issuedAt', label: 'Issued At', type: 'datetime-local' },
            { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
          ]}
          canEdit={rfqAccess.canEdit}
          canDelete={rfqAccess.canDelete}
          isLocked={rfqAccess.isLocked}
          lockedReason={rfqAccess.lockedReason}
          caseId={caseData.id}
          apiEndpoint={`/api/cases/${caseData.id}/rfq`}
          deleteWarning="Deleting the RFQ will roll back the case state and may affect quotations."
        />
      )}

      {/* Quotations Section */}
      {isRFQ && caseData.quotations && caseData.quotations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quotations</h3>
          {caseData.quotations.map((quotation) => (
            <EntityEditDelete
              key={quotation.id}
              entityName="quotation"
              entityDisplayName={`Quotation from ${quotation.supplierName}`}
              exists={true}
              currentData={{
                supplierName: quotation.supplierName,
                amount: quotation.amount.toString(),
                isResponsive: quotation.isResponsive ? 'true' : 'false',
                submittedAt: quotation.submittedAt,
              }}
              fields={[
                { name: 'supplierName', label: 'Supplier Name', type: 'text', required: true },
                { name: 'amount', label: 'Amount', type: 'number', required: true },
                { name: 'isResponsive', label: 'Is Responsive', type: 'text', placeholder: 'true or false' },
                { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
              ]}
              canEdit={quotationAccess.canEdit}
              canDelete={quotationAccess.canDelete}
              isLocked={quotationAccess.isLocked}
              lockedReason={quotationAccess.lockedReason}
              caseId={caseData.id}
              apiEndpoint={`/api/cases/${caseData.id}/quotations/${quotation.id}`}
              deleteWarning="Deleting this quotation may affect the Abstract of Quotations."
            />
          ))}
        </div>
      )}

      {/* Abstract of Quotations */}
      {isRFQ && (
        <EntityEditDelete
          entityName="abstract"
          entityDisplayName="Abstract of Quotations"
          exists={!!caseData.abstract}
          currentData={caseData.abstract ? {
            notes: caseData.abstract.notes,
            createdAt: caseData.abstract.createdAt,
          } : {}}
          fields={[
            { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
            { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
          ]}
          canEdit={abstractAccess.canEdit}
          canDelete={abstractAccess.canDelete}
          isLocked={abstractAccess.isLocked}
          lockedReason={abstractAccess.lockedReason}
          caseId={caseData.id}
          apiEndpoint={`/api/cases/${caseData.id}/abstract`}
          deleteWarning="Deleting the Abstract will affect the BAC Resolution process."
        />
      )}

      {/* Bid Bulletins - For PUBLIC_BIDDING */}
      {(isPB || isInfra) && caseData.bidBulletins && caseData.bidBulletins.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bid Bulletins</h3>
          {caseData.bidBulletins.map((bulletin) => (
            <EntityEditDelete
              key={bulletin.id}
              entityName="bid-bulletin"
              entityDisplayName={`Bid Bulletin ${bulletin.number || 'Unnumbered'}`}
              exists={true}
              currentData={{
                number: bulletin.number?.toString(),
                publishedAt: bulletin.publishedAt,
                notes: bulletin.notes,
              }}
              fields={[
                { name: 'number', label: 'Bulletin Number', type: 'number' },
                { name: 'publishedAt', label: 'Published At', type: 'datetime-local' },
                { name: 'notes', label: 'Notes', type: 'textarea' },
                { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
              ]}
              canEdit={true}
              canDelete={true}
              isLocked={false}
              caseId={caseData.id}
              apiEndpoint={`/api/cases/${caseData.id}/bid-bulletins/${bulletin.id}`}
              deleteWarning="Deleting this bid bulletin may affect bidder awareness."
            />
          ))}
        </div>
      )}

      {/* Pre-Bid Conference - For PUBLIC_BIDDING */}
      {(isPB || isInfra) && (
        <EntityEditDelete
          entityName="pre-bid"
          entityDisplayName="Pre-Bid Conference"
          exists={!!caseData.preBid}
          currentData={caseData.preBid ? {
            scheduledAt: caseData.preBid.scheduledAt,
            minutesUrl: caseData.preBid.minutesUrl,
            notes: caseData.preBid.notes,
          } : {}}
          fields={[
            { name: 'scheduledAt', label: 'Scheduled At', type: 'datetime-local' },
            { name: 'minutesUrl', label: 'Minutes URL', type: 'text', placeholder: 'https://...' },
            { name: 'notes', label: 'Notes', type: 'textarea' },
            { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
          ]}
          canEdit={true}
          canDelete={true}
          isLocked={false}
          caseId={caseData.id}
          apiEndpoint={`/api/cases/${caseData.id}/pre-bid`}
          deleteWarning="Deleting the Pre-Bid Conference record may affect bidding transparency."
        />
      )}

      {/* TWG Evaluation - For PUBLIC_BIDDING */}
      {(isPB || isInfra) && (
        <EntityEditDelete
          entityName="twg-evaluation"
          entityDisplayName="TWG Evaluation"
          exists={!!caseData.twgEvaluation}
          currentData={caseData.twgEvaluation ? {
            result: caseData.twgEvaluation.result,
            notes: caseData.twgEvaluation.notes,
            evaluatedAt: caseData.twgEvaluation.evaluatedAt,
          } : {}}
          fields={[
            { name: 'result', label: 'Result', type: 'text' },
            { name: 'notes', label: 'Notes', type: 'textarea' },
            { name: 'evaluatedAt', label: 'Evaluated At', type: 'datetime-local' },
            { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
          ]}
          canEdit={true}
          canDelete={true}
          isLocked={false}
          caseId={caseData.id}
          apiEndpoint={`/api/cases/${caseData.id}/twg-evaluation`}
          deleteWarning="Deleting the TWG Evaluation will affect the procurement decision process."
        />
      )}

      {/* Post-Qualification - For PUBLIC_BIDDING */}
      {(isPB || isInfra) && (
        <EntityEditDelete
          entityName="post-qualification"
          entityDisplayName="Post-Qualification"
          exists={!!caseData.postQualification}
          currentData={caseData.postQualification ? {
            lowestResponsiveBidder: caseData.postQualification.lowestResponsiveBidder,
            passed: caseData.postQualification.passed ? 'true' : 'false',
            notes: caseData.postQualification.notes,
            completedAt: caseData.postQualification.completedAt,
          } : {}}
          fields={[
            { name: 'lowestResponsiveBidder', label: 'Lowest Responsive Bidder', type: 'text' },
            { name: 'passed', label: 'Passed', type: 'text', placeholder: 'true or false' },
            { name: 'notes', label: 'Notes', type: 'textarea' },
            { name: 'completedAt', label: 'Completed At', type: 'datetime-local' },
            { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
          ]}
          canEdit={true}
          canDelete={true}
          isLocked={false}
          caseId={caseData.id}
          apiEndpoint={`/api/cases/${caseData.id}/post-qualification`}
          deleteWarning="Deleting Post-Qualification will affect the award process."
        />
      )}

      {/* BAC Resolution */}
      <EntityEditDelete
        entityName="bac-resolution"
        entityDisplayName="BAC Resolution"
        exists={!!caseData.bacResolution}
        currentData={caseData.bacResolution ? {
          notes: caseData.bacResolution.notes,
          createdAt: caseData.bacResolution.createdAt,
        } : {}}
        fields={[
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Resolution details...' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={bacAccess.canEdit}
        canDelete={bacAccess.canDelete}
        isLocked={bacAccess.isLocked}
        lockedReason={bacAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/bac-resolution`}
        deleteWarning="Deleting the BAC Resolution will affect the Award and subsequent processes."
      />

      {/* Award */}
      <EntityEditDelete
        entityName="award"
        entityDisplayName="Award"
        exists={!!caseData.award}
        currentData={caseData.award ? {
          noticeDate: caseData.award.noticeDate,
          awardedTo: caseData.award.awardedTo,
        } : {}}
        fields={[
          { name: 'noticeDate', label: 'Notice Date', type: 'datetime-local' },
          { name: 'awardedTo', label: 'Awarded To', type: 'text', placeholder: 'Supplier/Contractor name' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={awardAccess.canEdit}
        canDelete={awardAccess.canDelete}
        isLocked={awardAccess.isLocked}
        lockedReason={awardAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/award`}
        deleteWarning="Deleting the Award will affect Purchase Order, Contract, and all downstream processes."
      />

      {/* Purchase Order */}
      <EntityEditDelete
        entityName="purchase-order"
        entityDisplayName="Purchase Order"
        exists={!!caseData.purchaseOrder}
        currentData={caseData.purchaseOrder ? {
          poNo: caseData.purchaseOrder.poNo,
          approvedAt: caseData.purchaseOrder.approvedAt,
          approvedBy: caseData.purchaseOrder.approvedBy,
        } : {}}
        fields={[
          { name: 'poNo', label: 'PO Number', type: 'text', placeholder: 'PO-2024-001' },
          { name: 'approvedAt', label: 'Approved At', type: 'datetime-local' },
          { name: 'approvedBy', label: 'Approved By', type: 'text', placeholder: 'Approver name' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={purchaseOrderAccess.canEdit}
        canDelete={purchaseOrderAccess.canDelete}
        isLocked={purchaseOrderAccess.isLocked}
        lockedReason={purchaseOrderAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/purchase-order`}
        deleteWarning="Deleting the Purchase Order will affect Contract and downstream processes."
      />

      {/* Contract */}
      <EntityEditDelete
        entityName="contract"
        entityDisplayName="Contract"
        exists={!!caseData.contract}
        currentData={caseData.contract ? {
          contractNo: caseData.contract.contractNo,
          signedAt: caseData.contract.signedAt,
        } : {}}
        fields={[
          { name: 'contractNo', label: 'Contract Number', type: 'text', placeholder: 'CONTRACT-2024-001' },
          { name: 'signedAt', label: 'Signed At', type: 'datetime-local' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={contractAccess.canEdit}
        canDelete={contractAccess.canDelete}
        isLocked={contractAccess.isLocked}
        lockedReason={contractAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/contract`}
        deleteWarning="Deleting the Contract will affect Notice to Proceed and implementation stages."
      />

      {/* Notice to Proceed */}
      <EntityEditDelete
        entityName="ntp"
        entityDisplayName="Notice to Proceed (NTP)"
        exists={!!caseData.ntp}
        currentData={caseData.ntp ? {
          issuedAt: caseData.ntp.issuedAt,
          daysToComply: caseData.ntp.daysToComply?.toString(),
        } : {}}
        fields={[
          { name: 'issuedAt', label: 'Issued At', type: 'datetime-local' },
          { name: 'daysToComply', label: 'Days to Comply', type: 'number', placeholder: '30' },
          { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
        ]}
        canEdit={ntpAccess.canEdit}
        canDelete={ntpAccess.canDelete}
        isLocked={ntpAccess.isLocked}
        lockedReason={ntpAccess.lockedReason}
        caseId={caseData.id}
        apiEndpoint={`/api/cases/${caseData.id}/ntp`}
        deleteWarning="Deleting the NTP will affect delivery, inspection, and all supply/finance processes."
      />

      {/* Progress Billing - For INFRASTRUCTURE */}
      {isInfra && (
        <EntityEditDelete
          entityName="progress-billing"
          entityDisplayName="Progress Billing"
          exists={!!caseData.progressBilling}
          currentData={caseData.progressBilling ? {
            billingNo: caseData.progressBilling.billingNo,
            amount: caseData.progressBilling.amount?.toString(),
            billedAt: caseData.progressBilling.billedAt,
          } : {}}
          fields={[
            { name: 'billingNo', label: 'Billing Number', type: 'text', placeholder: 'BILL-2024-001' },
            { name: 'amount', label: 'Amount', type: 'number', placeholder: '100000.00' },
            { name: 'billedAt', label: 'Billed At', type: 'datetime-local' },
            { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
          ]}
          canEdit={true}
          canDelete={true}
          isLocked={false}
          caseId={caseData.id}
          apiEndpoint={`/api/cases/${caseData.id}/progress-billing`}
          deleteWarning="Deleting Progress Billing will affect payment processing."
        />
      )}

      {/* PMT Inspection - For INFRASTRUCTURE */}
      {isInfra && (
        <EntityEditDelete
          entityName="pmt-inspection"
          entityDisplayName="PMT Inspection Report"
          exists={!!caseData.pmtInspection}
          currentData={caseData.pmtInspection ? {
            status: caseData.pmtInspection.status,
            inspector: caseData.pmtInspection.inspector,
            inspectedAt: caseData.pmtInspection.inspectedAt,
          } : {}}
          fields={[
            { name: 'status', label: 'Status', type: 'text', placeholder: 'PASSED or FAILED' },
            { name: 'inspector', label: 'Inspector', type: 'text', placeholder: 'Inspector name' },
            { name: 'inspectedAt', label: 'Inspected At', type: 'datetime-local' },
            { name: 'reason', label: 'Reason for Edit', type: 'textarea', required: true },
          ]}
          canEdit={true}
          canDelete={true}
          isLocked={false}
          caseId={caseData.id}
          apiEndpoint={`/api/cases/${caseData.id}/pmt-inspection`}
          deleteWarning="Deleting PMT Inspection will affect project completion verification."
        />
      )}
    </div>
  );
}

