'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Calendar,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

interface PurchaseOrder {
  id: string;
  po_type: 'assessment' | 'lessons';
  status: string;
  authorization_number: string | null;
  sessions_authorized: number;
  sessions_used: number;
  start_date: string;
  end_date: string;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  funding_source: {
    id: string;
    name: string;
    short_name: string;
  } | null;
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
}

const BILLING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  unbilled: { label: 'Unbilled', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText },
  billed: { label: 'Billed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle },
};

interface POBillingModalProps {
  po: PurchaseOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function POBillingModal({ po, open, onClose, onUpdate }: POBillingModalProps) {
  const [loading, setLoading] = useState(false);
  const [billingStatus, setBillingStatus] = useState('unbilled');
  const [billedAmount, setBilledAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billingNotes, setBillingNotes] = useState('');

  useEffect(() => {
    if (po) {
      setBillingStatus(po.billing_status || 'unbilled');
      setBilledAmount(po.billed_amount_cents ? (po.billed_amount_cents / 100).toString() : '');
      setPaidAmount(po.paid_amount_cents ? (po.paid_amount_cents / 100).toString() : '');
      setInvoiceNumber(po.invoice_number || '');
      setPaymentReference(po.payment_reference || '');
      setDueDate(po.due_date || '');
      setBillingNotes(po.billing_notes || '');
    }
  }, [po]);

  const handleMarkBilled = async () => {
    if (!po || !billedAmount) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/pos/${po.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_status: 'billed',
          billed_amount_cents: Math.round(parseFloat(billedAmount) * 100),
          billed_at: new Date().toISOString(),
          invoice_number: invoiceNumber || null,
          due_date: dueDate || null,
          billing_notes: billingNotes || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update PO');

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error marking as billed:', error);
      alert('Failed to update PO');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!po || !paidAmount) return;

    setLoading(true);
    try {
      const paidAmountCents = Math.round(parseFloat(paidAmount) * 100);
      const billedAmountCents = po.billed_amount_cents || 0;
      const newPaidAmountCents = (po.paid_amount_cents || 0) + paidAmountCents;

      const updateData: any = {
        paid_amount_cents: newPaidAmountCents,
        payment_reference: paymentReference || null,
        billing_notes: billingNotes || po.billing_notes || null,
      };

      // Update billing status based on payment
      if (newPaidAmountCents >= billedAmountCents) {
        updateData.billing_status = 'paid';
        updateData.paid_at = new Date().toISOString();
      } else if (newPaidAmountCents > 0) {
        updateData.billing_status = 'partial';
      }

      const response = await fetch(`/api/pos/${po.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Failed to update PO');

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to update PO');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOverdue = async () => {
    if (!po) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/pos/${po.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_status: 'overdue',
          billing_notes: billingNotes || po.billing_notes || 'Marked overdue',
        }),
      });

      if (!response.ok) throw new Error('Failed to update PO');

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error marking overdue:', error);
      alert('Failed to update PO');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!po) return;

    setLoading(true);
    try {
      const updateData: any = {
        billing_status: billingStatus,
        billing_notes: billingNotes || null,
      };

      if (billedAmount) {
        updateData.billed_amount_cents = Math.round(parseFloat(billedAmount) * 100);
      }

      if (paidAmount) {
        updateData.paid_amount_cents = Math.round(parseFloat(paidAmount) * 100);
      }

      if (invoiceNumber) {
        updateData.invoice_number = invoiceNumber;
      }

      if (paymentReference) {
        updateData.payment_reference = paymentReference;
      }

      if (dueDate) {
        updateData.due_date = dueDate;
      }

      const response = await fetch(`/api/pos/${po.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Failed to update PO');

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving billing info:', error);
      alert('Failed to update PO');
    } finally {
      setLoading(false);
    }
  };

  if (!po) return null;

  const billingConfig = BILLING_STATUS_CONFIG[po.billing_status] || BILLING_STATUS_CONFIG.unbilled;
  const BillingIcon = billingConfig.icon;
  const outstanding = (po.billed_amount_cents || 0) - (po.paid_amount_cents || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Management
          </DialogTitle>
          <DialogDescription>
            {po.swimmer?.first_name} {po.swimmer?.last_name} • {po.po_type} • {po.funding_source?.short_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Current Billing Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${billingConfig.color}`}>
                    <BillingIcon className="h-3 w-3 mr-1" />
                    {billingConfig.label}
                  </Badge>
                  {po.due_date && new Date(po.due_date) < new Date() && po.billing_status !== 'paid' && (
                    <Badge className="bg-red-100 text-red-800 border-red-300">
                      Past Due
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Amounts</div>
                <div className="space-y-1">
                  {po.billed_amount_cents > 0 && (
                    <div className="font-medium">${(po.billed_amount_cents / 100).toFixed(2)} billed</div>
                  )}
                  {po.paid_amount_cents > 0 && (
                    <div className={`${po.paid_amount_cents >= po.billed_amount_cents ? 'text-green-600' : 'text-yellow-600'}`}>
                      ${(po.paid_amount_cents / 100).toFixed(2)} paid
                    </div>
                  )}
                  {outstanding > 0 && (
                    <div className="text-red-600 font-medium">
                      ${(outstanding / 100).toFixed(2)} outstanding
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Billing Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Billing Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingStatus">Billing Status</Label>
                <Select value={billingStatus} onValueChange={setBillingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unbilled">Unbilled</SelectItem>
                    <SelectItem value="billed">Billed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billedAmount">Billed Amount ($)</Label>
                <Input
                  id="billedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={billedAmount}
                  onChange={(e) => setBilledAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidAmount">Paid Amount ($)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment Reference</Label>
                <Input
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Check #, Transaction ID, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingNotes">Billing Notes</Label>
              <Textarea
                id="billingNotes"
                value={billingNotes}
                onChange={(e) => setBillingNotes(e.target.value)}
                placeholder="Any notes about billing or payments..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="font-medium">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {po.billing_status !== 'billed' && po.billing_status !== 'paid' && (
                <Button
                  variant="outline"
                  onClick={handleMarkBilled}
                  disabled={loading || !billedAmount}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Mark as Billed
                </Button>
              )}

              {po.billing_status !== 'paid' && (
                <Button
                  variant="outline"
                  onClick={handleRecordPayment}
                  disabled={loading || !paidAmount}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}

              {po.billing_status !== 'overdue' && po.billing_status !== 'paid' && (
                <Button
                  variant="outline"
                  onClick={handleMarkOverdue}
                  disabled={loading}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Mark Overdue
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}