'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

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
  onSendReminder: (po: any) => void
  onViewPO: (po: any) => void
}

export function FundingSourceDetailModal({
  open,
  onOpenChange,
  fundingSource,
  stats,
  purchaseOrders,
  onSendReminder,
  onViewPO
}: FundingSourceDetailModalProps) {
  const [activeTab, setActiveTab] = useState('all')

  const isOverdue = (po: any) =>
    po.due_date && new Date(po.due_date) < new Date() && po.billing_status !== 'paid'

  const filteredPOs = purchaseOrders.filter(po => {
    if (activeTab === 'all') return true
    if (activeTab === 'overdue') return isOverdue(po)
    if (activeTab === 'pending') return po.status === 'pending'
    if (activeTab === 'paid') return po.billing_status === 'paid'
    return true
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{fundingSource} - Purchase Orders</DialogTitle>
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
            <div className="text-lg font-bold">${(stats.totalBilled || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Billed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">${(stats.totalPaid || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Paid</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">${(stats.balance || 0).toLocaleString()}</div>
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
                    <div>
                      <div className="font-medium">
                        {po.swimmer?.first_name} {po.swimmer?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {po.authorization_number}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOverdue(po) && <Badge variant="destructive">Overdue</Badge>}
                      {po.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                      {po.billing_status === 'paid' && <Badge className="bg-green-100 text-green-800">Paid</Badge>}

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onSendReminder(po); }}
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