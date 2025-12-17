'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { CreatePODialog } from '@/components/pos/CreatePODialog';
import { PODetailDrawer } from '@/components/pos/PODetailDrawer';

interface PurchaseOrder {
  id: string;
  swimmer_id: string;
  funding_source_id: string;
  coordinator_id: string | null;
  po_type: 'assessment' | 'lessons';
  sub_code: string | null;
  authorization_number: string | null;
  status: string;
  sessions_authorized: number;
  sessions_booked: number;
  sessions_used: number;
  lesson_dates: string[];
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
  };
  funding_source: {
    id: string;
    name: string;
    short_name: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved_pending_auth: { label: 'Approved (Pending Auth#)', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function CoordinatorPOSPage() {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCancelled, setShowCancelled] = useState(false);

  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    po: PurchaseOrder | null;
    authNumber: string;
    approveWithoutAuth: boolean;
  }>({
    open: false,
    po: null,
    authNumber: '',
    approveWithoutAuth: false
  });

  // Create PO dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Detail drawer state
  const [detailPOId, setDetailPOId] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/pos?${params.toString()}`);
      const { data } = await response.json();
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error fetching POs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalDialog.po) return;

    try {
      const response = await fetch(`/api/pos/${approvalDialog.po.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_number: approvalDialog.authNumber || undefined,
          approve_pending_auth: approvalDialog.approveWithoutAuth
        })
      });

      if (response.ok) {
        fetchPurchaseOrders();
        setApprovalDialog({ open: false, po: null, authNumber: '', approveWithoutAuth: false });
      }
    } catch (error) {
      console.error('Error approving PO:', error);
    }
  };

  const handleAddAuthNumber = async (poId: string, authNumber: string) => {
    try {
      const response = await fetch(`/api/pos/${poId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_number: authNumber,
          status: 'active'
        })
      });

      if (response.ok) {
        fetchPurchaseOrders();
      }
    } catch (error) {
      console.error('Error adding auth number:', error);
    }
  };

  // Filter and sort POs
  const filteredPOs = purchaseOrders
    .filter(po => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const swimmerName = `${po.swimmer?.first_name} ${po.swimmer?.last_name}`.toLowerCase();
        if (!swimmerName.includes(search)) return false;
      }
      // Hide cancelled unless toggled
      if (!showCancelled && po.status === 'cancelled') return false;
      return true;
    })
    .sort((a, b) => {
      // Sort order: pending > approved_pending_auth > active > completed > expired > cancelled
      const statusOrder = ['pending', 'approved_pending_auth', 'active', 'completed', 'expired', 'cancelled'];
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    });

  // Group POs by status for summary
  const pendingCount = purchaseOrders.filter(po => po.status === 'pending').length;
  const pendingAuthCount = purchaseOrders.filter(po => po.status === 'approved_pending_auth').length;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatDOB = (dateString: string) => {
    return format(new Date(dateString), 'MM/dd/yyyy');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Purchase Orders</h1>
        <p className="text-muted-foreground">Manage authorization requests for swim lessons</p>
      </div>

      {/* Alert Banners */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            {pendingCount} PENDING PURCHASE ORDER{pendingCount > 1 ? 'S' : ''} NEED APPROVAL
          </span>
        </div>
      )}

      {pendingAuthCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-orange-600" />
          <span className="font-medium text-orange-800">
            {pendingAuthCount} APPROVED PO{pendingAuthCount > 1 ? 'S' : ''} PENDING AUTHORIZATION NUMBER
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by swimmer name or DOB..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_all">Pending Approval</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved_pending_auth">Pending Auth#</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setShowCancelled(!showCancelled)}
          className={showCancelled ? 'bg-gray-100' : ''}
        >
          {showCancelled ? 'Hide' : 'Show'} Cancelled
        </Button>
        {user?.role === 'admin' && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        )}
      </div>

      {/* PO Cards */}
      {loading ? (
        <div className="text-center py-12">Loading purchase orders...</div>
      ) : filteredPOs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No purchase orders found
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPOs.map((po) => (
            <POCard
              key={po.id}
              po={po}
              onApprove={() => setApprovalDialog({ open: true, po, authNumber: '', approveWithoutAuth: false })}
              onAddAuthNumber={handleAddAuthNumber}
              onViewDetails={() => setDetailPOId(po.id)}
              formatDate={formatDate}
              formatDOB={formatDOB}
            />
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) =>
        setApprovalDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Order</DialogTitle>
            <DialogDescription>
              Approve this authorization request for{' '}
              {approvalDialog.po?.swimmer?.first_name} {approvalDialog.po?.swimmer?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Authorization Number</label>
              <Input
                placeholder="Enter authorization number..."
                value={approvalDialog.authNumber}
                onChange={(e) => setApprovalDialog(prev => ({
                  ...prev,
                  authNumber: e.target.value,
                  approveWithoutAuth: false
                }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="approveWithoutAuth"
                checked={approvalDialog.approveWithoutAuth}
                onChange={(e) => setApprovalDialog(prev => ({
                  ...prev,
                  approveWithoutAuth: e.target.checked,
                  authNumber: e.target.checked ? '' : prev.authNumber
                }))}
              />
              <label htmlFor="approveWithoutAuth" className="text-sm">
                Approve without authorization number (pending from finance)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() =>
              setApprovalDialog({ open: false, po: null, authNumber: '', approveWithoutAuth: false })
            }>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!approvalDialog.authNumber && !approvalDialog.approveWithoutAuth}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PO Dialog */}
      <CreatePODialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchPurchaseOrders}
      />

      {/* PO Detail Drawer */}
      <PODetailDrawer
        poId={detailPOId}
        open={!!detailPOId}
        onClose={() => setDetailPOId(null)}
      />
    </div>
  );
}

// PO Card Component
function POCard({
  po,
  onApprove,
  onAddAuthNumber,
  onViewDetails,
  formatDate,
  formatDOB
}: {
  po: PurchaseOrder;
  onApprove: () => void;
  onAddAuthNumber: (poId: string, authNumber: string) => void;
  onViewDetails: () => void;
  formatDate: (date: string) => string;
  formatDOB: (date: string) => string;
}) {
  const [authInput, setAuthInput] = useState('');
  const statusConfig = STATUS_CONFIG[po.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Swimmer Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-lg">
                {po.swimmer?.first_name} {po.swimmer?.last_name}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              DOB: {po.swimmer?.date_of_birth ? formatDOB(po.swimmer.date_of_birth) : 'N/A'}
            </div>
          </div>

          {/* Status & Type Badges */}
          <div className="flex items-center gap-2">
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <Badge variant="outline">
              {po.po_type === 'assessment' ? 'ASMT' : 'LESSONS'}
            </Badge>
            <Badge variant="secondary">
              {po.funding_source?.short_name || po.funding_source?.name}
            </Badge>
          </div>

          {/* Session Info */}
          <div className="text-sm">
            <div className="font-medium">
              {po.sessions_booked} booked / {po.sessions_used} used / {po.sessions_authorized} auth
            </div>
            {po.authorization_number && (
              <div className="text-muted-foreground">
                Auth#: {po.authorization_number}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(po.start_date)} - {formatDate(po.end_date)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {po.status === 'pending' && (
              <Button size="sm" onClick={onApprove}>
                Approve
              </Button>
            )}

            {po.status === 'approved_pending_auth' && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Auth#"
                  value={authInput}
                  onChange={(e) => setAuthInput(e.target.value)}
                  className="w-32 h-8"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    onAddAuthNumber(po.id, authInput);
                    setAuthInput('');
                  }}
                  disabled={!authInput}
                >
                  Add
                </Button>
              </div>
            )}

            {(po.status === 'active' || po.status === 'completed') && (
              <Button size="sm" variant="outline" onClick={onViewDetails}>
                Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}