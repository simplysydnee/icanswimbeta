'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useToast } from '@/hooks/use-toast';

export default function ParentEditSwimmerPage() {
  const params = useParams();
  const router = useRouter();
  const swimmerId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [swimmer, setSwimmer] = useState<any>(null);

  useEffect(() => {
    fetchSwimmer();
  }, [swimmerId]);

  const fetchSwimmer = async () => {
    try {
      const response = await fetch(`/api/parent/swimmers/${swimmerId}`);
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
      router.push('/parent/swimmers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!swimmer) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/parent/swimmers/${swimmerId}`, {
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

      router.push(`/parent/swimmers/${swimmerId}`);
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

  if (loading) {
    return (
      <RoleGuard allowedRoles={['parent']}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </RoleGuard>
    );
  }

  if (!swimmer) {
    return (
      <RoleGuard allowedRoles={['parent']}>
        <div className="p-6">Swimmer not found</div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['parent']}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/parent/swimmers/${swimmerId}`}>
            <Button variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit {swimmer.first_name} {swimmer.last_name}</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact Information</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Update emergency contact information for {swimmer.first_name}. All other swimmer information must be updated by staff.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={swimmer.emergency_contact_name || ''}
                    onChange={(e) => setSwimmer({...swimmer, emergency_contact_name: e.target.value})}
                    placeholder="Full name"
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
                  <Label>Relationship to Swimmer</Label>
                  <Input
                    value={swimmer.emergency_contact_relationship || ''}
                    onChange={(e) => setSwimmer({...swimmer, emergency_contact_relationship: e.target.value})}
                    placeholder="e.g., Mother, Father, Grandparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <Link href={`/parent/swimmers/${swimmerId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </RoleGuard>
  );
}