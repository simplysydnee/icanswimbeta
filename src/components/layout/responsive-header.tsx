'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { MobileNav } from './mobile-nav'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from './UserMenu'
import { Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  getPurchaseOrderAttentionReasons,
  PO_ATTENTION_REASON_LABELS,
} from '@/lib/po-attention'

type AttentionPo = {
  id: string
  status: string
  po_type: string
  end_date: string
  swimmer?: {
    first_name?: string
    last_name?: string
    sessions?: Array<{ session?: { start_time?: string | null } | null }>
  } | null
}

export function ResponsiveHeader() {
  const { role } = useAuth()
  const pathname = usePathname()
  const isAdminPoAttention =
    role === 'admin' && Boolean(pathname?.startsWith('/admin'))

  const [attentionCount, setAttentionCount] = useState(0)
  const [attentionRows, setAttentionRows] = useState<AttentionPo[]>([])
  const [attentionLoading, setAttentionLoading] = useState(false)

  const fetchAttention = useCallback(async () => {
    setAttentionLoading(true)
    try {
      const listRes = await fetch('/api/pos?attention=needs&limit=15')
      if (!listRes.ok) {
        setAttentionCount(0)
        setAttentionRows([])
        return
      }
      const j = await listRes.json()
      const rows = Array.isArray(j.data) ? (j.data as AttentionPo[]) : []
      setAttentionRows(rows)
      setAttentionCount(
        typeof j.attentionCount === 'number' ? j.attentionCount : rows.length
      )
    } catch {
      setAttentionCount(0)
      setAttentionRows([])
    } finally {
      setAttentionLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdminPoAttention) {
      setAttentionCount(0)
      setAttentionRows([])
      return
    }
    void fetchAttention()
  }, [isAdminPoAttention, pathname, fetchAttention])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile menu */}
        <MobileNav />

        {/* Logo - visible on mobile when menu closed */}
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <img src="/images/logo.jpg" alt="I Can Swim" className="h-8 w-8 rounded" />
          <span className="font-semibold">I Can Swim</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side - notifications & profile */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {isAdminPoAttention && attentionCount > 0 ? (
                  <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 flex items-center justify-center p-0 text-[10px] border-0 bg-red-600 hover:bg-red-600 text-white pointer-events-none">
                    {attentionCount > 99 ? '99+' : attentionCount}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 max-h-[min(22rem,calc(100dvh-5rem))] flex flex-col overflow-hidden p-0"
              align="end"
            >
              {isAdminPoAttention ? (
                <>
                  <div className="shrink-0 border-b px-4 py-3">
                    <h3 className="font-semibold">Purchase order alerts</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      POs that are pending, ending within 30 days, or inactive with an upcoming booking.
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {attentionLoading ? (
                      <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : attentionRows.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No purchase orders need attention right now.
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {attentionRows.map((po) => {
                          const name = po.swimmer
                            ? `${po.swimmer.first_name ?? ''} ${po.swimmer.last_name ?? ''}`.trim()
                            : 'Unknown swimmer'
                          const reasons = getPurchaseOrderAttentionReasons(po)
                          const reasonText = reasons
                            .map((r) => PO_ATTENTION_REASON_LABELS[r])
                            .join(' · ')
                          return (
                            <li key={po.id} className="px-4 py-2.5 text-sm">
                              <p className="font-medium leading-tight">{name || 'Swimmer'}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {po.po_type} · {po.status.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-amber-800/90 mt-1 break-words">{reasonText}</p>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="shrink-0 border-t bg-muted/40 p-3">
                    <Button asChild className="w-full" size="sm">
                      <Link href="/admin/pos?attention=needs">
                        View all purchase orders
                        {attentionCount > attentionRows.length
                          ? ` (${attentionCount})`
                          : ''}
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="max-h-[min(20rem,calc(100dvh-5rem))] overflow-y-auto overscroll-contain p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifications feature coming soon
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Email notifications are currently sent for:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Booking changes</li>
                      <li>Assessment completions</li>
                      <li>POS approvals</li>
                    </ul>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
