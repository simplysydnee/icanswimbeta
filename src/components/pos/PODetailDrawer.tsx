'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface PODetail {
  id: string;
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
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  swimmer: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    parent_id: string;
    parent?: {
      full_name: string;
      email: string;
      phone: string;
    };
  };
  funding_source: {
    id: string;
    name: string;
    short_name: string;
  };
  coordinator?: {
    id: string;
    full_name: string;
    email: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  approved_pending_auth: { label: 'Approved (Pending Auth#)', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle },
  active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-600 border-gray-300', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
};

interface PODetailDrawerProps {
  poId: string | null;
  open: boolean;
  onClose: () => void;
}

export function PODetailDrawer({ poId, open, onClose }: PODetailDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [po, setPO] = useState<PODetail | null>(null);

  useEffect(() => {
    if (open && poId) {
      fetchPODetails();
    }
  }, [open, poId]);

  const fetchPODetails = async () => {
    if (!poId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/pos/${poId}`);
      const { data } = await response.json();
      setPO(data);
    } catch (error) {
      console.error('Error fetching PO details:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = po ? STATUS_CONFIG[po.status] || STATUS_CONFIG.pending : STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM d, yyyy');
  const formatDateTime = (dateString: string) => format(new Date(dateString), 'MMM d, yyyy h:mm a');

  // Calculate progress percentage
  const progressPercent = po ? Math.round((po.sessions_used / po.sessions_authorized) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : po ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge className={`${statusConfig.color} border`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline">
                  {po.po_type === 'assessment' ? 'ASMT' : 'LESSONS'}
                </Badge>
              </div>
              <SheetTitle className="text-xl mt-2">
                {po.swimmer?.first_name} {po.swimmer?.last_name}
              </SheetTitle>
              <SheetDescription>
                {po.funding_source?.name} • Created {formatDate(po.created_at)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Session Progress */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Session Progress
                </h3>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-cyan-600 h-3 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 text-center text-sm">
                    <div>
                      <div className="font-bold text-lg">{po.sessions_booked}</div>
                      <div className="text-muted-foreground">Booked</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-cyan-600">{po.sessions_used}</div>
                      <div className="text-muted-foreground">Used</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{po.sessions_authorized}</div>
                      <div className="text-muted-foreground">Authorized</div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    {po.sessions_authorized - po.sessions_booked} sessions remaining to book
                  </div>
                </div>
              </div>

              {/* Authorization Details */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Authorization Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auth Number:</span>
                    <span className="font-medium">
                      {po.authorization_number || <span className="text-orange-600">Pending</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span>{formatDate(po.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span>{formatDate(po.end_date)}</span>
                  </div>
                  {po.sub_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sub Code:</span>
                      <span>{po.sub_code}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Swimmer Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Swimmer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{po.swimmer?.first_name} {po.swimmer?.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DOB:</span>
                    <span>{po.swimmer?.date_of_birth ? formatDate(po.swimmer.date_of_birth) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              {po.swimmer?.parent && (
                <div>
                  <h3 className="font-semibold mb-3">Parent/Guardian</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{po.swimmer.parent.full_name}</span>
                    </div>
                    {po.swimmer.parent.email && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Email:</span>
                        <a href={`mailto:${po.swimmer.parent.email}`} className="text-cyan-600 hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {po.swimmer.parent.email}
                        </a>
                      </div>
                    )}
                    {po.swimmer.parent.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Phone:</span>
                        <a href={`tel:${po.swimmer.parent.phone}`} className="text-cyan-600 hover:underline flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {po.swimmer.parent.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Coordinator Info */}
              {po.coordinator && (
                <div>
                  <h3 className="font-semibold mb-3">Coordinator</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{po.coordinator.full_name}</span>
                    </div>
                    {po.coordinator.email && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Email:</span>
                        <a href={`mailto:${po.coordinator.email}`} className="text-cyan-600 hover:underline">
                          {po.coordinator.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Lesson History */}
              {po.lesson_dates && po.lesson_dates.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Lesson History ({po.lesson_dates.length} attended)
                  </h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {po.lesson_dates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm py-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Lesson {index + 1}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{formatDate(date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {po.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3">
                    {po.notes}
                  </p>
                </div>
              )}

              {/* Cancellation Reason */}
              {po.status === 'cancelled' && po.cancellation_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h3 className="font-semibold mb-1 text-red-800">Cancellation Reason</h3>
                  <p className="text-sm text-red-700">{po.cancellation_reason}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground pt-4 border-t">
                <div>Created: {formatDateTime(po.created_at)}</div>
                <div>Last Updated: {formatDateTime(po.updated_at)}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Purchase order not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}