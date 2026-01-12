'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useToast } from '@/hooks/use-toast';

export default function EditSwimmerPage() {
  const params = useParams();
  const router = useRouter();
  const swimmerId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [swimmer, setSwimmer] = useState<any>(null);
  const [fundingSources, setFundingSources] = useState<any[]>([]);
  const [swimLevels, setSwimLevels] = useState<any[]>([]);

  useEffect(() => {
    fetchSwimmer();
    fetchFundingSources();
    fetchSwimLevels();
  }, [swimmerId]);

  const fetchSwimmer = async () => {
    try {
      const response = await fetch(`/api/admin/swimmers/${swimmerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch swimmer');
      }
      const data = await response.json();
      setSwimmer(data.swimmer || data);
    } catch (error) {
      console.error('Error fetching swimmer:', error);
      toast({
        title: 'Error',
        description: 'Failed to load swimmer data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFundingSources = async () => {
    try {
      const response = await fetch('/api/admin/funding-sources');
      if (response.ok) {
        const data = await response.json();
        setFundingSources(data.fundingSources || []);
      }
    } catch (error) {
      console.error('Error fetching funding sources:', error);
    }
  };

  const fetchSwimLevels = async () => {
    try {
      const response = await fetch('/api/swim-levels');
      if (response.ok) {
        const data = await response.json();
        setSwimLevels(data.levels || []);
      }
    } catch (error) {
      console.error('Error fetching swim levels:', error);
    }
  };

  const handleSave = async () => {
    if (!swimmer?.first_name || !swimmer?.last_name || !swimmer?.date_of_birth) {
      toast({
        title: 'Validation Error',
        description: 'First name, last name, and date of birth are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/swimmers/${swimmerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swimmer),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast({
        title: 'Success',
        description: 'Swimmer updated successfully',
      });

      router.push(`/admin/swimmers/${swimmerId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      {loading ? (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : !swimmer ? (
        <div className="p-6">Swimmer not found</div>
      ) : (
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/admin/swimmers/${swimmerId}`}>
              <Button variant="ghost" size="icon" aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Edit {swimmer.first_name} {swimmer.last_name}</h1>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-8 gap-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="parent">Parent/Guardian</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="behavioral">Behavioral & Safety</TabsTrigger>
              <TabsTrigger value="swimming">Swimming</TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
              <TabsTrigger value="program">Program</TabsTrigger>
              <TabsTrigger value="notes">Internal Notes</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input
                        value={swimmer.first_name || ''}
                        onChange={(e) => setSwimmer({...swimmer, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input
                        value={swimmer.last_name || ''}
                        onChange={(e) => setSwimmer({...swimmer, last_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        value={swimmer.date_of_birth || ''}
                        onChange={(e) => setSwimmer({...swimmer, date_of_birth: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={swimmer.gender || ''}
                        onValueChange={(value) => setSwimmer({...swimmer, gender: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Height</Label>
                      <Input
                        value={swimmer.height || ''}
                        onChange={(e) => setSwimmer({...swimmer, height: e.target.value})}
                        placeholder="e.g., 4'2&quot;"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight</Label>
                      <Input
                        value={swimmer.weight || ''}
                        onChange={(e) => setSwimmer({...swimmer, weight: e.target.value})}
                        placeholder="e.g., 65 lbs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Parent/Guardian Information Tab */}
            <TabsContent value="parent">
              <Card>
                <CardHeader>
                  <CardTitle>Parent/Guardian Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parent First Name</Label>
                      <Input
                        value={swimmer.parent_first_name || ''}
                        onChange={(e) => setSwimmer({...swimmer, parent_first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Last Name</Label>
                      <Input
                        value={swimmer.parent_last_name || ''}
                        onChange={(e) => setSwimmer({...swimmer, parent_last_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Email</Label>
                      <Input
                        type="email"
                        value={swimmer.parent_email || ''}
                        onChange={(e) => setSwimmer({...swimmer, parent_email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Phone</Label>
                      <Input
                        value={swimmer.parent_phone || ''}
                        onChange={(e) => setSwimmer({...swimmer, parent_phone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Name</Label>
                      <Input
                        value={swimmer.emergency_contact_name || ''}
                        onChange={(e) => setSwimmer({...swimmer, emergency_contact_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Phone</Label>
                      <Input
                        value={swimmer.emergency_contact_phone || ''}
                        onChange={(e) => setSwimmer({...swimmer, emergency_contact_phone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact Relationship</Label>
                      <Input
                        value={swimmer.emergency_contact_relationship || ''}
                        onChange={(e) => setSwimmer({...swimmer, emergency_contact_relationship: e.target.value})}
                        placeholder="e.g., Mother, Father, Grandparent"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Medical Information Tab */}
            <TabsContent value="medical">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_allergies"
                        checked={swimmer.has_allergies || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, has_allergies: checked})}
                      />
                      <Label htmlFor="has_allergies">Has Allergies</Label>
                    </div>
                    {swimmer.has_allergies && (
                      <div className="space-y-2 pl-6">
                        <Label>Allergies Description</Label>
                        <Textarea
                          value={swimmer.allergies_description || ''}
                          onChange={(e) => setSwimmer({...swimmer, allergies_description: e.target.value})}
                          placeholder="Describe allergies and reactions"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_medical_conditions"
                        checked={swimmer.has_medical_conditions || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, has_medical_conditions: checked})}
                      />
                      <Label htmlFor="has_medical_conditions">Has Medical Conditions</Label>
                    </div>
                    {swimmer.has_medical_conditions && (
                      <div className="space-y-2 pl-6">
                        <Label>Medical Conditions Description</Label>
                        <Textarea
                          value={swimmer.medical_conditions_description || ''}
                          onChange={(e) => setSwimmer({...swimmer, medical_conditions_description: e.target.value})}
                          placeholder="Describe medical conditions"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="history_of_seizures"
                        checked={swimmer.history_of_seizures || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, history_of_seizures: checked})}
                      />
                      <Label htmlFor="history_of_seizures">History of Seizures</Label>
                    </div>
                    {swimmer.history_of_seizures && (
                      <div className="space-y-2 pl-6">
                        <Label>Seizure Protocol</Label>
                        <Textarea
                          value={swimmer.seizures_description || ''}
                          onChange={(e) => setSwimmer({...swimmer, seizures_description: e.target.value})}
                          placeholder="Describe seizure protocol and medications"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Diagnosis (comma-separated)</Label>
                    <Input
                      value={Array.isArray(swimmer.diagnosis) ? swimmer.diagnosis.join(', ') : swimmer.diagnosis || ''}
                      onChange={(e) => setSwimmer({...swimmer, diagnosis: e.target.value.split(',').map(d => d.trim()).filter(d => d)})}
                      placeholder="e.g., Autism, ADHD, Down Syndrome"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medications</Label>
                    <Textarea
                      value={swimmer.medications || ''}
                      onChange={(e) => setSwimmer({...swimmer, medications: e.target.value})}
                      placeholder="List current medications, dosages, and schedules"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="non_ambulatory"
                        checked={swimmer.non_ambulatory || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, non_ambulatory: checked})}
                      />
                      <Label htmlFor="non_ambulatory">Non-Ambulatory</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="toilet_trained"
                        checked={swimmer.toilet_trained || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, toilet_trained: checked})}
                      />
                      <Label htmlFor="toilet_trained">Toilet Trained</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavioral & Safety Tab */}
            <TabsContent value="behavioral">
              <Card>
                <CardHeader>
                  <CardTitle>Behavioral & Safety Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="self_injurious_behavior"
                        checked={swimmer.self_injurious_behavior || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, self_injurious_behavior: checked})}
                      />
                      <Label htmlFor="self_injurious_behavior">Self-Injurious Behavior</Label>
                    </div>
                    {swimmer.self_injurious_behavior && (
                      <div className="space-y-2 pl-6">
                        <Label>Self-Injurious Behavior Description</Label>
                        <Textarea
                          value={swimmer.self_injurious_behavior_description || ''}
                          onChange={(e) => setSwimmer({...swimmer, self_injurious_behavior_description: e.target.value})}
                          placeholder="Describe behavior, triggers, and interventions"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="aggressive_behavior"
                        checked={swimmer.aggressive_behavior || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, aggressive_behavior: checked})}
                      />
                      <Label htmlFor="aggressive_behavior">Aggressive Behavior</Label>
                    </div>
                    {swimmer.aggressive_behavior && (
                      <div className="space-y-2 pl-6">
                        <Label>Aggressive Behavior Description</Label>
                        <Textarea
                          value={swimmer.aggressive_behavior_description || ''}
                          onChange={(e) => setSwimmer({...swimmer, aggressive_behavior_description: e.target.value})}
                          placeholder="Describe behavior, triggers, and interventions"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="elopement_history"
                        checked={swimmer.elopement_history || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, elopement_history: checked})}
                      />
                      <Label htmlFor="elopement_history">Elopement History</Label>
                    </div>
                    {swimmer.elopement_history && (
                      <div className="space-y-2 pl-6">
                        <Label>Elopement Description</Label>
                        <Textarea
                          value={swimmer.elopement_history_description || ''}
                          onChange={(e) => setSwimmer({...swimmer, elopement_history_description: e.target.value})}
                          placeholder="Describe elopement history and safety measures"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_behavior_plan"
                        checked={swimmer.has_behavior_plan || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, has_behavior_plan: checked})}
                      />
                      <Label htmlFor="has_behavior_plan">Has Behavior Plan</Label>
                    </div>
                    {swimmer.has_behavior_plan && (
                      <div className="space-y-2 pl-6">
                        <Label>Behavior Plan Description</Label>
                        <Textarea
                          value={swimmer.behavior_plan_description || ''}
                          onChange={(e) => setSwimmer({...swimmer, behavior_plan_description: e.target.value})}
                          placeholder="Describe behavior plan and strategies"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Accommodations Needed</Label>
                    <Textarea
                      value={swimmer.accommodations_needed || ''}
                      onChange={(e) => setSwimmer({...swimmer, accommodations_needed: e.target.value})}
                      placeholder="Describe any accommodations needed for lessons"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Swimming Background Tab */}
            <TabsContent value="swimming">
              <Card>
                <CardHeader>
                  <CardTitle>Swimming Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="previous_swim_lessons"
                      checked={swimmer.previous_swim_lessons || false}
                      onCheckedChange={(checked) => setSwimmer({...swimmer, previous_swim_lessons: checked})}
                    />
                    <Label htmlFor="previous_swim_lessons">Previous Swim Lessons</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Comfort in Water</Label>
                    <Select
                      value={swimmer.comfortable_in_water || ''}
                      onValueChange={(value) => setSwimmer({...swimmer, comfortable_in_water: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select comfort level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified">Not Specified</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="very_high">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Swim Goals (comma-separated)</Label>
                    <Input
                      value={Array.isArray(swimmer.swim_goals) ? swimmer.swim_goals.join(', ') : swimmer.swim_goals || ''}
                      onChange={(e) => setSwimmer({...swimmer, swim_goals: e.target.value.split(',').map(g => g.trim()).filter(g => g)})}
                      placeholder="e.g., Water safety, Floating, Swimming independently"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Strengths & Interests</Label>
                    <Textarea
                      value={swimmer.strengths_interests || ''}
                      onChange={(e) => setSwimmer({...swimmer, strengths_interests: e.target.value})}
                      placeholder="Describe swimmer's strengths, interests, and motivators"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enrollment & Funding Tab */}
            <TabsContent value="enrollment">
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment & Funding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Enrollment Status</Label>
                      <Select
                        value={swimmer.enrollment_status || ''}
                        onValueChange={(value) => setSwimmer({...swimmer, enrollment_status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waitlist">Waitlist</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                          <SelectItem value="enrolled">Enrolled</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                          <SelectItem value="dropped">Dropped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Type</Label>
                      <Select
                        value={swimmer.payment_type || ''}
                        onValueChange={(value) => setSwimmer({...swimmer, payment_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private_pay">Private Pay</SelectItem>
                          <SelectItem value="funded">Funded</SelectItem>
                          <SelectItem value="scholarship">Scholarship</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {swimmer.payment_type === 'funded' && (
                      <div className="space-y-2">
                        <Label>Funding Source</Label>
                        <Select
                          value={swimmer.funding_source_id || ''}
                          onValueChange={(value) => setSwimmer({...swimmer, funding_source_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select funding source" />
                          </SelectTrigger>
                          <SelectContent>
                            {fundingSources.map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Coordinator Name</Label>
                      <Input
                        value={swimmer.coordinator_name || ''}
                        onChange={(e) => setSwimmer({...swimmer, coordinator_name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Coordinator Email</Label>
                      <Input
                        type="email"
                        value={swimmer.coordinator_email || ''}
                        onChange={(e) => setSwimmer({...swimmer, coordinator_email: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Coordinator Phone</Label>
                      <Input
                        value={swimmer.coordinator_phone || ''}
                        onChange={(e) => setSwimmer({...swimmer, coordinator_phone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Program Settings Tab */}
            <TabsContent value="program">
              <Card>
                <CardHeader>
                  <CardTitle>Program Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assessment Status</Label>
                      <Select
                        value={swimmer.assessment_status || ''}
                        onValueChange={(value) => setSwimmer({...swimmer, assessment_status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Current Level</Label>
                      <Select
                        value={swimmer.current_level_id || ''}
                        onValueChange={(value) => setSwimmer({...swimmer, current_level_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select swim level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Level</SelectItem>
                          {swimLevels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.display_name || level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="flexible_swimmer"
                        checked={swimmer.flexible_swimmer || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, flexible_swimmer: checked})}
                      />
                      <Label htmlFor="flexible_swimmer">Flexible Swimmer</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_priority"
                        checked={swimmer.is_priority_booking || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, is_priority_booking: checked})}
                      />
                      <Label htmlFor="is_priority">Priority Swimmer</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="photo_release"
                        checked={swimmer.photo_release || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, photo_release: checked})}
                      />
                      <Label htmlFor="photo_release">Photo Release Signed</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="waiver_signed"
                        checked={swimmer.signed_waiver || false}
                        onCheckedChange={(checked) => setSwimmer({...swimmer, signed_waiver: checked})}
                      />
                      <Label htmlFor="waiver_signed">Waiver Signed</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Internal Notes Tab */}
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes (Admin Only)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Admin Notes</Label>
                    <Textarea
                      value={swimmer.admin_notes || ''}
                      onChange={(e) => setSwimmer({...swimmer, admin_notes: e.target.value})}
                      placeholder="Internal notes for staff only"
                      rows={8}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-6">
            <Link href={`/admin/swimmers/${swimmerId}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}