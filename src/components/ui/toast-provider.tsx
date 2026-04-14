'use client';

import * as React from 'react';
import { ToastContextProvider, useToast } from '@/hooks/use-toast';
import { Toast } from './toast';

function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContextProvider>
      {children}
      <ToastViewport />
    </ToastContextProvider>
  );
}
