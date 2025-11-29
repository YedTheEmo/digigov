"use client";

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type EntityEditDeleteProps = {
  entityName: string;
  entityDisplayName: string;
  exists: boolean;
  currentData?: Record<string, unknown>;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'date' | 'datetime-local' | 'number' | 'textarea';
    required?: boolean;
    placeholder?: string;
  }[];
  canEdit: boolean;
  canDelete: boolean;
  isLocked: boolean;
  lockedReason?: string;
  caseId: string;
  apiEndpoint: string;
  onSuccess?: () => void;
  deleteWarning?: string;
  showInCard?: boolean;
};

export function EntityEditDelete({
  entityName,
  entityDisplayName,
  exists,
  currentData = {},
  fields,
  canEdit,
  canDelete,
  isLocked,
  lockedReason,
  caseId,
  apiEndpoint,
  onSuccess,
  deleteWarning,
  showInCard = true,
}: EntityEditDeleteProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleEdit = async (formData: FormData) => {
    const data: Record<string, unknown> = {};
    fields.forEach(field => {
      const value = formData.get(field.name);
      if (value !== null) {
        data[field.name] = String(value);
      }
    });

    try {
      const res = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.error || `Failed to update ${entityDisplayName}`;
        toast.error(message);
        return;
      }

      toast.success(`${entityDisplayName} updated successfully. Changes logged.`);
      setIsEditOpen(false);
      startTransition(() => {
        router.refresh();
        onSuccess?.();
      });
    } catch {
      toast.error(`Failed to update ${entityDisplayName}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }

    try {
      const res = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: deleteReason }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.error || `Failed to delete ${entityDisplayName}`;
        toast.error(message);
        return;
      }

      toast.success(`${entityDisplayName} deleted successfully. Deletion logged.`);
      setIsDeleteOpen(false);
      setDeleteReason('');
      startTransition(() => {
        router.refresh();
        onSuccess?.();
      });
    } catch {
      toast.error(`Failed to delete ${entityDisplayName}`);
    }
  };

  const content = (
    <div
      className="space-y-4"
      data-entity={entityName}
      data-case-id={caseId}
    >
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={exists ? 'info' : 'pending'}>
          {exists ? 'Created' : 'Not Created'}
        </Badge>
        {isLocked && (
          <Badge variant="warning">
            Locked{lockedReason ? `: ${lockedReason}` : ''}
          </Badge>
        )}
      </div>

      {/* Current Data Display */}
      {exists && currentData && Object.keys(currentData).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-[var(--color-text-primary)]">Current Values:</div>
          <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 space-y-1 border border-[var(--color-border-secondary)]">
            {fields.map(field => {
              const value = currentData[field.name];
              if (value === null || value === undefined) return null;
              
              let displayValue = String(value);
              if (field.type === 'date' || field.type === 'datetime-local') {
                try {
                  displayValue = new Date(displayValue).toLocaleString();
                } catch {
                  // Keep as is
                }
              }

              return (
                <div key={field.name} className="text-sm">
                  <span className="font-medium text-[var(--color-text-secondary)]">{field.label}:</span>{' '}
                  <span className="text-[var(--color-text-primary)]">{displayValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {exists && (
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              disabled={isPending}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isPending}
            >
              Delete
            </Button>
          )}
          {!canEdit && !canDelete && (
            <div className="text-sm text-[var(--color-text-tertiary)]">
              No edit/delete permissions
            </div>
          )}
        </div>
      )}

      {!exists && (
        <div className="text-sm text-[var(--color-text-tertiary)]">
          This entity has not been created yet.
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <form action={(formData) => handleEdit(formData)}>
          <ModalHeader>Edit {entityDisplayName}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {field.label}
                    {field.required && <span className="text-[var(--color-danger)] ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                      defaultValue={currentData[field.name] as string || ''}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      name={field.name}
                      defaultValue={currentData[field.name] as string || ''}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              {isLocked && (
                <div className="bg-[var(--color-warning-light)] border border-[var(--color-warning)] rounded-lg p-3">
                  <p className="text-sm text-[var(--color-text-primary)]">
                    <strong>Warning:</strong> {lockedReason || 'This entity is locked due to downstream data.'}
                    {' '}Only admins can edit locked entities.
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <ModalHeader>Delete {entityDisplayName}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {deleteWarning && (
              <div className="bg-[var(--color-danger-light)] border border-[var(--color-danger)] rounded-lg p-3">
                <p className="text-sm text-[var(--color-text-primary)]">
                  <strong>Breaking Change Warning:</strong> {deleteWarning}
                </p>
              </div>
            )}
            {isLocked && (
              <div className="bg-[var(--color-warning-light)] border border-[var(--color-warning)] rounded-lg p-3">
                <p className="text-sm text-[var(--color-text-primary)]">
                  <strong>Warning:</strong> {lockedReason || 'This entity is locked due to downstream data.'}
                  {' '}Only admins can delete locked entities.
                </p>
              </div>
            )}
            <p className="text-sm text-[var(--color-text-secondary)]">
              Are you sure you want to delete this {entityDisplayName}? This action will be logged in the activity history.
            </p>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Reason for Deletion <span className="text-[var(--color-danger)]">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explain why this entity is being deleted..."
                rows={3}
                required
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || !deleteReason.trim()}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );

  if (showInCard) {
    return (
      <Card className="border-[var(--color-border-primary)] shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-[var(--color-text-primary)]">{entityDisplayName}</CardTitle>
          <CardDescription>Manage {entityDisplayName.toLowerCase()} data</CardDescription>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

