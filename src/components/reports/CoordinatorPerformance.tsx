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
import { Mail, Phone, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface CoordinatorData {
  name: string;
  email: string;
  phone: string;
  totalPOs: number;
  completedAuth: number;
  pendingAuth: number;
  completionRate: number;
}

interface CoordinatorPerformanceProps {
  coordinators: Record<string, CoordinatorData>;
}

export function CoordinatorPerformance({ coordinators }: CoordinatorPerformanceProps) {
  const [selectedCoordinator, setSelectedCoordinator] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Convert coordinators object to array and sort by completion rate (descending)
  const coordinatorArray = Object.entries(coordinators)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.completionRate - a.completionRate);

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getCompletionRateIcon = (rate: number) => {
    if (rate >= 80) return CheckCircle;
    if (rate >= 50) return Clock;
    return AlertCircle;
  };

  const handleViewPending = (coordinatorId: string) => {
    setSelectedCoordinator(coordinatorId);
    setShowPendingModal(true);
  };

  const selectedCoordinatorData = selectedCoordinator
    ? coordinators[selectedCoordinator]
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Coordinator Performance</span>
            <div className="text-sm font-normal text-muted-foreground">
              {coordinatorArray.length} coordinators
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total POs</TableHead>
                  <TableHead>Auth Received</TableHead>
                  <TableHead>Auth Pending</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coordinatorArray.map((coordinator) => {
                  const CompletionIcon = getCompletionRateIcon(coordinator.completionRate);

                  return (
                    <TableRow key={coordinator.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          {coordinator.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {coordinator.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-gray-500" />
                              <a
                                href={`mailto:${coordinator.email}`}
                                className="text-blue-600 hover:underline"
                              >
                                {coordinator.email}
                              </a>
                            </div>
                          )}
                          {coordinator.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-gray-500" />
                              <a
                                href={`tel:${coordinator.phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {coordinator.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{coordinator.totalPOs}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          <span className="font-medium text-green-700">
                            {coordinator.completedAuth}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-yellow-600" />
                          <span className="font-medium text-yellow-700">
                            {coordinator.pendingAuth}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCompletionRateColor(coordinator.completionRate)}>
                          <CompletionIcon className="h-3 w-3 mr-1" />
                          {coordinator.completionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPending(coordinator.id)}
                          disabled={coordinator.pendingAuth === 0}
                        >
                          View Pending
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {coordinatorArray.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No coordinator data available for this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              </CardHeader>
              <CardContent>
                {coordinatorArray.length > 0 ? (
                  <div>
                    <div className="font-bold text-lg">{coordinatorArray[0].name}</div>
                    <div className="text-sm text-muted-foreground">
                      {coordinatorArray[0].completionRate}% completion rate
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Needs Follow-up</CardTitle>
              </CardHeader>
              <CardContent>
                {coordinatorArray.filter(c => c.completionRate < 50).length > 0 ? (
                  <div>
                    <div className="font-bold text-lg">
                      {coordinatorArray.filter(c => c.completionRate < 50).length} coordinators
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Below 50% completion rate
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">All above 50%</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Completion</CardTitle>
              </CardHeader>
              <CardContent>
                {coordinatorArray.length > 0 ? (
                  <div>
                    <div className="font-bold text-lg">
                      {Math.round(
                        coordinatorArray.reduce((sum, c) => sum + c.completionRate, 0) /
                        coordinatorArray.length
                      )}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Average across all coordinators
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Pending POs Modal */}
      <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Pending Authorization for {selectedCoordinatorData?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedCoordinatorData?.pendingAuth} purchase orders awaiting authorization
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="font-medium text-yellow-800">Follow-up Required</h4>
                  <p className="text-sm text-yellow-700">
                    Consider sending a reminder email or calling to request authorization numbers.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="text-sm text-muted-foreground">
                    {selectedCoordinatorData?.email && (
                      <div className="flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        <a
                          href={`mailto:${selectedCoordinatorData.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedCoordinatorData.email}
                        </a>
                      </div>
                    )}
                    {selectedCoordinatorData?.phone && (
                      <div className="flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        <a
                          href={`tel:${selectedCoordinatorData.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedCoordinatorData.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-x-2">
                  {selectedCoordinatorData?.email && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${selectedCoordinatorData.email}?subject=Authorization%20Request&body=Hello%20${selectedCoordinatorData.name}%2C%0A%0APlease%20provide%20authorization%20numbers%20for%20pending%20purchase%20orders.%0A%0AThank%20you%2C%0AI%20Can%20Swim%20Team`}>
                        Send Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">Performance Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total POs</div>
                  <div className="text-2xl font-bold">{selectedCoordinatorData?.totalPOs}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="text-2xl font-bold text-green-700">
                    {selectedCoordinatorData?.completedAuth}
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {selectedCoordinatorData?.pendingAuth}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {selectedCoordinatorData?.completionRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}