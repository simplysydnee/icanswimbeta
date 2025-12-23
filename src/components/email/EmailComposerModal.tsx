'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName: string;
  recipientType: 'coordinator' | 'parent';
  swimmerName: string;
}

export function EmailComposerModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  recipientType,
  swimmerName
}: EmailComposerModalProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [subject, setSubject] = useState(`Re: ${swimmerName} - I Can Swim`);
  const [body, setBody] = useState(
    `Hi ${recipientName},\n\nRegarding ${swimmerName}...\n\nBest regards,\nI Can Swim Team`
  );

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both subject and message.',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          toName: recipientName,
          subject,
          body
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      toast({
        title: 'Email sent!',
        description: `Your email to ${recipientName} has been sent.`
      });
      onClose();
    } catch (error) {
      console.error('Email send error:', error);
      toast({
        title: 'Failed to send email',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Reset form when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Email {recipientType === 'coordinator' ? 'Coordinator' : 'Parent'}
          </DialogTitle>
          <DialogDescription>
            Send an email to {recipientName} regarding {swimmerName}.
            Email will be sent from info@icanswim209.com
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email-to">To</Label>
            <Input
              id="email-to"
              name="emailTo"
              value={`${recipientName} <${recipientEmail}>`}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              name="emailSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea
              id="email-body"
              name="emailBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={10}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}