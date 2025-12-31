'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface FundingSourceStats {
  id: string;
  name: string;
  code: string;
  activePOs: number;
  pendingPOs: number;
  billedAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  overdueCount: number;
}

interface Props {
  stats: FundingSourceStats[];
  onSelectSource: (sourceId: string | null) => void;
  selectedSource: string | null;
  onViewDetails?: (sourceId: string) => void;
}

export function FundingSourceSummary({ stats, onSelectSource, selectedSource, onViewDetails }: Props) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const totals = stats.reduce((acc, s) => ({
    active: acc.active + s.activePOs,
    pending: acc.pending + s.pendingPOs,
    billed: acc.billed + s.billedAmount,
    paid: acc.paid + s.paidAmount,
    outstanding: acc.outstanding + s.outstandingBalance
  }), { active: 0, pending: 0, billed: 0, paid: 0, outstanding: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>By Funding Source</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funding Source</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-center">Pending</TableHead>
              <TableHead className="text-right">Billed</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((source) => (
              <TableRow
                key={source.id}
                className={`cursor-pointer hover:bg-muted/50 ${selectedSource === source.id ? 'bg-muted' : ''}`}
                onClick={(e) => {
                  console.log('🔍 Funding source clicked:', source.name, source.id);
                  if (onViewDetails) {
                    console.log('📱 Calling onViewDetails with sourceId:', source.id);
                    onViewDetails(source.id);
                  } else {
                    console.log('🎯 Calling onSelectSource with sourceId:', source.id);
                    onSelectSource(selectedSource === source.id ? null : source.id);
                  }
                }}
              >
                <TableCell className="font-medium">
                  {source.name}
                  {source.overdueCount > 0 && (
                    <Badge variant="destructive" className="ml-2">{source.overdueCount} overdue</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">{source.activePOs}</TableCell>
                <TableCell className="text-center">
                  {source.pendingPOs > 0 ? (
                    <span className="text-yellow-600 font-medium">{source.pendingPOs}</span>
                  ) : '0'}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(source.billedAmount)}</TableCell>
                <TableCell className="text-right text-green-600">{formatCurrency(source.paidAmount)}</TableCell>
                <TableCell className="text-right">
                  {source.outstandingBalance > 0 ? (
                    <span className="text-red-600 font-semibold">{formatCurrency(source.outstandingBalance)}</span>
                  ) : (
                    <span className="text-green-600">{formatCurrency(0)}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-center">{totals.active}</TableCell>
              <TableCell className="text-center">{totals.pending}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.billed)}</TableCell>
              <TableCell className="text-right text-green-600">{formatCurrency(totals.paid)}</TableCell>
              <TableCell className="text-right">
                {totals.outstanding > 0 ? (
                  <span className="text-red-600">{formatCurrency(totals.outstanding)}</span>
                ) : (
                  <span className="text-green-600">{formatCurrency(0)}</span>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-2">
          {onViewDetails ? 'Click a row to view details' : 'Click a row to filter POs by that funding source'}
        </p>
      </CardContent>
    </Card>
  );
}