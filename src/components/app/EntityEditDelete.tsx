"use client";

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    } catch (error) {
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
    } catch (error) {
      toast.error(`Failed to delete ${entityDisplayName}`);
    }
  };

  const content = (
    <div className="space-y-4">
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
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Values:</div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 space-y-1">
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
                  <span className="font-medium text-gray-600 dark:text-gray-400">{field.label}:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{displayValue}</span>
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
              variant="primary"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              disabled={isPending}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isPending}
            >
              Delete
            </Button>
          )}
          {!canEdit && !canDelete && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No edit/delete permissions
            </div>
          )}
        </div>
      )}

      {!exists && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          This entity has not been created yet.
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <form action={(formData) => handleEdit(formData)}>
          <ModalHeader>Edit {entityDisplayName}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
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
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <ModalHeader>Delete {entityDisplayName}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {deleteWarning && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Breaking Change Warning:</strong> {deleteWarning}
                </p>
              </div>
            )}
            {isLocked && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> {lockedReason || 'This entity is locked due to downstream data.'}
                  {' '}Only admins can delete locked entities.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this {entityDisplayName}? This action will be logged in the activity history.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for Deletion <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
            variant="danger"
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
      <Card>
        <CardHeader>
          <CardTitle>{entityDisplayName}</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

