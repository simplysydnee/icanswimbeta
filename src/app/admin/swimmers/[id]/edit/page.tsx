'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function EditSwimmerPage() {
  const params = useParams();
  const router = useRouter();
  const swimmerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [swimmer, setSwimmer] = useState<any>(null);

  useEffect(() => {
    fetchSwimmer();
  }, [swimmerId]);

  const fetchSwimmer = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('swimmers')
      .select('*')
      .eq('id', swimmerId)
      .single();

    if (data) setSwimmer(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('swimmers')
      .update({
        first_name: swimmer.first_name,
        last_name: swimmer.last_name,
        date_of_birth: swimmer.date_of_birth,
        gender: swimmer.gender,
        // Add more fields as needed
      })
      .eq('id', swimmerId);

    if (!error) {
      router.push(`/admin/swimmers/${swimmerId}`);
    } else {
      alert('Failed to save');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </RoleGuard>
    );
  }

  if (!swimmer) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="p-6">Swimmer not found</div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/admin/swimmers/${swimmerId}`}>
            <Button variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit {swimmer.first_name} {swimmer.last_name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={swimmer.first_name || ''}
                  onChange={(e) => setSwimmer({...swimmer, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={swimmer.last_name || ''}
                  onChange={(e) => setSwimmer({...swimmer, last_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={swimmer.date_of_birth || ''}
                  onChange={(e) => setSwimmer({...swimmer, date_of_birth: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Input
                  value={swimmer.gender || ''}
                  onChange={(e) => setSwimmer({...swimmer, gender: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href={`/admin/swimmers/${swimmerId}`}>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}