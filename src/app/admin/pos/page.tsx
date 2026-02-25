'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  XCircle,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  Calendar,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { POBillingModal } from '@/components/admin/POBillingModal';
import { FundingSourceSummary } from '@/components/admin/FundingSourceSummary';
import { FundingSourceDetailModal } from '@/components/admin/FundingSourceDetailModal';
import { PostTabs, POSTab } from '@/components/admin/pos/PostTabs';
import { MonthlyBillingTab } from '@/components/admin/pos/MonthlyBillingTab';
import type { FundingSource } from '@/types/billing-types';

interface PurchaseOrder {
  id: string;
  po_type: 'assessment' | 'lessons';
  status: string;
  authorization_number: string | null;
  sessions_authorized: number;
  sessions_booked: number;
  sessions_used: number;
  start_date: string;
  end_date: string;
  created_at: string;
  notes: string | null;
  // Billing fields
  billing_status: string;
  billed_amount_cents: number;
  paid_amount_cents: number;
  billed_at: string | null;
  paid_at: string | null;
  invoice_number: string | null;
  payment_reference: string | null;
  billing_notes: string | null;
  due_date: string | null;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    parent_id: string;
  } | null;
  funding_source: {
    id: string;
    name: string;
    short_name: string;
  } | null;
  coordinator: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  approved_pending_auth: { label: 'Approved (Need Auth#)', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle },
  active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-600 border-gray-300', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
};

const BILLING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  unbilled: { label: 'Unbilled', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText },
  billed: { label: 'Billed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle },
};

export default function POSPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('all');
  const [poTypeFilter, setPoTypeFilter] = useState<string>('all');
  const [fundingSourceFilter, setFundingSourceFilter] = useState<string>('all');
  const [selectedFundingSource, setSelectedFundingSource] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Funding source detail modal state
  const [fundingSourceDetailOpen, setFundingSourceDetailOpen] = useState(false);
  const [selectedFundingSourceForDetail, setSelectedFundingSourceForDetail] = useState<string | null>(null);

  // Approval dialog state
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [authNumber, setAuthNumber] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);

  // Billing modal state
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [selectedPOForBilling, setSelectedPOForBilling] = useState<PurchaseOrder | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    needAuth: 0,
    active: 0,
    completed: 0,
    expired: 0,
    cancelled: 0,
    // Billing stats
    unbilled: 0,
    billed: 0,
    paid: 0,
    partial: 0,
    overdue: 0,
    disputed: 0,
    totalBilled: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });

  const [fundingSourceStats, setFundingSourceStats] = useState<FundingSourceStats[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<POSTab>('purchase-orders');
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);

  const fetchFundingSources = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('funding_sources')
        .select('id, short_name, name, is_active')
        .eq('is_active', true)
        .order('short_name');

      if (error) throw error;
      setFundingSources(data || []);
    } catch (error) {
      console.error('Error fetching funding sources:', error);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) {
        params.append('month', selectedMonth);
      }

      const response = await fetch(`/api/pos?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const orders = result.data || [];
      setPurchaseOrders(orders);
      setStats(result.stats || {
        total: 0,
        pending: 0,
        needAuth: 0,
        active: 0,
        completed: 0,
        expired: 0,
        cancelled: 0,
        unbilled: 0,
        billed: 0,
        paid: 0,
        partial: 0,
        overdue: 0,
        disputed: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalOutstanding: 0,
      });
      setFundingSourceStats(result.fundingSourceStats || []);
    } catch (error) {
      console.error('Error fetching POs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchFundingSources();
  }, [fetchPurchaseOrders, fetchFundingSources]);

  const handleApprove = async () => {
    if (!selectedPO) return;

    setApproving(true);
    const supabase = createClient();

    try {
      const updateData: Record<string, any> = {
        status: authNumber ? 'active' : 'approved_pending_auth',
        notes: approvalNotes || selectedPO.notes,
        updated_at: new Date().toISOString(),
      };

      if (authNumber) {
        updateData.authorization_number = authNumber;
      }

      const { error } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', selectedPO.id);

      if (error) throw error;

      // Refresh list
      await fetchPurchaseOrders();

      // Close dialog and reset
      setApprovalDialogOpen(false);
      setSelectedPO(null);
      setAuthNumber('');
      setApprovalNotes('');
    } catch (error) {
      console.error('Error approving PO:', error);
      alert('Failed to approve PO');
    } finally {
      setApproving(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedPO) return;

    const reason = prompt('Please enter a reason for declining:');
    if (!reason) return;

    setApproving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'cancelled',
          notes: `Declined: ${reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPO.id);

      if (error) throw error;

      await fetchPurchaseOrders();
      setApprovalDialogOpen(false);
      setSelectedPO(null);
    } catch (error) {
      console.error('Error declining PO:', error);
      alert('Failed to decline PO');
    } finally {
      setApproving(false);
    }
  };

  const handleMarkComplete = async (po: PurchaseOrder) => {
    if (!confirm('Mark this PO as completed?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', po.id);

      if (error) throw error;
      await fetchPurchaseOrders();
    } catch (error) {
      console.error('Error marking PO complete:', error);
      alert('Failed to update PO');
    }
  };

  const openApprovalDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setAuthNumber(po.authorization_number || '');
    setApprovalNotes(po.notes || '');
    setApprovalDialogOpen(true);
  };

  const openBillingModal = (po: PurchaseOrder) => {
    setSelectedPOForBilling(po);
    setBillingModalOpen(true);
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = searchTerm === '' ||
      `${po.swimmer?.first_name} ${po.swimmer?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.authorization_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.coordinator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesBillingStatus = billingStatusFilter === 'all' ||
      (billingStatusFilter === 'overdue'
        ? (po.due_date && new Date(po.due_date) < new Date() && po.billing_status !== 'paid')
        : po.billing_status === billingStatusFilter);
    const matchesPoType = poTypeFilter === 'all' || po.po_type === poTypeFilter;
    const matchesFundingSource = fundingSourceFilter === 'all' || po.funding_source?.id === fundingSourceFilter;
    const matchesSelectedFundingSource = !selectedFundingSource || po.funding_source?.id === selectedFundingSource;

    return matchesSearch && matchesStatus && matchesBillingStatus && matchesPoType && matchesFundingSource && matchesSelectedFundingSource;
  });

  const getFundingSources = () => {
    const sources = new Map();
    purchaseOrders.forEach(po => {
      if (po.funding_source) {
        sources.set(po.funding_source.id, po.funding_source);
      }
    });
    return Array.from(sources.values());
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="px-4 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {activeTab === 'purchase-orders' ? 'Purchase Orders' : 'Monthly Billing'}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === 'purchase-orders' ? 'Manage funding authorizations' : 'Generate and export funding source billing'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {activeTab === 'purchase-orders' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded-md px-3 py-2 bg-white text-sm"
              >
                <option value="2025-12">December 2025</option>
                <option value="2025-11">November 2025</option>
                <option value="2025-10">October 2025</option>
                <option value="2025-09">September 2025</option>
                <option value="2025-08">August 2025</option>
                <option value="2025-07">July 2025</option>
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={activeTab === 'purchase-orders' ? fetchPurchaseOrders : fetchFundingSources}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {activeTab === 'purchase-orders' && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <PostTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Conditional Content */}
      {activeTab === 'purchase-orders' ? (
        <>
          {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-xs text-green-700">Active</div>
            <div className="text-2xl font-bold text-green-800">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="text-xs text-yellow-700">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.pending + stats.needAuth}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-xs text-red-700">Outstanding</div>
            <div className="text-2xl font-bold text-red-800">
              ${(stats.totalOutstanding / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funding Source Summary */}
      <div className="mb-6">
        <FundingSourceSummary
          stats={fundingSourceStats}
          onSelectSource={setSelectedFundingSource}
          selectedSource={selectedFundingSource}
          onViewDetails={(sourceId) => {
            console.log('🚀 onViewDetails called with sourceId:', sourceId);
            console.log('📊 fundingSourceStats:', fundingSourceStats);
            console.log('🔍 Finding source in stats:', fundingSourceStats.find(fs => fs.id === sourceId));
            setSelectedFundingSourceForDetail(sourceId);
            setFundingSourceDetailOpen(true);
            console.log('✅ Modal state updated - selectedFundingSourceForDetail:', sourceId, 'fundingSourceDetailOpen:', true);
          }}
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by swimmer, auth#, or coordinator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedFundingSource && (
                <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-md px-3 py-2 w-full sm:w-auto">
                  <span className="text-sm text-cyan-700">
                    Filtered by: {fundingSourceStats.find(fs => fs.id === selectedFundingSource)?.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFundingSource(null)}
                    className="h-6 w-6 p-0 hover:bg-cyan-100 shrink-0"
                  >
                    <XCircle className="h-3 w-3 text-cyan-600" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-1 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 bg-white text-sm w-full"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved_pending_auth">Need Auth#</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <select
                value={billingStatusFilter}
                onChange={(e) => setBillingStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 bg-white text-sm w-full sm:w-auto"
              >
                <option value="all">All Billing</option>
                <option value="unbilled">Unbilled</option>
                <option value="billed">Billed</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="disputed">Disputed</option>
              </select>

              <select
                value={poTypeFilter}
                onChange={(e) => setPoTypeFilter(e.target.value)}
                className="border rounded-md px-3 py-2 bg-white text-sm w-full sm:w-auto"
              >
                <option value="all">All Types</option>
                <option value="assessment">Assessment</option>
                <option value="lessons">Lessons</option>
              </select>

              <select
                value={fundingSourceFilter}
                onChange={(e) => setFundingSourceFilter(e.target.value)}
                className="border rounded-md px-3 py-2 bg-white text-sm w-full sm:w-auto"
              >
                <option value="all">All Funding</option>
                {getFundingSources().map(source => (
                  <option key={source.id} value={source.id}>
                    {source.short_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PO List */}
      {filteredPOs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No purchase orders found</p>
            {searchTerm || statusFilter !== 'all' || poTypeFilter !== 'all' || fundingSourceFilter !== 'all' || selectedFundingSource ? (
              <p className="text-sm mt-2">Try adjusting your filters</p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {selectedFundingSource && (
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">
                {fundingSourceStats.find(fs => fs.id === selectedFundingSource)?.name} Purchase Orders
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFundingSource(null)}
                className="text-muted-foreground"
              >
                Clear filter
              </Button>
            </div>
          )}
          {filteredPOs.map((po) => {
            const statusConfig = STATUS_CONFIG[po.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const isExpired = po.status === 'expired' || (po.status === 'active' && new Date(po.end_date) < new Date());
            const isNearExpiry = po.status === 'active' && new Date(po.end_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            return (
              <Card key={po.id} className={`hover:shadow-md transition-shadow ${isExpired ? 'border-red-200' : isNearExpiry ? 'border-yellow-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${statusConfig.color.split(' ')[0]} shrink-0`}>
                        <StatusIcon className={`h-5 w-5 ${statusConfig.color.split(' ')[1]}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold truncate">
                            {po.swimmer?.first_name} {po.swimmer?.last_name}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {po.po_type === 'assessment' ? 'Assessment' : 'Lessons'}
                          </Badge>
                          <Badge className={`${statusConfig.color} border text-xs shrink-0`}>
                            {statusConfig.label}
                          </Badge>
                          {isNearExpiry && po.status === 'active' && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs shrink-0">
                              Expires Soon
                            </Badge>
                          )}
                          {isExpired && po.status === 'active' && (
                            <Badge className="bg-red-100 text-red-800 border-red-300 text-xs shrink-0">
                              Expired
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground break-words">
                          {po.funding_source?.short_name || 'Unknown'} •
                          {po.authorization_number ? ` Auth: ${po.authorization_number}` : ' No auth#'} •
                          {' '}{format(new Date(po.start_date), 'MMM d')} - {format(new Date(po.end_date), 'MMM d, yyyy')}
                          {po.coordinator && ` • Coordinator: ${po.coordinator.full_name}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      <div className="text-right sm:text-left">
                        <div className="text-sm font-medium">
                          {po.sessions_used}/{po.sessions_authorized} used
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {po.sessions_booked} booked
                        </div>
                      </div>

                      {/* Billing Info */}
                      <div className="text-right sm:text-left">
                        <div className="flex flex-wrap items-center gap-2 justify-end sm:justify-start mb-1">
                          {(() => {
                            const billingConfig = BILLING_STATUS_CONFIG[po.billing_status] || BILLING_STATUS_CONFIG.unbilled;
                            const BillingIcon = billingConfig.icon;
                            return (
                              <Badge className={`${billingConfig.color} text-xs shrink-0`}>
                                <BillingIcon className="h-3 w-3 mr-1" />
                                {billingConfig.label}
                              </Badge>
                            );
                          })()}
                          {po.due_date && new Date(po.due_date) < new Date() && po.billing_status !== 'paid' && (
                            <div className="flex items-center gap-1">
                              <Badge className="bg-red-100 text-red-800 border-red-300 text-xs shrink-0">
                                Past Due
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-xs shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Use coordinator email if available
                                  const email = po.coordinator?.email;
                                  if (email) {
                                    const amountOwed = ((po.billed_amount_cents || 0) - (po.paid_amount_cents || 0)) / 100;
                                    const swimmerName = `${po.swimmer?.first_name || ''} ${po.swimmer?.last_name || ''}`.trim();
                                    const subject = `Payment Reminder - PO ${po.authorization_number || po.id}`;
                                    const body = `Hello ${po.coordinator?.full_name || 'Coordinator'},

This is a reminder that PO ${po.authorization_number || po.id} for ${swimmerName} is past due.

Amount owed: $${amountOwed.toFixed(2)}
Due date: ${po.due_date ? new Date(po.due_date).toLocaleDateString() : 'N/A'}

Please let us know when we can expect payment.

Thank you,
I Can Swim Team`;
                                    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                  } else {
                                    alert('No coordinator email on file for this PO');
                                  }
                                }}
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="text-xs">
                          {po.billed_amount_cents > 0 && (
                            <span className="font-medium">${(po.billed_amount_cents / 100).toFixed(2)}</span>
                          )}
                          {po.paid_amount_cents > 0 && (
                            <span className={`ml-2 ${po.paid_amount_cents >= po.billed_amount_cents ? 'text-green-600' : 'text-yellow-600'}`}>
                              Paid: ${(po.paid_amount_cents / 100).toFixed(2)}
                            </span>
                          )}
                          {po.due_date && (
                            <div className="text-muted-foreground">
                              Due: {format(new Date(po.due_date), 'MMM d')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(po.status === 'pending' || po.status === 'approved_pending_auth') && (
                          <Button size="sm" onClick={() => openApprovalDialog(po)} className="shrink-0">
                            {po.status === 'pending' ? 'Review' : 'Add Auth#'}
                          </Button>
                        )}

                        {po.status === 'active' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openApprovalDialog(po)} className="shrink-0">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {po.sessions_used >= po.sessions_authorized && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkComplete(po)} className="shrink-0">
                                Mark Complete
                              </Button>
                            )}
                          </>
                        )}

                        {po.status === 'completed' && (
                          <Button size="sm" variant="outline" onClick={() => openApprovalDialog(po)} className="shrink-0">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}

                        {/* Billing Action */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openBillingModal(po)}
                          className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 shrink-0"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Billing
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPO?.status === 'pending' ? 'Review Purchase Order' :
               selectedPO?.status === 'approved_pending_auth' ? 'Add Authorization Number' :
               'Purchase Order Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedPO?.swimmer?.first_name} {selectedPO?.swimmer?.last_name} - {selectedPO?.po_type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Funding Source:</span>
                <p className="font-medium">{selectedPO?.funding_source?.name || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Coordinator:</span>
                <p className="font-medium">{selectedPO?.coordinator?.full_name || 'Not assigned'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sessions:</span>
                <p className="font-medium">{selectedPO?.sessions_authorized} authorized</p>
              </div>
              <div>
                <span className="text-muted-foreground">Used:</span>
                <p className="font-medium">{selectedPO?.sessions_used}/{selectedPO?.sessions_authorized}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Start Date:</span>
                <p className="font-medium">{selectedPO?.start_date ? format(new Date(selectedPO.start_date), 'MMM d, yyyy') : '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">End Date:</span>
                <p className="font-medium">{selectedPO?.end_date ? format(new Date(selectedPO.end_date), 'MMM d, yyyy') : '-'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authNumber">Authorization Number</Label>
              <Input
                id="authNumber"
                placeholder="Enter authorization number from coordinator"
                value={authNumber}
                onChange={(e) => setAuthNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this PO..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {selectedPO?.status === 'pending' && (
              <Button variant="destructive" onClick={handleDecline} disabled={approving}>
                Decline
              </Button>
            )}
            <Button onClick={handleApprove} disabled={approving}>
              {approving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedPO?.status === 'pending' ? 'Approve' :
               selectedPO?.status === 'approved_pending_auth' ? 'Save Auth#' :
               'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing Modal */}
      <POBillingModal
        po={selectedPOForBilling}
        open={billingModalOpen}
        onClose={() => {
          setBillingModalOpen(false);
          setSelectedPOForBilling(null);
        }}
        onUpdate={fetchPurchaseOrders}
      />

      {/* Funding Source Detail Modal */}
      {selectedFundingSourceForDetail && (
        <FundingSourceDetailModal
          open={fundingSourceDetailOpen}
          onOpenChange={(open) => {
            setFundingSourceDetailOpen(open);
            if (!open) {
              setSelectedFundingSourceForDetail(null);
            }
          }}
          fundingSource={fundingSourceStats.find(fs => fs.id === selectedFundingSourceForDetail)?.name || selectedFundingSourceForDetail}
          stats={{
            activeCount: fundingSourceStats.find(fs => fs.id === selectedFundingSourceForDetail)?.activePOs || 0,
            pendingCount: fundingSourceStats.find(fs => fs.id === selectedFundingSourceForDetail)?.pendingPOs || 0,
            overdueCount: fundingSourceStats.find(fs => fs.id === selectedFundingSourceForDetail)?.overdueCount || 0,
            totalBilled: (fundingSourceStats.find(fs => fs.id === selectedFundingSourceForDetail)?.billedAmount || 0) / 100,
            totalPaid: (fundingSourceStats.find(fs => fs.id === selectedFundingSourceForDetail)?.paidAmount || 0) / 100,
            balance: (fundingSourceStats.find(fs => fs.id === selectedFundingSourceForDetail)?.outstandingBalance || 0) / 100,
          }}
          purchaseOrders={purchaseOrders.filter(po =>
            po.funding_source?.id === selectedFundingSourceForDetail
          )}
          onViewPO={(po) => {
            setSelectedPO(po);
            setFundingSourceDetailOpen(false);
            setSelectedFundingSourceForDetail(null);
          }}
        />
      )}
        </>
      ) : (
        <MonthlyBillingTab fundingSources={fundingSources} />
      )}
      </div>
    </div>
  );
}