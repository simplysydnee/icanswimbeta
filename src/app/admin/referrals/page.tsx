'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Filter, CheckCircle, XCircle, Eye } from 'lucide-react';

type VmrcReferralRequest = Awaited<ReturnType<typeof apiClient.getVmrcReferrals>>[0];

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<VmrcReferralRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<VmrcReferralRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const allReferrals = await apiClient.getVmrcReferrals();
      setReferrals(allReferrals);
      setError(null);
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = referrals.filter(referral => {
    const matchesStatus = filterStatus === 'all' || referral.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      referral.child_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.coordinator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = async () => {
    if (!selectedReferral) return;

    setProcessing('approve');
    try {
      await apiClient.approveVmrcReferral(selectedReferral.id, 'admin-user-id', adminNotes);
      setApproveDialogOpen(false);
      setSelectedReferral(null);
      setAdminNotes('');
      await fetchReferrals();
    } catch (err) {
      console.error('Error approving referral:', err);
      setError('Failed to approve referral');
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async () => {
    if (!selectedReferral) return;

    setProcessing('decline');
    try {
      await apiClient.declineVmrcReferral(selectedReferral.id, 'admin-user-id', declineReason);
      setDeclineDialogOpen(false);
      setSelectedReferral(null);
      setDeclineReason('');
      await fetchReferrals();
    } catch (err) {
      console.error('Error declining referral:', err);
      setError('Failed to decline referral');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
      declined: { variant: 'destructive' as const, label: 'Declined' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading referrals...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">VMRC Referrals Management</CardTitle>
          <CardDescription>
            Review and manage VMRC coordinator referral requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by child name, parent, or coordinator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-[180px] border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>

          {/* Referrals List */}
          <div className="space-y-4">
            {filteredReferrals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No referrals found matching your criteria.
              </div>
            ) : (
              filteredReferrals.map((referral) => (
                <Card key={referral.id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{referral.child_name}</h3>
                        {getStatusBadge(referral.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Parent:</span> {referral.parent_name}
                        </div>
                        <div>
                          <span className="font-medium">Coordinator:</span> {referral.coordinator_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span> {new Date(referral.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Diagnosis:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {referral.diagnosis?.split(', ').map((d: string) => (
                            <span key={d} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReferral(referral)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {referral.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setApproveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setDeclineDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Referral Details Dialog */}
      <Dialog open={!!selectedReferral && !approveDialogOpen && !declineDialogOpen} onOpenChange={(open) => !open && setSelectedReferral(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedReferral && (
            <>
              <DialogHeader>
                <DialogTitle>Referral Details - {selectedReferral.child_name}</DialogTitle>
                <DialogDescription>
                  Submitted on {new Date(selectedReferral.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Section 1: Client Information */}
                <div>
                  <h3 className="font-semibold mb-3">Client Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Child Name</Label>
                      <p className="text-sm">{selectedReferral.child_name}</p>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <p className="text-sm">{selectedReferral.child_date_of_birth}</p>
                    </div>
                    <div>
                      <Label>Diagnosis</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedReferral.diagnosis?.split(', ').map((d: string) => (
                          <span key={d} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Parent Name</Label>
                      <p className="text-sm">{selectedReferral.parent_name}</p>
                    </div>
                    <div>
                      <Label>Parent Email</Label>
                      <p className="text-sm">{selectedReferral.parent_email}</p>
                    </div>
                    <div>
                      <Label>Parent Phone</Label>
                      <p className="text-sm">{selectedReferral.parent_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Medical Profile */}
                <div>
                  <h3 className="font-semibold mb-3">Medical & Physical Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Non-Ambulatory</Label>
                      <p className="text-sm">{selectedReferral.non_ambulatory}</p>
                    </div>
                    <div>
                      <Label>Seizure Disorder</Label>
                      <p className="text-sm">{selectedReferral.has_seizure_disorder}</p>
                    </div>
                    <div>
                      <Label>Height</Label>
                      <p className="text-sm">{selectedReferral.height || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Weight</Label>
                      <p className="text-sm">{selectedReferral.weight || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Toilet Trained</Label>
                      <p className="text-sm">{selectedReferral.toilet_trained}</p>
                    </div>
                    <div>
                      <Label>Medical Conditions</Label>
                      <p className="text-sm">{selectedReferral.has_medical_conditions}</p>
                      {selectedReferral.medical_conditions_description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedReferral.medical_conditions_description}</p>
                      )}
                    </div>
                    <div>
                      <Label>Allergies</Label>
                      <p className="text-sm">{selectedReferral.has_allergies}</p>
                      {selectedReferral.allergies_description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedReferral.allergies_description}</p>
                      )}
                    </div>
                    <div>
                      <Label>Other Therapies</Label>
                      <p className="text-sm">{selectedReferral.has_other_therapies}</p>
                      {selectedReferral.other_therapies_description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedReferral.other_therapies_description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Behavioral Information */}
                <div>
                  <h3 className="font-semibold mb-3">Behavioral & Safety Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Comfortable in Water</Label>
                      <p className="text-sm">{selectedReferral.comfortable_in_water}</p>
                    </div>
                    <div>
                      <Label>Self-Injurious Behavior</Label>
                      <p className="text-sm">{selectedReferral.self_injurious_behavior}</p>
                      {selectedReferral.self_injurious_description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedReferral.self_injurious_description}</p>
                      )}
                    </div>
                    <div>
                      <Label>Aggressive Behavior</Label>
                      <p className="text-sm">{selectedReferral.aggressive_behavior}</p>
                      {selectedReferral.aggressive_behavior_description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedReferral.aggressive_behavior_description}</p>
                      )}
                    </div>
                    <div>
                      <Label>Elopement Behavior</Label>
                      <p className="text-sm">{selectedReferral.elopement_behavior}</p>
                      {selectedReferral.elopement_description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedReferral.elopement_description}</p>
                      )}
                    </div>
                    <div>
                      <Label>Safety Plan</Label>
                      <p className="text-sm">{selectedReferral.has_safety_plan}</p>
                      {selectedReferral.safety_plan_description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedReferral.safety_plan_description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Referral Information */}
                <div>
                  <h3 className="font-semibold mb-3">Referral Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Referral Type</Label>
                      <p className="text-sm">{selectedReferral.referral_type}</p>
                    </div>
                    <div>
                      <Label>Coordinator Name</Label>
                      <p className="text-sm">{selectedReferral.coordinator_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Coordinator Email</Label>
                      <p className="text-sm">{selectedReferral.coordinator_email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Consent */}
                <div>
                  <h3 className="font-semibold mb-3">Consent & Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Photo Release</Label>
                      <p className="text-sm">{selectedReferral.photo_release}</p>
                    </div>
                    <div>
                      <Label>Liability Agreement</Label>
                      <p className="text-sm">{selectedReferral.liability_agreement ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedReferral.swimmer_photo_url && (
                      <div>
                        <Label>Photo URL</Label>
                        <p className="text-sm">{selectedReferral.swimmer_photo_url}</p>
                      </div>
                    )}
                    {selectedReferral.additional_info && (
                      <div className="col-span-2">
                        <Label>Additional Information</Label>
                        <p className="text-sm">{selectedReferral.additional_info}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedReferral.admin_notes && (
                  <div>
                    <h3 className="font-semibold mb-3">Admin Notes</h3>
                    <p className="text-sm">{selectedReferral.admin_notes}</p>
                  </div>
                )}

                {selectedReferral.decline_reason && (
                  <div>
                    <h3 className="font-semibold mb-3 text-red-600">Decline Reason</h3>
                    <p className="text-sm">{selectedReferral.decline_reason}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedReferral(null)}>
                  Close
                </Button>
                {selectedReferral.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        setApproveDialogOpen(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDeclineDialogOpen(true);
                      }}
                    >
                      Decline
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Referral</DialogTitle>
            <DialogDescription>
              Approve this referral and create a swimmer record for {selectedReferral?.child_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={!!processing}>
              {processing === 'approve' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Referral</DialogTitle>
            <DialogDescription>
              Decline this referral for {selectedReferral?.child_name}. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="decline_reason">Reason for Declining *</Label>
              <Textarea
                id="decline_reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason for declining this referral..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={!declineReason || !!processing}
            >
              {processing === 'decline' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Decline Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}