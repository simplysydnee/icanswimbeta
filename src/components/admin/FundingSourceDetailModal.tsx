'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FundingSourceDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fundingSource: string
  stats: {
    activeCount: number
    pendingCount: number
    overdueCount: number
    totalBilled: number
    totalPaid: number
    balance: number
  }
  purchaseOrders: any[]
  onViewPO: (po: any) => void
}

export function FundingSourceDetailModal({
  open,
  onOpenChange,
  fundingSource,
  stats,
  purchaseOrders,
  onViewPO
}: FundingSourceDetailModalProps) {
  console.log('🎯 FundingSourceDetailModal rendered with props:', {
    open,
    fundingSource,
    stats,
    purchaseOrdersCount: purchaseOrders?.length,
    onOpenChange: typeof onOpenChange,
    onViewPO: typeof onViewPO
  });

  const [activeTab, setActiveTab] = useState('all')
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusLabel = (po: any): string => {
    if (po.billing_status === 'paid') return 'Paid'
    if (po.due_date && new Date(po.due_date) < new Date() && po.billing_status !== 'paid') return 'Overdue'
    if (po.status === 'pending' || !po.authorization_number) return 'Pending'
    return 'Active'
  }

  const getStatusVariant = (po: any): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const status = getStatusLabel(po)
    switch (status) {
      case 'Paid': return 'default'
      case 'Overdue': return 'destructive'
      case 'Pending': return 'secondary'
      default: return 'outline'
    }
  }

  const handleSendReminder = async (po: any) => {
    // Get coordinator info from swimmer
    const coordinatorEmail = po.swimmer?.vmrc_coordinator_email
    const coordinatorName = po.swimmer?.vmrc_coordinator_name || 'Coordinator'
    const swimmerName = `${po.swimmer?.first_name || ''} ${po.swimmer?.last_name || ''}`.trim()

    if (!coordinatorEmail) {
      toast({
        title: 'Error',
        description: 'No coordinator email found for this swimmer',
        variant: 'destructive'
      })
      return
    }

    // Calculate details
    const status = getStatusLabel(po)
    const amountDue = ((po.amount_billed || 0) - (po.amount_paid || 0)) / 100
    const dueDate = po.due_date ? new Date(po.due_date).toLocaleDateString() : 'Not set'

    // Create email content
    const subject = encodeURIComponent(`Reminder: PO ${po.authorization_number || 'Pending'} - ${swimmerName}`)
    const body = encodeURIComponent(`Hi ${coordinatorName},

This is a friendly reminder regarding the Purchase Order for ${swimmerName}.

PO Details:
- Authorization #: ${po.authorization_number || 'Pending authorization'}
- Status: ${status}
- Amount Billed: $${(po.amount_billed || 0) / 100}
- Amount Paid: $${(po.amount_paid || 0) / 100}
- Balance Due: $${amountDue.toFixed(2)}
- Due Date: ${dueDate}

${status === 'Pending' ? 'Please provide the authorization number at your earliest convenience.' : ''}
${status === 'Overdue' ? 'This payment is past due. Please process payment or contact us if there are any issues.' : ''}

Thank you for your attention to this matter.

Best regards,
I Can Swim Team
(209) 778-7877
info@icanswim209.com
`)

    // Open email client
    window.location.href = `mailto:${coordinatorEmail}?subject=${subject}&body=${body}`

    toast({
      title: 'Email Ready',
      description: `Opening email to ${coordinatorName}`
    })
  }

  const filteredPOs = useMemo(() => {
    if (!purchaseOrders) return []

    switch (activeTab) {
      case 'overdue':
        return purchaseOrders.filter(po =>
          po.due_date && new Date(po.due_date) < new Date() && po.billing_status !== 'paid'
        )
      case 'pending':
        return purchaseOrders.filter(po =>
          po.status === 'pending' || !po.authorization_number
        )
      case 'paid':
        return purchaseOrders.filter(po => po.billing_status === 'paid')
      default: // 'all'
        return purchaseOrders
    }
  }, [purchaseOrders, activeTab])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{fundingSource} - Purchase Orders</DialogTitle>
          <DialogDescription>
            View purchase orders and usage details for this funding source.
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 py-3 border-b text-center">
          <div>
            <div className="text-lg font-bold text-green-600">{stats.activeCount}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">{stats.pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{stats.overdueCount}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
          <div>
            <div className="text-lg font-bold">{formatCurrency(stats.totalBilled || 0)}</div>
            <div className="text-xs text-muted-foreground">Billed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalPaid || 0)}</div>
            <div className="text-xs text-muted-foreground">Paid</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{formatCurrency(stats.balance || 0)}</div>
            <div className="text-xs text-muted-foreground">Balance</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="overdue" className="text-red-600">Overdue</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 overflow-y-auto mt-2">
            {filteredPOs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No POs in this category.</p>
            ) : (
              <div className="space-y-2">
                {filteredPOs.map(po => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => onViewPO(po)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          {po.swimmer?.first_name} {po.swimmer?.last_name}
                        </div>
                        <Badge variant={getStatusVariant(po)}>
                          {getStatusLabel(po)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {po.authorization_number || 'No auth #'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleSendReminder(po); }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}