'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toast as ToastType } from '@/hooks/use-toast';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss, className, ...props }: ToastProps) {
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg',
        toast.variant === 'destructive' && 'border-destructive bg-destructive/10',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold">{toast.title}</h4>
          {toast.description && (
            <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="ml-4 rounded-md p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}