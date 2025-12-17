'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface POSWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warnings: string[];
  sessionsRequested: number;
  sessionsAvailable: number;
}

export function POSWarningDialog({
  open,
  onClose,
  onConfirm,
  warnings,
  sessionsRequested,
  sessionsAvailable
}: POSWarningDialogProps) {
  const overflow = sessionsRequested - sessionsAvailable;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Booking Exceeds Authorization
          </DialogTitle>
          <DialogDescription>
            You&apos;re booking {sessionsRequested} sessions but only {sessionsAvailable} are currently authorized.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {warnings.map((warning, i) => (
            <p key={i} className="text-sm text-muted-foreground">
              {warning}
            </p>
          ))}

          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-4">
            <p className="text-sm font-medium text-orange-800">
              What happens next:
            </p>
            <ul className="text-sm text-orange-700 mt-2 space-y-1 list-disc list-inside">
              <li>Sessions 1-{sessionsAvailable} will be confirmed immediately</li>
              <li>Sessions {sessionsAvailable + 1}-{sessionsRequested} will be pending coordinator approval</li>
              <li>If approval is declined, overflow sessions will be automatically cancelled</li>
              <li>You&apos;ll be notified of any changes</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Book Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}