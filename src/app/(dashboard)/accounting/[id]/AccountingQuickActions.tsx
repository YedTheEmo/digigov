"use client";

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { useEditDeleteAccess } from '@/hooks/useEditDeleteAccess';
import type { Role } from '@/lib/permissions';
import type { ProcurementCase, Check } from '@/generated/prisma';

type AccountingQuickActionsProps = {
  caseData: ProcurementCase & {
    dv?: { dvNumber: string | null; approvedBy: string | null } | null;
    ors?: { orsNumber: string | null } | null;
    check?: Check | null; // Needed for lock check
  };
  submitDV: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  userRole: Role;
};

export function AccountingQuickActions({
  caseData,
  submitDV,
  userRole,
}: AccountingQuickActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const access = useEditDeleteAccess({ role: userRole, action: 'dv', caseData: caseData as any });

  const handleSubmitDV = async (formData: FormData) => {
    startTransition(async () => {
      const res = await submitDV(formData);
      if (res?.success === false && res?.error) {
        toast.error(String(res.error));
      } else {
        toast.success('DV submitted successfully.');
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      dvNumber: formData.get('dvNumber'),
      approvedBy: formData.get('approvedBy'),
      reason: formData.get('reason'),
    };

    try {
      const res = await fetch(`/api/cases/${caseData.id}/dv`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      toast.success('DV updated successfully');
      setIsEditOpen(false);
      setReason('');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!reason) return toast.error('Reason is required');
    
    try {
      const res = await fetch(`/api/cases/${caseData.id}/dv`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }

      toast.success('DV deleted successfully');
      setIsDeleteOpen(false);
      setReason('');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Initial Submission Form */}
      {!caseData.dv && caseData.currentState === 'ORS' && (
        <form action={handleSubmitDV} className="flex items-center gap-2 flex-wrap p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Input
            name="dvNumber"
            label="DV Number"
            placeholder="e.g. DV-2025-001"
            className="w-auto min-w-[200px]"
            required
          />
          <Input
            name="approvedBy"
            label="Approved By"
            placeholder="Name of approver"
            className="w-auto min-w-[200px]"
          />
          <Button type="submit" variant="primary" size="sm" disabled={isPending}>
            {isPending ? 'Submit DV' : 'Submit DV'}
          </Button>
        </form>
      )}

      {/* Existing DV Actions */}
      {caseData.dv && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">DV Prepared</h4>
            <p className="text-xs text-gray-500 mt-1">
              {caseData.dv.dvNumber ? `Number: ${caseData.dv.dvNumber}` : 'No number assigned'} 
              {caseData.dv.approvedBy ? ` • Approved by: ${caseData.dv.approvedBy}` : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {access.canEdit ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                Edit
              </Button>
            ) : (
              access.isLocked && (
                <span className="text-xs text-gray-400 italic px-2" title={access.lockedReason}>
                  Locked ({access.lockedReason})
                </span>
              )
            )}

            {access.canDelete && (
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} size="md">
        <ModalHeader onClose={() => setIsEditOpen(false)}>Edit DV</ModalHeader>
        <form onSubmit={handleEditSubmit}>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Input
                name="dvNumber"
                label="DV Number"
                defaultValue={caseData.dv?.dvNumber || ''}
                required
              />
              <Input
                name="approvedBy"
                label="Approved By"
                defaultValue={caseData.dv?.approvedBy || ''}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason for Change <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  required
                  className="w-full min-h-[80px] p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  placeholder="Why is this change being made?"
                />
                {access.requiresOverride && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Admin Override: Downstream data exists. Your action will be flagged.
                  </p>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} size="md">
        <ModalHeader onClose={() => setIsDeleteOpen(false)}>Delete DV</ModalHeader>
        <ModalBody className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md text-red-800 dark:text-red-200 text-sm">
            <p className="font-semibold">Warning: This action is destructive.</p>
            <p className="mt-1">
              Deleting the DV will roll back the case status to <strong>ORS</strong>.
              {access.requiresOverride && (
                 <span className="block mt-2 font-bold">
                   ⚠️ Downstream data exists (Check). Deleting this will CASCADE DELETE all subsequent records!
                 </span>
              )}
            </p>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason for Deletion <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full min-h-[80px] p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              placeholder="Why is this record being deleted?"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteSubmit}
            disabled={!reason}
          >
            Delete DV
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
