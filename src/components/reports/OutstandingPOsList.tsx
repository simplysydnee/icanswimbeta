'use client';

import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Phone,
  User,
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
  ExternalLink,
  FileText
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

interface ProblemPO {
  id: string;
  swimmerName: string;
  coordinatorName: string;
  coordinatorEmail: string;
  coordinatorPhone: string;
  amountOwed: number;
  daysOverdue: number;
  fundingSourceName: string;
  status: string;
  billingStatus: string;
  dueDate: string | null;
}

interface OutstandingPOsListProps {
  problemPOs: ProblemPO[];
}

const BILLING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle },
  billed: { label: 'Billed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
};

export function OutstandingPOsList({ problemPOs }: OutstandingPOsListProps) {
  const [selectedPO, setSelectedPO] = useState<ProblemPO | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (po: ProblemPO) => {
    setSelectedPO(po);
    setShowDetailsModal(true);
  };

  const getDaysOverdueColor = (days: number) => {
    if (days === 0) return 'text-gray-600';
    if (days <= 7) return 'text-yellow-600';
    if (days <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDaysOverdueText = (days: number) => {
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day overdue';
    return `${days} days overdue`;
  };

  // Sort by days overdue (descending) and amount owed (descending)
  const sortedPOs = problemPOs ? [...problemPOs].sort((a, b) => {
    if (b.daysOverdue !== a.daysOverdue) {
      return b.daysOverdue - a.daysOverdue;
    }
    return b.amountOwed - a.amountOwed;
  }) : [];

  // Calculate totals
  const totalOutstanding = sortedPOs.reduce((sum, po) => sum + (po.amountOwed || 0), 0);
  const totalOverdue = sortedPOs
    .filter(po => po.billingStatus === 'overdue')
    .reduce((sum, po) => sum + (po.amountOwed || 0), 0);
  const totalDisputed = sortedPOs
    .filter(po => po.billingStatus === 'disputed')
    .reduce((sum, po) => sum + (po.amountOwed || 0), 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Outstanding Purchase Orders
            </span>
            <div className="text-sm font-normal text-muted-foreground">
              {sortedPOs.length} POs • ${totalOutstanding.toFixed(2)} total
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {sortedPOs.length} purchase orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                  Overdue Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${totalOverdue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {sortedPOs.filter(po => po.billingStatus === 'overdue').length} overdue POs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                  Disputed Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ${totalDisputed.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {sortedPOs.filter(po => po.billingStatus === 'disputed').length} disputed POs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* POs Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Swimmer</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Funding Source</TableHead>
                  <TableHead>Amount Owed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPOs.map((po) => {
                  const billingConfig = BILLING_STATUS_CONFIG[po.billingStatus] ||
                    { label: po.billingStatus, color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText };
                  const BillingIcon = billingConfig.icon;

                  return (
                    <TableRow key={po.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{po.swimmerName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{po.coordinatorName}</div>
                          {po.coordinatorEmail && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-gray-500" />
                              <a
                                href={`mailto:${po.coordinatorEmail}`}
                                className="text-blue-600 hover:underline truncate"
                                title={po.coordinatorEmail}
                              >
                                {po.coordinatorEmail}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          {po.fundingSourceName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-lg">
                          ${po.amountOwed.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={billingConfig.color}>
                          <BillingIcon className="h-3 w-3 mr-1" />
                          {billingConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {po.dueDate ? (
                            <>
                              <div className="flex items-center text-sm">
                                <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                                {format(parseISO(po.dueDate), 'MMM d, yyyy')}
                              </div>
                              {po.daysOverdue > 0 && (
                                <div className={`text-xs font-medium ${getDaysOverdueColor(po.daysOverdue)}`}>
                                  {getDaysOverdueText(po.daysOverdue)}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">No due date</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(po)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={`/admin/pos/${po.id}`}>
                              <FileText className="h-3 w-3 mr-1" />
                              View PO
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {sortedPOs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                        <h3 className="text-lg font-medium">No Outstanding POs</h3>
                        <p className="text-muted-foreground">
                          All purchase orders are up to date
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Follow-up Actions */}
          {sortedPOs.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Recommended Actions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Batch Reminders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800 mb-3">
                      Send email reminders to coordinators with overdue POs
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Compose Email
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-yellow-800 mb-3">
                      Call coordinators with POs overdue more than 30 days
                    </p>
                    <div className="text-xs text-yellow-700">
                      {sortedPOs.filter(po => po.daysOverdue > 30).length} POs need urgent attention
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PO Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              {selectedPO?.swimmerName} • {selectedPO?.fundingSourceName}
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              {/* Status Badges */}
              <div className="flex space-x-2">
                <Badge className={BILLING_STATUS_CONFIG[selectedPO.billingStatus]?.color || 'bg-gray-100'}>
                  {BILLING_STATUS_CONFIG[selectedPO.billingStatus]?.label || selectedPO.billingStatus}
                </Badge>
                <Badge variant="outline">
                  {selectedPO.status}
                </Badge>
              </div>

              {/* Amount Owed */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-red-700">Amount Owed</div>
                    <div className="text-2xl font-bold text-red-800">
                      ${selectedPO.amountOwed.toFixed(2)}
                    </div>
                  </div>
                  {selectedPO.daysOverdue > 0 && (
                    <div className="text-right">
                      <div className="text-sm text-red-700">Days Overdue</div>
                      <div className="text-2xl font-bold text-red-800">
                        {selectedPO.daysOverdue}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Coordinator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="font-medium">{selectedPO.coordinatorName}</div>
                      {selectedPO.coordinatorEmail && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-2 text-gray-500" />
                          <a
                            href={`mailto:${selectedPO.coordinatorEmail}`}
                            className="text-blue-600 hover:underline"
                          >
                            {selectedPO.coordinatorEmail}
                          </a>
                        </div>
                      )}
                      {selectedPO.coordinatorPhone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-2 text-gray-500" />
                          <a
                            href={`tel:${selectedPO.coordinatorPhone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {selectedPO.coordinatorPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Funding Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium">{selectedPO.fundingSourceName}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Due Date Information */}
              {selectedPO.dueDate && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Payment Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="font-medium">
                          {format(parseISO(selectedPO.dueDate), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      {selectedPO.daysOverdue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Days Overdue:</span>
                          <span className="font-medium text-red-600">
                            {selectedPO.daysOverdue} days
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button asChild className="flex-1">
                  <a href={`/admin/pos/${selectedPO.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Purchase Order
                  </a>
                </Button>
                {selectedPO.coordinatorEmail && (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${selectedPO.coordinatorEmail}?subject=Payment%20Reminder%20for%20PO%20${selectedPO.id}&body=Hello%20${selectedPO.coordinatorName}%2C%0A%0AThis%20is%20a%20reminder%20about%20the%20outstanding%20payment%20of%20%24${selectedPO.amountOwed.toFixed(2)}%20for%20${selectedPO.swimmerName}.%0A%0APlease%20let%20us%20know%20when%20we%20can%20expect%20payment.%0A%0AThank%20you%2C%0AI%20Can%20Swim%20Team`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reminder
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper component for CheckCircle
function CheckCircle(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}