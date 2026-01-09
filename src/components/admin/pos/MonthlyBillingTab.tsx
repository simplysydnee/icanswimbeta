'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
  Calendar,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import {
  BillingPeriod,
  BillingLineItem,
  FundingSource,
  BillingPeriodStatus,
  BillingLineItemStatus
} from '@/types/billing-types';

interface MonthlyBillingTabProps {
  fundingSources: FundingSource[];
}

const STATUS_CONFIG: Record<BillingPeriodStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText },
  generated: { label: 'Generated', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
  reviewed: { label: 'Reviewed', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Eye },
  submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: CheckCircle },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
};

const LINE_ITEM_STATUS_CONFIG: Record<BillingLineItemStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Clock },
  included: { label: 'Included', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  no_service: { label: 'No Service', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle },
  deferred: { label: 'Deferred', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
};

export function MonthlyBillingTab({ fundingSources }: MonthlyBillingTabProps) {
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod | null>(null);
  const [billingLineItems, setBillingLineItems] = useState<BillingLineItem[]>([]);
  const [billingSummary, setBillingSummary] = useState<{
    total_lessons_authorized: number;
    total_lessons_billed: number;
    total_lessons_remaining: number;
    total_amount_billed_cents: number;
    total_amount_pending_cents: number;
    funding_source_summary: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedFundingSource, setSelectedFundingSource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  const fetchBillingPeriods = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      let query = supabase
        .from('billing_periods')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (selectedMonth) {
        query = query.eq('month', selectedMonth);
      }
      if (selectedYear) {
        query = query.eq('year', selectedYear);
      }
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBillingPeriods(data || []);

      // Select the most recent period if none selected
      if (data && data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0]);
      }
    } catch (error) {
      console.error('Error fetching billing periods:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedStatus, selectedPeriod]);

  const fetchBillingLineItems = useCallback(async (periodId: string) => {
    const supabase = createClient();

    try {
      // Fetch billing line items with purchase order details
      const { data, error } = await supabase
        .from('billing_line_items')
        .select(`
          *,
          purchase_orders (
            sessions_authorized,
            billed_amount_cents,
            billing_status
          )
        `)
        .eq('billing_period_id', periodId)
        .order('swimmer_name');

      if (error) throw error;
      setBillingLineItems(data || []);
    } catch (error) {
      console.error('Error fetching billing line items:', error);
    }
  }, []);

  const fetchBillingSummary = useCallback(async (periodId: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc('get_billing_period_summary', {
        p_billing_period_id: periodId
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setBillingSummary(data[0]);
      } else {
        setBillingSummary(null);
      }
    } catch (error) {
      console.error('Error fetching billing summary:', error);
      setBillingSummary(null);
    }
  }, []);

  const handleGenerateBilling = async () => {
    if (!selectedPeriod) {
      alert('Please select a billing period first');
      return;
    }

    setGenerating(true);
    const supabase = createClient();

    try {
      // Call the database function to populate billing line items
      const { data, error } = await supabase.rpc('populate_billing_line_items', {
        p_billing_period_id: selectedPeriod.id
      });

      if (error) throw error;

      // Refresh the data
      await fetchBillingPeriods();
      if (selectedPeriod) {
        await fetchBillingLineItems(selectedPeriod.id);
      }

      alert(`Generated ${data} billing line items`);
    } catch (error) {
      console.error('Error generating billing:', error);
      alert('Failed to generate billing');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportXML = async () => {
    if (!selectedPeriod) {
      alert('Please select a billing period first');
      return;
    }

    setExporting(true);
    const supabase = createClient();

    try {
      // Call the database function to generate XML and mark items as billed
      const { data, error } = await supabase.rpc('generate_vmrc_ebilling_xml', {
        p_billing_period_id: selectedPeriod.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const xmlData = data[0];
        const blob = new Blob([xmlData.xml_content], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VMRC_Billing_${selectedPeriod.year}_${String(selectedPeriod.month).padStart(2, '0')}.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Get billing summary after export
        const { data: summaryData, error: summaryError } = await supabase.rpc('get_billing_period_summary', {
          p_billing_period_id: selectedPeriod.id
        });

        if (summaryError) {
          console.error('Error fetching billing summary:', summaryError);
        } else if (summaryData && summaryData.length > 0) {
          const summary = summaryData[0];
          alert(`XML exported successfully!\n\nBilling Summary:\n- Lessons Billed: ${summary.total_lessons_billed}\n- Total Amount Billed: $${(summary.total_amount_billed_cents / 100).toFixed(2)}\n- Lessons Remaining: ${summary.total_lessons_remaining}\n- Amount Pending: $${(summary.total_amount_pending_cents / 100).toFixed(2)}`);
        }

        await fetchBillingPeriods();
        if (selectedPeriod) {
          await fetchBillingLineItems(selectedPeriod.id);
          await fetchBillingSummary(selectedPeriod.id);
        }
      }
    } catch (error) {
      console.error('Error exporting XML:', error);
      alert('Failed to export XML');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchBillingPeriods();
  }, [fetchBillingPeriods]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchBillingLineItems(selectedPeriod.id);
      fetchBillingSummary(selectedPeriod.id);
    } else {
      setBillingSummary(null);
    }
  }, [selectedPeriod, fetchBillingLineItems, fetchBillingSummary]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const filteredLineItems = billingLineItems.filter(item => {
    if (selectedFundingSource === 'all') return true;

    // We need to check if this line item belongs to the selected funding source
    // This would require joining with purchase_orders table, but for now we'll filter by service code
    // VMRC = '102', CVRC = '101' (example codes)
    if (selectedFundingSource === 'VMRC') {
      return item.service_code === '102';
    }
    if (selectedFundingSource === 'CVRC') {
      return item.service_code === '101';
    }
    return true;
  });

  const totalAmount = filteredLineItems.reduce((sum, item) => sum + item.gross_amount_cents, 0);
  const totalUnits = filteredLineItems.reduce((sum, item) => sum + item.units_billed, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Monthly Billing</h2>
          <p className="text-muted-foreground">Generate and export VMRC/CVRC billing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBillingPeriods}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedPeriod && (
            <>
              <Button
                size="sm"
                onClick={handleGenerateBilling}
                disabled={generating || selectedPeriod.status !== 'draft'}
              >
                {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Billing
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportXML}
                disabled={exporting || selectedPeriod.status === 'draft'}
              >
                {exporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Download className="h-4 w-4 mr-2" />
                Export XML
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={String(month)}>
                      {format(new Date(2000, month - 1, 1), 'MMMM')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funding-source">Funding Source</Label>
              <Select value={selectedFundingSource} onValueChange={setSelectedFundingSource}>
                <SelectTrigger>
                  <SelectValue placeholder="All funding sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All funding sources</SelectItem>
                  {fundingSources.map(source => (
                    <SelectItem key={source.id} value={source.short_name}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Periods Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Periods</div>
            <div className="text-2xl font-bold">{billingPeriods.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Selected Period</div>
            <div className="text-lg font-bold">
              {selectedPeriod ? `${selectedPeriod.month}/${selectedPeriod.year}` : 'None'}
            </div>
            {selectedPeriod && (
              <div className="text-xs text-muted-foreground mt-1">
                {STATUS_CONFIG[selectedPeriod.status]?.label || selectedPeriod.status}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Line Items</div>
            <div className="text-2xl font-bold">{filteredLineItems.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalUnits.toFixed(2)} units
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {selectedFundingSource === 'all' ? 'All sources' : selectedFundingSource}
            </div>
          </CardContent>
        </Card>

        {billingSummary && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Billing Summary</div>
              <div className="text-lg font-bold">
                {billingSummary.total_lessons_billed} / {billingSummary.total_lessons_authorized} Lessons
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ${(billingSummary.total_amount_billed_cents / 100).toFixed(2)} billed • ${(billingSummary.total_amount_pending_cents / 100).toFixed(2)} pending
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Billing Periods List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing Periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {billingPeriods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No billing periods found</p>
                <p className="text-sm mt-2">Create a new billing period to get started</p>
              </div>
            ) : (
              billingPeriods.map(period => {
                const statusConfig = STATUS_CONFIG[period.status];
                const StatusIcon = statusConfig?.icon || FileText;

                return (
                  <div
                    key={period.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPeriod?.id === period.id
                        ? 'bg-cyan-50 border-cyan-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${statusConfig?.color.split(' ')[0]}`}>
                        <StatusIcon className={`h-4 w-4 ${statusConfig?.color.split(' ')[1]}`} />
                      </div>
                      <div>
                        <div className="font-medium">
                          {format(new Date(period.year, period.month - 1, 1), 'MMMM yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {period.line_item_count} line items • {formatCurrency(period.total_amount_cents)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={statusConfig?.color}>
                        {statusConfig?.label}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {period.generated_at && format(new Date(period.generated_at), 'MMM d')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Line Items Table */}
      {selectedPeriod && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Billing Line Items</span>
              <div className="text-sm font-normal text-muted-foreground">
                {filteredLineItems.length} items • {formatCurrency(totalAmount)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Swimmer</TableHead>
                    <TableHead>UCI #</TableHead>
                    <TableHead>Auth #</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Authorized</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No billing line items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLineItems.map(item => {
                      const statusConfig = LINE_ITEM_STATUS_CONFIG[item.status];
                      const StatusIcon = statusConfig?.icon || Clock;

                      const authorizedSessions = item.purchase_orders?.sessions_authorized || 0;
                      const billedAmount = item.purchase_orders?.billed_amount_cents || 0;
                      const rate = item.rate_cents || 9644; // Default rate if not set
                      const billedSessions = rate > 0 ? Math.round(billedAmount / rate) : 0;
                      const remainingSessions = Math.max(0, authorizedSessions - billedSessions);

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.swimmer_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.uci_number}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.authorization_number}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{item.service_code}</div>
                              <div className="text-muted-foreground">{item.subcode}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {authorizedSessions}
                          </TableCell>
                          <TableCell className="text-right">
                            {billedSessions}
                          </TableCell>
                          <TableCell className="text-right">
                            {remainingSessions}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.units_billed.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.rate_cents)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.gross_amount_cents)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig?.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}