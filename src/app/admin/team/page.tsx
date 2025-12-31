'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, DollarSign, Edit, Mail, Phone } from 'lucide-react';
import { EditPayRateModal } from '@/components/admin/EditPayRateModal';
import { useToast } from '@/hooks/use-toast';

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  pay_rate_cents: number;
  employment_type: string;
  created_at: string;
}

export default function TeamPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/team');
      if (!response.ok) {
        throw new Error('Failed to fetch team data');
      }
      const data = await response.json();
      setInstructors(data.instructors || []);
    } catch (error: any) {
      console.error('Error fetching team:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load team data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPayRate = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}/hr`;
  };

  const getEmploymentBadge = (type: string) => {
    const colors: Record<string, string> = {
      hourly: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      salary: 'bg-green-100 text-green-800 hover:bg-green-100',
      contractor: 'bg-purple-100 text-purple-800 hover:bg-purple-100'
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 hover:bg-gray-100'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading team data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Deprecation Notice */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">This page is being replaced</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>
                Team Management has been moved to the new Staff Management page which combines profile, payroll, and team display settings.
              </p>
              <p className="mt-1">
                <a href="/admin/staff" className="font-medium underline">
                  Go to Staff Management →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage instructor profiles and pay rates</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Pay Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructors.length > 0
                ? formatPayRate(
                    Math.round(
                      instructors.reduce((sum, i) => sum + i.pay_rate_cents, 0) / instructors.length
                    )
                  )
                : '$0.00/hr'
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hourly Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructors.filter(i => i.employment_type === 'hourly').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Instructors</CardTitle>
        </CardHeader>
        <CardContent>
          {instructors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No instructors found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Pay Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((instructor) => (
                  <TableRow key={instructor.id}>
                    <TableCell className="font-medium">{instructor.full_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" /> {instructor.email}
                        </span>
                        {instructor.phone && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" /> {instructor.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatPayRate(instructor.pay_rate_cents)}
                    </TableCell>
                    <TableCell>{getEmploymentBadge(instructor.employment_type)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingInstructor(instructor)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingInstructor && (
        <EditPayRateModal
          instructor={editingInstructor}
          open={!!editingInstructor}
          onClose={() => setEditingInstructor(null)}
          onSaved={fetchInstructors}
        />
      )}
    </div>
  );
}