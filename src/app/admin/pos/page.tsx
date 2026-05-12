'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
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
  Calendar,
  Plus,
  Bell,
  AlertTriangle,
  Check,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { POBillingModal } from '@/components/admin/POBillingModal';
import { FundingSourceDetailModal } from '@/components/admin/FundingSourceDetailModal';
import { PostTabs, POSTab } from '@/components/admin/pos/PostTabs';
import { MonthlyBillingTab } from '@/components/admin/pos/MonthlyBillingTab';
import type { FundingSource } from '@/types/billing-types';
import { isPurchaseOrderNeedingAttention } from '@/lib/po-attention';

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
    bookings?: Array<{
      booking_id?: string;
      status?: string;
      session?: {
        start_time?: string | null;
        end_time?: string | null;
        location?: string | null;
        session_type?: string | null;
      } | null;
    }>;
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

const getStatusBadge = (po: PurchaseOrder) => {
  const today = new Date();
  const end = po.end_date ? new Date(po.end_date) : null;
  const days = end ? Math.floor((end.getTime() - today.getTime()) / 86400000) : null;
  const exhausted = po.sessions_authorized > 0 && po.sessions_used >= po.sessions_authorized;

  if (exhausted) return { label: 'Sessions Exhausted', color: 'red' };
  if (days === null) return { label: 'Active', color: 'green' };
  if (days > 30) return { label: 'Active', color: 'green' };
  if (days >= 0) return { label: 'Expires Soon', color: 'yellow' };
  return { label: 'Expired', color: 'red' };
};

type PoSwimmerSessionEntry = NonNullable<
  NonNullable<PurchaseOrder['swimmer']>['bookings']
>[number];

/** Bookings we treat as cancellable from the POS list (matches confirmed rows from `/api/pos`). */
function getActiveLessonBookings(po: PurchaseOrder) {
  const bookings = po.swimmer?.bookings ?? [];
  return bookings.filter(
    (s): s is PoSwimmerSessionEntry & { booking_id: string } =>
      Boolean(s.booking_id) && (s.status === 'confirmed' || s.status === 'active')
  );
}

function canShowCancelLesson(po: PurchaseOrder) {
  const bookings = po.swimmer?.bookings;
  if (!bookings?.length) return false;
  return getActiveLessonBookings(po).length > 0;
}

function formatLessonBookingLabel(entry: PoSwimmerSessionEntry) {
  if (!entry?.booking_id) return '';
  const start = entry.session?.start_time;
  const parts: string[] = [];
  if (start) {
    try {
      parts.push(format(new Date(start), 'EEE MMM d, yyyy h:mm a'));
    } catch {
      parts.push(String(start));
    }
  }
  if (entry.session?.location) {
    parts.push(entry.session.location);
  }
  const idShort = entry.booking_id.length > 12 ? `${entry.booking_id.slice(0, 8)}…` : entry.booking_id;
  if (parts.length) {
    return `${parts.join(' · ')} — ${idShort}`;
  }
  return `Booking ${idShort}`;
}

const BILLING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  unbilled: { label: 'Unbilled', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText },
  billed: { label: 'Billed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle },
};

function POSPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attentionNeeds = searchParams.get('attention') === 'needs';
  const { toast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('all');
  const [poTypeFilter, setPoTypeFilter] = useState<string>('all');
  const [fundingSourceFilter, setFundingSourceFilter] = useState<string>('all');
  const [selectedFundingSource, setSelectedFundingSource] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([]);

  // Inline notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesValue, setEditingNotesValue] = useState('');
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [notesSavedId, setNotesSavedId] = useState<string | null>(null);

  // Generic inline cell editing (status, dates, sessions_authorized, auth#)
  const [editCell, setEditCell] = useState<{ field: string; poId: string } | null>(null);
  const [editCellValue, setEditCellValue] = useState('');
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [savedCell, setSavedCell] = useState<string | null>(null);

  // Cancel PO confirmation
  const [confirmCancelPoId, setConfirmCancelPoId] = useState<string | null>(null);
  const [cancellingPo, setCancellingPo] = useState(false);

  // Attention banner filter toggles
  const [showExhausted, setShowExhausted] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);

  // Funding source detail modal state
  const [fundingSourceDetailOpen, setFundingSourceDetailOpen] = useState(false);
  const [selectedFundingSourceForDetail, setSelectedFundingSourceForDetail] = useState<string | null>(null);

  // Approval dialog state
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [authNumber, setAuthNumber] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [remindingPoId, setRemindingPoId] = useState<string | null>(null);
  const [warningPoId, setWarningPoId] = useState<string | null>(null);

  // Cancel lesson modal
  const [cancelLessonModalOpen, setCancelLessonModalOpen] = useState(false);
  const [poForCancelLesson, setPoForCancelLesson] = useState<PurchaseOrder | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

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
    outstandingClients: 0,
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

  const fetchMonthRange = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: minData } = await supabase
        .from('purchase_orders')
        .select('start_date')
        .order('start_date', { ascending: true })
        .limit(1);

      const { data: maxData } = await supabase
        .from('purchase_orders')
        .select('end_date')
        .order('end_date', { ascending: false })
        .limit(1);

      const minDate = minData?.[0]?.start_date;
      const maxDate = maxData?.[0]?.end_date;
      if (!minDate || !maxDate) return;

      const start = new Date(minDate);
      const end = new Date(maxDate);
      const twelveMonthsFromNow = new Date();
      twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12);
      const effectiveEnd = end > twelveMonthsFromNow ? end : twelveMonthsFromNow;

      const options: { value: string; label: string }[] = [];
      const current = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 1);
      const startFirstOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);

      while (current >= startFirstOfMonth) {
        options.push({
          value: format(current, 'yyyy-MM'),
          label: format(current, 'MMMM yyyy'),
        });
        current.setMonth(current.getMonth() - 1);
      }
      setMonthOptions(options);
    } catch (error) {
      console.error('Error fetching month range:', error);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) {
        params.append('month', selectedMonth);
      }
      if (attentionNeeds) {
        params.append('attention', 'needs');
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
        outstandingClients: 0,
      });
      setFundingSourceStats(result.fundingSourceStats || []);
    } catch (error) {
      console.error('Error fetching POs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, attentionNeeds]);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchFundingSources();
    fetchMonthRange();
  }, [fetchPurchaseOrders, fetchFundingSources, fetchMonthRange]);

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

  const handleReminder = async (po: PurchaseOrder) => {
    const coordinatorName = po.coordinator?.full_name?.trim();
    if (!coordinatorName) {
      toast({
        title: 'No coordinator assigned',
        description: 'Assign a coordinator before sending a reminder.',
        variant: 'destructive',
      });
      return;
    }

    setRemindingPoId(po.id);
    const supabase = createClient();
    try {
      const { error } = await supabase.functions.invoke('po-reminder', {
        body: { po_id: po.id },
      });
      if (error) throw error;
      toast({
        title: `Reminder sent to ${coordinatorName}`,
      });
    } catch (error) {
      console.error('Error sending PO reminder:', error);
      toast({
        title: 'Failed to send reminder',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setRemindingPoId(null);
    }
  };

  const handleWarning = async (po: PurchaseOrder) => {
    setWarningPoId(po.id);
    const supabase = createClient();
    try {
      const { error } = await supabase.functions.invoke('po-warning', {
        body: { po_id: po.id },
      });
      if (error) throw error;
      toast({
        title: 'Warning sent to coordinator and parent',
      });
    } catch (error) {
      console.error('Error sending PO warning:', error);
      toast({
        title: 'Failed to send warning',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setWarningPoId(null);
    }
  };

  const handleNotesSave = async (poId: string) => {
    setSavingNotesId(poId);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ notes: editingNotesValue })
        .eq('id', poId);
      if (error) throw error;
      setNotesSavedId(poId);
      setTimeout(() => setNotesSavedId(null), 2000);
      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.id === poId ? { ...po, notes: editingNotesValue } : po
        )
      );
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Failed to save notes',
        variant: 'destructive',
      });
    } finally {
      setSavingNotesId(null);
      setEditingNotesId(null);
    }
  };

  const handleCellSave = async (poId: string, field: string, displayLabel: string) => {
    const key = `${field}:${poId}`;
    setSavingCell(key);
    const supabase = createClient();
    try {
      const val = field === 'sessions_authorized' ? parseInt(editCellValue, 10) : editCellValue;
      const { error } = await supabase
        .from('purchase_orders')
        .update({ [field]: val })
        .eq('id', poId);
      if (error) throw error;
      setPurchaseOrders((prev) =>
        prev.map((po) => {
          if (po.id !== poId) return po;
          if (field === 'sessions_authorized') return { ...po, sessions_authorized: val as number };
          if (field === 'status') return { ...po, status: val as string };
          if (field === 'start_date') return { ...po, start_date: val as string };
          if (field === 'end_date') return { ...po, end_date: val as string };
          if (field === 'authorization_number') return { ...po, authorization_number: val as string };
          return po;
        })
      );
      setSavedCell(key);
      setTimeout(() => setSavedCell(null), 2000);
      toast({ title: `${displayLabel} updated` });
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      toast({
        title: `Failed to update ${displayLabel}`,
        variant: 'destructive',
      });
    } finally {
      setSavingCell(null);
      setEditCell(null);
    }
  };

  const handlePOCancel = async (po: PurchaseOrder) => {
    setCancellingPo(true);
    const supabase = createClient();
    try {
      // Update PO status
      const { error: poError } = await supabase
        .from('purchase_orders')
        .update({ status: 'cancelled' })
        .eq('id', po.id);
      if (poError) throw poError;

      // Cancel future confirmed bookings for this swimmer
      if (po.swimmer?.id) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('swimmer_id', po.swimmer.id)
          .gte('session_date', new Date().toISOString().split('T')[0])
          .eq('status', 'confirmed');
        if (bookingError) throw bookingError;
      }

      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === po.id ? { ...p, status: 'cancelled' } : p))
      );
      toast({ title: 'PO cancelled' });
    } catch (error) {
      console.error('Error cancelling PO:', error);
      toast({
        title: 'Failed to cancel PO',
        variant: 'destructive',
      });
    } finally {
      setCancellingPo(false);
      setConfirmCancelPoId(null);
    }
  };

  const openCancelLessonModal = (po: PurchaseOrder) => {
    const bookings = getActiveLessonBookings(po);
    const firstId = bookings[0]?.booking_id ?? '';
    setPoForCancelLesson(po);
    setSelectedBookingId(firstId);
    setReason('');
    setCancelLessonModalOpen(true);
  };

  const handleCancelLesson = async () => {
    if (!poForCancelLesson || !selectedBookingId) return;

    setIsCancelling(true);
    const supabase = createClient();
    const trimmedReason = reason.trim();

    try {
      const { data, error } = await supabase.functions.invoke('po-cancel-lesson', {
        body: {
          po_id: poForCancelLesson.id,
          booking_id: selectedBookingId,
          ...(trimmedReason ? { reason: trimmedReason } : {}),
        },
      });

      if (error) throw error;

      if (
        data &&
        typeof data === 'object' &&
        'error' in data &&
        typeof (data as { error: unknown }).error === 'string' &&
        (data as { error: string }).error
      ) {
        throw new Error((data as { error: string }).error);
      }

      setCancelLessonModalOpen(false);
      setPoForCancelLesson(null);
      setSelectedBookingId('');
      setReason('');
      toast({
        title: 'Lesson cancelled and notifications sent',
      });
      await fetchPurchaseOrders();
    } catch (err) {
      console.error('Error cancelling lesson:', err);
      toast({
        title: 'Failed to cancel lesson',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
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
    if (attentionNeeds && !isPurchaseOrderNeedingAttention(po)) {
      return false;
    }
    const swimmerName = po.swimmer
      ? `${po.swimmer.first_name} ${po.swimmer.last_name}`.toLowerCase()
      : 'unassigned';
    const matchesSearch = searchTerm === '' ||
      swimmerName.includes(searchTerm.toLowerCase()) ||
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

    const matchesExhaustedFilter = !showExhausted || (
      po.sessions_authorized > 0 && po.sessions_used >= po.sessions_authorized
    );
    const todayForFilter = new Date();
    const matchesExpiringFilter = !showExpiring || (
      po.status === 'active' && !!po.end_date && (() => {
        const end = new Date(po.end_date);
        const d = Math.floor((end.getTime() - todayForFilter.getTime()) / 86400000);
        return d >= 0 && d <= 30;
      })()
    );

    return matchesSearch && matchesStatus && matchesBillingStatus && matchesPoType && matchesFundingSource && matchesSelectedFundingSource && matchesExhaustedFilter && matchesExpiringFilter;
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
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            {activeTab === 'purchase-orders' && (
              <Button size="sm" asChild>
                <Link href="/admin/pos/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create PO
                </Link>
              </Button>
            )}
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

      {/* Needs Attention Banner */}
      {(() => {
        const exhaustedCount = purchaseOrders.filter(
          (po) => po.sessions_authorized > 0 && po.sessions_used >= po.sessions_authorized
        ).length;
        const expiringCount = purchaseOrders.filter(
          (po) => po.status === 'active' && !!po.end_date && (() => {
            const d = Math.floor((new Date(po.end_date).getTime() - new Date().getTime()) / 86400000);
            return d >= 0 && d <= 30;
          })()
        ).length;
        if (exhaustedCount === 0 && expiringCount === 0) return null;
        return (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            {exhaustedCount > 0 && (
              <button
                onClick={() => { setShowExhausted(!showExhausted); setShowExpiring(false); }}
                className={`font-medium underline-offset-2 hover:underline ${showExhausted ? 'text-amber-700' : ''}`}
              >
                ⚠️ {exhaustedCount} {exhaustedCount === 1 ? 'client has' : 'clients have'} exhausted sessions
              </button>
            )}
            {exhaustedCount > 0 && expiringCount > 0 && <span className="text-amber-400">·</span>}
            {expiringCount > 0 && (
              <button
                onClick={() => { setShowExpiring(!showExpiring); setShowExhausted(false); }}
                className={`font-medium underline-offset-2 hover:underline ${showExpiring ? 'text-amber-700' : ''}`}
              >
                ⚠️ {expiringCount} {expiringCount === 1 ? 'PO expires' : 'POs expire'} within 30 days
              </button>
            )}
            {(showExhausted || showExpiring) && (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 ml-auto"
                onClick={() => { setShowExhausted(false); setShowExpiring(false); }}
              >
                Clear filter
              </Button>
            )}
          </div>
        );
      })()}

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
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-xs text-red-700">Awaiting New PO</div>
            <div className="text-2xl font-bold text-red-800">{stats.outstandingClients ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Funding Source Summary */}
      {/*
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
      */}
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
        <div className="overflow-x-auto rounded-lg border bg-white">
          {selectedFundingSource && (
            <div className="flex items-center justify-between mb-2 px-4 pt-4">
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
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 font-semibold text-left whitespace-nowrap">Swimmer</th>
                <th className="px-3 py-3 font-semibold text-left whitespace-nowrap">Type</th>
                <th className="px-3 py-3 font-semibold text-left whitespace-nowrap">Status</th>
                <th className="px-3 py-3 font-semibold text-left whitespace-nowrap">Auth #</th>
                <th className="px-3 py-3 font-semibold text-left whitespace-nowrap">Sessions</th>
                <th className="px-3 py-3 font-semibold text-left whitespace-nowrap">Dates</th>
                <th className="px-3 py-3 font-semibold text-left whitespace-nowrap">Notes</th>
                <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPOs.map((po) => {
                const badge = getStatusBadge(po);

                const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
                  green: { bg: 'bg-green-100 text-green-800 border-green-300', text: 'text-green-800', dot: 'bg-green-500' },
                  yellow: { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'text-yellow-800', dot: 'bg-yellow-500' },
                  red: { bg: 'bg-red-100 text-red-800 border-red-300', text: 'text-red-800', dot: 'bg-red-500' },
                };
                const bc = colorMap[badge.color] || colorMap.green;

                const pct = po.sessions_authorized > 0
                  ? Math.min(100, Math.round((po.sessions_used / po.sessions_authorized) * 100))
                  : 0;
                const progressColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-cyan-600';
                const isEditing = editingNotesId === po.id;

                return (
                  <tr key={po.id} className="group hover:bg-cyan-50 transition-colors">
                    {/* Swimmer */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {po.swimmer ? (
                        <div className="font-medium text-sm">
                          {po.swimmer.first_name} {po.swimmer.last_name}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">Unassigned</div>
                      )}
                    </td>
                    {/* Type */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">
                        {po.po_type === 'assessment' ? 'Assessment' : 'Lessons'}
                      </Badge>
                    </td>
                    {/* Status (inline editable) */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {editCell?.field === 'status' && editCell?.poId === po.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={editCellValue}
                            onChange={(e) => setEditCellValue(e.target.value)}
                            autoFocus
                            onBlur={() => handleCellSave(po.id, 'status', 'Status')}
                          >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="pending">Pending</option>
                          </select>
                          {savingCell === `status:${po.id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                          ) : savedCell === `status:${po.id}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : null}
                        </div>
                      ) : (
                        <button
                          className="group/ed relative"
                          onClick={() => {
                            setEditCell({ field: 'status', poId: po.id });
                            setEditCellValue(po.status);
                          }}
                        >
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${bc.bg} ${bc.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${bc.dot}`} />
                            {badge.label}
                          </span>
                          <Pencil className="h-3 w-3 ml-1 inline-block opacity-0 group-hover/ed:opacity-100 transition-opacity text-gray-400" />
                        </button>
                      )}
                    </td>
                    {/* Auth # (inline editable) */}
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs text-gray-600">
                      {editCell?.field === 'authorization_number' && editCell?.poId === po.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            className="w-24 text-xs border rounded px-1.5 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={editCellValue}
                            onChange={(e) => setEditCellValue(e.target.value)}
                            onBlur={() => handleCellSave(po.id, 'authorization_number', 'Auth number')}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditCell(null);
                              if (e.key === 'Enter') handleCellSave(po.id, 'authorization_number', 'Auth number');
                            }}
                            autoFocus
                          />
                          {savingCell === `authorization_number:${po.id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400 shrink-0" />
                          ) : savedCell === `authorization_number:${po.id}` ? (
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                          ) : null}
                        </div>
                      ) : (
                        <button
                          className="group/ed relative flex items-center gap-1"
                          onClick={() => {
                            setEditCell({ field: 'authorization_number', poId: po.id });
                            setEditCellValue(po.authorization_number || '');
                          }}
                        >
                          <span>{po.authorization_number || <span className="text-gray-300">—</span>}</span>
                          <Pencil className="h-3 w-3 opacity-0 group-hover/ed:opacity-100 transition-opacity text-gray-400 shrink-0" />
                        </button>
                      )}
                    </td>
                    {/* Sessions (inline editable) */}
                    <td className="px-3 py-2.5 whitespace-nowrap min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium tabular-nums ${pct > 100 ? 'text-amber-600' : pct >= 100 ? 'text-red-600' : ''}`}>
                          {po.sessions_used}
                          <span className="text-gray-400"> / </span>
                          {editCell?.field === 'sessions_authorized' && editCell?.poId === po.id ? (
                            <span className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                className="w-14 text-xs border rounded px-1.5 py-0.5 text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                value={editCellValue}
                                onChange={(e) => setEditCellValue(e.target.value)}
                                onBlur={() => handleCellSave(po.id, 'sessions_authorized', 'Sessions authorized')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setEditCell(null);
                                  if (e.key === 'Enter') handleCellSave(po.id, 'sessions_authorized', 'Sessions authorized');
                                }}
                                autoFocus
                              />
                              {savingCell === `sessions_authorized:${po.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin text-gray-400 shrink-0" />
                              ) : savedCell === `sessions_authorized:${po.id}` ? (
                                <Check className="h-3 w-3 text-green-500 shrink-0" />
                              ) : null}
                            </span>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="group/ed inline relative"
                                  onClick={() => {
                                    setEditCell({ field: 'sessions_authorized', poId: po.id });
                                    setEditCellValue(String(po.sessions_authorized));
                                  }}
                                >
                                  <span className={`${pct > 100 ? 'text-amber-600 font-bold' : ''}`}>
                                    {po.sessions_authorized}
                                  </span>
                                  <Pencil className="h-3 w-3 ml-0.5 inline-block opacity-0 group-hover/ed:opacity-100 transition-opacity text-gray-400" />
                                </button>
                              </TooltipTrigger>
                              {pct > 100 && (
                                <TooltipContent side="top">
                                  Client attended more sessions than authorized — update PO or create new auth
                                </TooltipContent>
                              )}
                            </Tooltip>
                          )}
                        </span>
                      </div>
                      <div className="mt-1 w-24">
                        <div className="relative h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all ${pct > 100 ? 'bg-amber-500' : progressColor}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    {/* Dates (inline editable) */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-600">
                      <div className="flex items-center gap-0.5">
                        {/* Start date */}
                        {editCell?.field === 'start_date' && editCell?.poId === po.id ? (
                          <span className="inline-flex items-center gap-1">
                            <input
                              type="date"
                              className="w-28 text-xs border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              value={editCellValue}
                              onChange={(e) => setEditCellValue(e.target.value)}
                              onBlur={() => handleCellSave(po.id, 'start_date', 'Start date')}
                              onKeyDown={(e) => { if (e.key === 'Escape') setEditCell(null); }}
                              autoFocus
                            />
                            {savingCell === `start_date:${po.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin text-gray-400 shrink-0" />
                            ) : savedCell === `start_date:${po.id}` ? (
                              <Check className="h-3 w-3 text-green-500 shrink-0" />
                            ) : null}
                          </span>
                        ) : (
                          <button
                            className="group/ed relative hover:bg-gray-100 rounded px-0.5 -ml-0.5 transition"
                            onClick={() => {
                              setEditCell({ field: 'start_date', poId: po.id });
                              setEditCellValue(po.start_date ? po.start_date.slice(0, 10) : '');
                            }}
                          >
                            {po.start_date ? format(new Date(po.start_date), 'M/d/yy') : '—'}
                            <Pencil className="h-2.5 w-2.5 ml-0.5 inline-block opacity-0 group-hover/ed:opacity-100 transition-opacity text-gray-400" />
                          </button>
                        )}
                        <span className="text-gray-300 mx-0.5">→</span>
                        {/* End date */}
                        {editCell?.field === 'end_date' && editCell?.poId === po.id ? (
                          <span className="inline-flex items-center gap-1">
                            <input
                              type="date"
                              className="w-28 text-xs border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              value={editCellValue}
                              onChange={(e) => setEditCellValue(e.target.value)}
                              onBlur={() => handleCellSave(po.id, 'end_date', 'End date')}
                              onKeyDown={(e) => { if (e.key === 'Escape') setEditCell(null); }}
                              autoFocus
                            />
                            {savingCell === `end_date:${po.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin text-gray-400 shrink-0" />
                            ) : savedCell === `end_date:${po.id}` ? (
                              <Check className="h-3 w-3 text-green-500 shrink-0" />
                            ) : null}
                          </span>
                        ) : (
                          <button
                            className="group/ed relative hover:bg-gray-100 rounded px-0.5 -ml-0.5 transition"
                            onClick={() => {
                              setEditCell({ field: 'end_date', poId: po.id });
                              setEditCellValue(po.end_date ? po.end_date.slice(0, 10) : '');
                            }}
                          >
                            {po.end_date ? format(new Date(po.end_date), 'M/d/yy') : '—'}
                            <Pencil className="h-2.5 w-2.5 ml-0.5 inline-block opacity-0 group-hover/ed:opacity-100 transition-opacity text-gray-400" />
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Notes (inline editable) */}
                    <td className="px-3 py-2.5 max-w-[180px]">
                      {isEditing ? (
                        <div className="flex items-start gap-1">
                          <textarea
                            className="w-full text-xs border rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            rows={2}
                            value={editingNotesValue}
                            onChange={(e) => setEditingNotesValue(e.target.value)}
                            onBlur={() => handleNotesSave(po.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditingNotesId(null);
                            }}
                            autoFocus
                          />
                          {savingNotesId === po.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400 shrink-0 mt-1" />
                          ) : notesSavedId === po.id ? (
                            <Check className="h-3 w-3 text-green-500 shrink-0 mt-1" />
                          ) : null}
                        </div>
                      ) : (
                        <button
                          className="group/ed w-full text-left text-xs text-gray-600 truncate hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 transition flex items-center gap-1"
                          onClick={() => {
                            setEditingNotesId(po.id);
                            setEditingNotesValue(po.notes || '');
                          }}
                          title={po.notes || 'Click to add notes'}
                        >
                          <span className="truncate">
                            {(po.notes || '').length > 40
                              ? `${(po.notes || '').slice(0, 40)}…`
                              : (po.notes || <span className="text-gray-300 italic">Add notes</span>)}
                          </span>
                          <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover/ed:opacity-100 transition-opacity text-gray-400" />
                        </button>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {confirmCancelPoId === po.id ? (
                        <div className="flex items-center justify-center gap-1.5 text-xs">
                          <span className="text-gray-600 whitespace-nowrap">Cancel this PO?</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setConfirmCancelPoId(null)}
                            disabled={cancellingPo}
                          >
                            No
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handlePOCancel(po)}
                            disabled={cancellingPo}
                          >
                            {cancellingPo ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Confirm
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleReminder(po)}
                                disabled={remindingPoId === po.id}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 disabled:opacity-40 transition"
                              >
                                {remindingPoId === po.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Bell className="h-4 w-4" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Send reminder to coordinator</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleWarning(po)}
                                disabled={warningPoId === po.id}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 disabled:opacity-40 transition"
                              >
                                {warningPoId === po.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Send warning to coordinator &amp; parent</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => openApprovalDialog(po)}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">View / edit details</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setConfirmCancelPoId(po.id)}
                                disabled={cancellingPo}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 disabled:opacity-40 transition"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Cancel this PO</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

      <Dialog
        open={cancelLessonModalOpen}
        onOpenChange={(open) => {
          setCancelLessonModalOpen(open);
          if (!open) {
            setPoForCancelLesson(null);
            setSelectedBookingId('');
            setReason('');
            setIsCancelling(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel lesson</DialogTitle>
            <DialogDescription>
              Choose a booking to cancel for{' '}
              {poForCancelLesson?.swimmer?.first_name} {poForCancelLesson?.swimmer?.last_name}. Parents and
              staff will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cancel-booking">Booking</Label>
              <Select
                value={selectedBookingId}
                onValueChange={setSelectedBookingId}
                disabled={
                  !poForCancelLesson || getActiveLessonBookings(poForCancelLesson).length === 0
                }
              >
                <SelectTrigger id="cancel-booking" className="w-full min-w-0">
                  <SelectValue placeholder="Select a booking" />
                </SelectTrigger>
                <SelectContent>
                  {poForCancelLesson &&
                    getActiveLessonBookings(poForCancelLesson).map((b) => (
                      <SelectItem key={b.booking_id} value={b.booking_id}>
                        {formatLessonBookingLabel(b)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason (optional)</Label>
              <Input
                id="cancel-reason"
                placeholder="e.g. illness, schedule change…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isCancelling}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelLessonModalOpen(false)}
              disabled={isCancelling}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelLesson}
              disabled={!selectedBookingId || isCancelling}
            >
              {isCancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Cancel
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

export default function POSPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <POSPageContent />
    </Suspense>
  );
}