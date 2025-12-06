'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toast } from './toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {children}
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </>
  );
}