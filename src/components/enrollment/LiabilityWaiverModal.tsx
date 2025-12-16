'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LIABILITY_WAIVER_TEXT } from '@/lib/constants'
import { FileText } from 'lucide-react'

interface LiabilityWaiverModalProps {
  trigger?: React.ReactNode
}

export function LiabilityWaiverModal({ trigger }: LiabilityWaiverModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="link" className="text-[#0077B6] p-0 h-auto font-medium">
            <FileText className="h-4 w-4 mr-1" />
            View Liability Waiver
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0077B6]">
            Liability Waiver and Release
          </DialogTitle>
          <DialogDescription>
            Please read the complete liability waiver below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {LIABILITY_WAIVER_TEXT}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}