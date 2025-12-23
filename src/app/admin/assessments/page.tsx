'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  User,
  Users,
  Search,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Assessment {
  id: string;
  session_id: string;
  swimmer_id: string;
  swimmer_name: string;
  swimmer_age: number;
  parent_name: string;
  parent_email: string;
  start_time: string;
  end_time: string;
  instructor_id: string;
  instructor_name: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  assessment_status: string;
  comfortable_in_water: string;
  current_level_id: string | null;
  current_level_name: string | null;
  payment_type: 'private_pay' | 'funded' | 'scholarship' | 'other';
  is_funded_client: boolean;
  funding_source_name?: string;
  coordinator_name?: string;
}

export default function AdminAssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessments');
      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }
      const data = await response.json();
      setAssessments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        assessment.swimmer_name.toLowerCase().includes(query) ||
        assessment.parent_name.toLowerCase().includes(query) ||
        assessment.instructor_name.toLowerCase().includes(query) ||
        assessment.location.toLowerCase().includes(query)
      );
    }

    // Filter by tab
    if (activeTab === 'scheduled') {
      return assessment.status === 'scheduled';
    } else if (activeTab === 'completed') {
      return assessment.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return assessment.status === 'cancelled';
    }

    return true;
  });

  const handleCompleteAssessment = (assessmentId: string) => {
    // This will open the completion modal
    window.location.href = `/admin/assessments/complete?id=${assessmentId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeLabel = (paymentType: string, isFunded: boolean) => {
    if (isFunded) return 'Funded';
    switch (paymentType) {
      case 'private_pay':
        return 'Private Pay';
      case 'funded':
        return 'Funded';
      case 'scholarship':
        return 'Scholarship';
      default:
        return 'Other';
    }
  };

  const getPaymentTypeColor = (paymentType: string, isFunded: boolean) => {
    if (isFunded) return 'bg-purple-100 text-purple-800';
    switch (paymentType) {
      case 'private_pay':
        return 'bg-blue-100 text-blue-800';
      case 'funded':
        return 'bg-purple-100 text-purple-800';
      case 'scholarship':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'instructor']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment Management</h1>
            <p className="text-muted-foreground">
              View and complete swimmer assessments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : assessments.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                All time
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : assessments.filter(a => a.status === 'scheduled').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Ready to complete
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : assessments.filter(a => a.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                This month
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Funded Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : assessments.filter(a => a.is_funded_client).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Need PO creation
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search swimmers, parents, instructors..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button variant="outline" onClick={fetchAssessments} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No assessments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {assessment.swimmer_name}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              ({assessment.swimmer_age} years)
                            </span>
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                            {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(assessment.payment_type, assessment.is_funded_client)}`}>
                            {getPaymentTypeLabel(assessment.payment_type, assessment.is_funded_client)}
                          </span>
                          {assessment.is_funded_client && assessment.funding_source_name && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              {assessment.funding_source_name}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Date & Time</span>
                            </div>
                            <div>
                              {format(new Date(assessment.start_time), 'MMM d, yyyy')} •{' '}
                              {format(new Date(assessment.start_time), 'h:mm a')} -{' '}
                              {format(new Date(assessment.end_time), 'h:mm a')}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Instructor</span>
                            </div>
                            <div>{assessment.instructor_name}</div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>Parent</span>
                            </div>
                            <div>{assessment.parent_name}</div>
                            <div className="text-xs text-muted-foreground">{assessment.parent_email}</div>
                          </div>
                        </div>

                        {assessment.comfortable_in_water && (
                          <div className="mt-3 text-sm">
                            <span className="text-muted-foreground">Water comfort: </span>
                            <span className="font-medium">{assessment.comfortable_in_water}</span>
                          </div>
                        )}

                        {assessment.current_level_name && (
                          <div className="mt-1 text-sm">
                            <span className="text-muted-foreground">Current level: </span>
                            <span className="font-medium">{assessment.current_level_name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {assessment.status === 'scheduled' && (
                          <Button
                            onClick={() => handleCompleteAssessment(assessment.id)}
                            className="w-full md:w-auto"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Assessment
                          </Button>
                        )}
                        <Button variant="outline" className="w-full md:w-auto">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}