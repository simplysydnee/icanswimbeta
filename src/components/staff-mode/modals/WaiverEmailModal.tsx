'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Loader2 } from 'lucide-react'

interface WaiverEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  swimmerId: string
  swimmerName: string
  defaultEmail: string
  onSuccess: (email: string) => void
}

export default function WaiverEmailModal({
  open,
  onOpenChange,
  swimmerId,
  swimmerName,
  defaultEmail,
  onSuccess
}: WaiverEmailModalProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  // Sync email state when modal opens
  useEffect(() => {
    console.log('WaiverEmailModal useEffect: open=', open, 'defaultEmail=', defaultEmail)
    if (open) {
      console.log('Setting email to:', defaultEmail)
      setEmail(defaultEmail)
    }
  }, [open, defaultEmail])

  const handleSend = async () => {
    const emailRegex = /\S+@\S+\.\S+/
    if (!email || !emailRegex.test(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/staff/waivers/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swimmerId,
          email
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send waiver email')
      }

      onOpenChange(false)
      onSuccess(email)
    } catch (error) {
      console.error('Error sending waiver email:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send waiver email',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  console.log('WaiverEmailModal render: email=', email, 'defaultEmail=', defaultEmail, 'open=', open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Send Waiver Completion Email
          </DialogTitle>
          <DialogDescription>
            Send an email to the parent with a link to complete the required waivers for {swimmerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Parent Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email can be edited if the one on file is incorrect
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-900">
              <strong>What happens next:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Parent receives email with waiver completion link</li>
                <li>Link expires in 7 days</li>
                <li>Parent completes all required waivers online</li>
                <li>Status automatically updates when complete</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !email}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}