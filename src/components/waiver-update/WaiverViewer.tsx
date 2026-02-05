'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface WaiverViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onAcknowledge?: () => void;
}

/**
 * Modal to display full legal document text
 * Required for ESIGN compliance - users must be able to read before signing
 */
export function WaiverViewer({
  isOpen,
  onClose,
  title,
  content,
  onAcknowledge,
}: WaiverViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Please read the complete document before signing.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable document content */}
        <ScrollArea className="h-[60vh] border rounded-md p-6 bg-gray-50">
          <div className="prose prose-sm max-w-none">
            {content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onAcknowledge && (
            <Button
              onClick={() => {
                onAcknowledge();
                onClose();
              }}
            >
              I Have Read This Document
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}