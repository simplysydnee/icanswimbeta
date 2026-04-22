'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface FundedRenewalQueueItem {
  swimmerId: string;
  swimmerName: string;
  sessionId: string;
  bookingId: string;
  sessionStart: string;
  purchaseOrderId: string;
  sessionsUsed: number;
  sessionsAuthorized: number;
  renewalThreshold: number;
  effectiveRenewalThreshold: number;
  endDate: string | null;
  reasons: ('threshold' | 'expiry')[];
  needsProgress: boolean;
  returnTo: string;
  progressUrl: string;
}

interface FundedPoRenewalCardProps {
  className?: string;
}

export function FundedPoRenewalCard({ className }: FundedPoRenewalCardProps) {
  const [items, setItems] = useState<FundedRenewalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/instructor/funded-po-renewal-queue', { signal });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
        };
        const parts = [j.error, j.details].filter(Boolean);
        throw new Error(parts.join(': ') || `Failed to load (${res.status})`);
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Failed to load renewal queue');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            Funded PO renewal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading swimmers who may need renewal…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Funded PO renewal
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Funded PO renewal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No funded swimmers on your schedule need a PO renewal right now (usage threshold or PO
            ending within 2 days).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          PO renewal required
          <Badge variant="outline" className="ml-1 bg-amber-50 text-amber-900 border-amber-200">
            {items.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Funded swimmers who have reached the renewal usage threshold or whose PO ends within 2
          days. Update progress first when prompted, then submit the renewal PO.
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Swimmer</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>PO usage</TableHead>
              <TableHead>PO ends</TableHead>
              <TableHead>Why</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={`${row.swimmerId}-${row.purchaseOrderId}`}>
                <TableCell className="font-medium">{row.swimmerName}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {format(parseISO(row.sessionStart), 'MMM d, h:mm a')}
                </TableCell>
                <TableCell className="text-sm">
                  {row.sessionsUsed} / {row.sessionsAuthorized}
                  <span className="text-muted-foreground text-xs ml-1">
                    (alert ≥{row.effectiveRenewalThreshold})
                  </span>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {row.endDate || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.reasons.includes('threshold') && (
                      <Badge variant="secondary" className="text-xs">
                        Usage threshold
                      </Badge>
                    )}
                    {row.reasons.includes('expiry') && (
                      <Badge variant="secondary" className="text-xs">
                        Ending soon
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right space-y-1">
                  {row.needsProgress ? (
                    <Button size="sm" variant="default" asChild>
                      <Link href={row.progressUrl}>
                        Update progress
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="default" asChild>
                      <Link href={row.returnTo}>
                        Submit PO renewal
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
