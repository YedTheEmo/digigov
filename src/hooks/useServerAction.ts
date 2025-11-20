'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';

export function useServerAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options?: { successMessage?: string; errorMessage?: string },
) {
  const [isPending, startTransition] = useTransition();

  const execute = async (...args: Parameters<T>) => {
    startTransition(async () => {
      try {
        const result = await action(...args);
        if (result?.success === false && result?.error) {
          toast.error(String(result.error));
          return;
        }
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
      } catch (error) {
        const msg =
          options?.errorMessage || (error as Error)?.message || 'Unexpected error occurred';
        toast.error(msg);
      }
    });
  };

  return { execute, isPending };
}


