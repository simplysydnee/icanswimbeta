'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, Phone, User, Clock, DollarSign, AlertTriangle } from 'lucide-react';

interface ProblemCoordinator {
  coordinator_name: string;
  coordinator_email: string;
  swimmer_count: number;
  overdue_pos: number;
  avg_response_days: number;
  total_pending: number;
  total_overdue_balance_cents: number;
}

interface TopProblemCoordinatorsProps {
  className?: string;
  showTitle?: boolean;
  limit?: number;
}

export function TopProblemCoordinators({
  className = '',
  showTitle = true,
  limit = 5
}: TopProblemCoordinatorsProps) {
  const [coordinators, setCoordinators] = useState<ProblemCoordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProblemCoordinators();
  }, []);

  const fetchProblemCoordinators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/problem-coordinators');

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      setCoordinators(data.slice(0, limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching problem coordinators:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getSeverityLevel = (coordinator: ProblemCoordinator) => {
    const issues = [
      coordinator.overdue_pos > 0,
      coordinator.avg_response_days > 21,
      coordinator.total_overdue_balance_cents > 10000 // $100
    ].filter(Boolean).length;

    if (issues >= 3) return 'critical';
    if (issues >= 2) return 'high';
    return 'medium';
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'critical': return AlertCircle;
      case 'high': return AlertTriangle;
      case 'medium': return Clock;
      default: return AlertCircle;
    }
  };

  const handleEscalate = (coordinator: ProblemCoordinator) => {
    // In a real implementation, this would open a modal or send an API request
    const subject = `Escalation: ${coordinator.coordinator_name} - POS Authorization Issues`;
    const body = `Dear Supervisor,\n\nI am escalating the following issues with coordinator ${coordinator.coordinator_name}:\n\n` +
      `• ${coordinator.overdue_pos} overdue purchase orders (>14 days)\n` +
      `• Average response time: ${coordinator.avg_response_days.toFixed(1)} days\n` +
      `• Total overdue balance: ${formatCurrency(coordinator.total_overdue_balance_cents)}\n` +
      `• ${coordinator.total_pending} total pending POs\n\n` +
      `Please follow up with the coordinator at ${coordinator.coordinator_email}\n\n` +
      `Thank you,\nI Can Swim Team`;

    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleSendReminder = (coordinator: ProblemCoordinator) => {
    const subject = `Reminder: Pending Purchase Order Authorizations`;
    const body = `Dear ${coordinator.coordinator_name},\n\n` +
      `This is a friendly reminder about ${coordinator.total_pending} pending purchase order authorizations.\n\n` +
      `• ${coordinator.overdue_pos} are overdue (>14 days)\n` +
      `• Total overdue balance: ${formatCurrency(coordinator.total_overdue_balance_cents)}\n\n` +
      `Please provide authorization numbers at your earliest convenience.\n\n` +
      `Thank you,\nI Can Swim Team`;

    window.open(`mailto:${coordinator.coordinator_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            Loading Problem Coordinators...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            Error Loading Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchProblemCoordinators} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (coordinators.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-green-600" />
            No Problem Coordinators
          </CardTitle>
          <CardDescription>
            All coordinators are performing within acceptable parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p>No coordinators require escalation at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          {showTitle ? '⚠️ Coordinators Requiring Escalation' : 'Problem Coordinators'}
        </CardTitle>
        <CardDescription>
          {showTitle && 'Consider contacting supervisor if issues persist'}
          <div className="mt-2 text-sm">
            <Badge variant="destructive" className="mr-2">
              {coordinators.length} coordinators
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
              {coordinators.reduce((sum, c) => sum + c.overdue_pos, 0)} overdue POs
            </Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {coordinators.map((coordinator, index) => {
            const severity = getSeverityLevel(coordinator);
            const SeverityIcon = getSeverityIcon(severity);

            return (
              <div key={coordinator.coordinator_email} className="bg-white rounded-lg border border-red-100 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${getSeverityColor(severity).replace('border', 'bg').replace('text', 'text').split(' ')[0]}`}>
                      <SeverityIcon className="h-4 w-4" />
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {coordinator.coordinator_name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {coordinator.coordinator_email}
                      </div>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(severity)}>
                    {severity.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{coordinator.overdue_pos}</div>
                    <div className="text-xs text-muted-foreground">Overdue POs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{coordinator.avg_response_days.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Avg Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{coordinator.total_pending}</div>
                    <div className="text-xs text-muted-foreground">Pending POs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-700">{formatCurrency(coordinator.total_overdue_balance_cents)}</div>
                    <div className="text-xs text-muted-foreground">Overdue Balance</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminder(coordinator)}
                    className="text-xs"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Send Reminder
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleEscalate(coordinator)}
                    className="text-xs"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Escalate to Supervisor
                  </Button>
                  {coordinator.coordinator_email && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <a href={`mailto:${coordinator.coordinator_email}`}>
                        <Mail className="h-3 w-3 mr-1" />
                        Email Directly
                      </a>
                    </Button>
                  )}
                </div>

                {/* Issue Summary */}
                <div className="mt-3 text-sm text-gray-600">
                  <div className="font-medium mb-1">Issues:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {coordinator.overdue_pos > 0 && (
                      <li>{coordinator.overdue_pos} PO(s) pending for more than 14 days</li>
                    )}
                    {coordinator.avg_response_days > 14 && (
                      <li>Average response time of {coordinator.avg_response_days.toFixed(1)} days</li>
                    )}
                    {coordinator.total_overdue_balance_cents > 0 && (
                      <li>Overdue balance of {formatCurrency(coordinator.total_overdue_balance_cents)}</li>
                    )}
                    {coordinator.swimmer_count > 0 && (
                      <li>Manages {coordinator.swimmer_count} swimmer(s)</li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-red-200">
          <div className="text-sm text-red-700">
            <div className="font-medium mb-2">Summary of Issues:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="font-bold">{coordinators.reduce((sum, c) => sum + c.overdue_pos, 0)}</div>
                <div className="text-xs">Total Overdue POs</div>
              </div>
              <div>
                <div className="font-bold">
                  {formatCurrency(coordinators.reduce((sum, c) => sum + c.total_overdue_balance_cents, 0))}
                </div>
                <div className="text-xs">Total Overdue Balance</div>
              </div>
              <div>
                <div className="font-bold">
                  {(coordinators.reduce((sum, c) => sum + c.avg_response_days, 0) / coordinators.length).toFixed(1)}
                </div>
                <div className="text-xs">Avg Response Days</div>
              </div>
              <div>
                <div className="font-bold">{coordinators.reduce((sum, c) => sum + c.swimmer_count, 0)}</div>
                <div className="text-xs">Total Swimmers Affected</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for the check icon
function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
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