'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

function PoRenewalForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const swimmerId = params.swimmerId as string;
  const parentPoId = searchParams.get('parentPoId') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swimmerName, setSwimmerName] = useState('');
  const [fundingSourceName, setFundingSourceName] = useState<string | null>(null);
  const [defaultSessions, setDefaultSessions] = useState(12);
  const [parentSummary, setParentSummary] = useState<{
    sessionsUsed: number;
    sessionsAuthorized: number;
    endDate: string | null;
  } | null>(null);

  const [sessionsAuthorized, setSessionsAuthorized] = useState('12');
  const [goalsNextPo, setGoalsNextPo] = useState('');

  useEffect(() => {
    if (!parentPoId) {
      setError('Missing parentPoId in the URL.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/instructor/po-renewal?parentPoId=${encodeURIComponent(parentPoId)}`
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load renewal context');
        }
        setSwimmerName(json.swimmerName || '');
        setFundingSourceName(json.fundingSourceName);
        const def = json.defaults?.sessionsAuthorized ?? 12;
        setDefaultSessions(def);
        setSessionsAuthorized(String(def));
        if (json.parentPo?.swimmerId && json.parentPo.swimmerId !== swimmerId) {
          throw new Error('This renewal link does not match the swimmer in the URL.');
        }
        if (json.parentPo) {
          setParentSummary({
            sessionsUsed: json.parentPo.sessionsUsed ?? 0,
            sessionsAuthorized: json.parentPo.sessionsAuthorized ?? 0,
            endDate: json.parentPo.endDate ?? null,
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [parentPoId, swimmerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentPoId) return;
    const n = parseInt(sessionsAuthorized, 10);
    if (!Number.isFinite(n) || n < 1) {
      toast({
        title: 'Invalid quota',
        description: 'Enter a positive whole number for sessions authorized.',
        variant: 'destructive',
      });
      return;
    }
    if (goalsNextPo.trim().length < 3) {
      toast({
        title: 'Goals required',
        description: 'Please enter goals for the next PO period (at least a few words).',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/instructor/po-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPoId,
          sessionsAuthorized: n,
          goalsNextPo: goalsNextPo.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Submit failed');
      }
      toast({
        title: 'Renewal submitted',
        description: 'A new pending purchase order was created and coordinators were notified.',
      });
      setGoalsNextPo('');
      setSessionsAuthorized(String(defaultSessions));
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Submit failed',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl py-10 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl py-10 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/instructor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/instructor">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>PO renewal — {swimmerName || 'Swimmer'}</CardTitle>
          <CardDescription>
            {fundingSourceName ? `${fundingSourceName}. ` : ''}
            Submit a new pending purchase order for the next authorization period. Defaults come
            from the funding source (typically {defaultSessions} sessions); adjust if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parentSummary && (
            <div className="rounded-md bg-muted/50 p-3 text-sm mb-6 space-y-1">
              <p>
                <span className="font-medium">Current PO usage:</span>{' '}
                {parentSummary.sessionsUsed} / {parentSummary.sessionsAuthorized} sessions used
              </p>
              {parentSummary.endDate && (
                <p>
                  <span className="font-medium">Current PO end date:</span> {parentSummary.endDate}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sessionsAuthorized">New PO — sessions authorized (quota)</Label>
              <Input
                id="sessionsAuthorized"
                type="number"
                min={1}
                step={1}
                value={sessionsAuthorized}
                onChange={(e) => setSessionsAuthorized(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalsNextPo">Goals for the next PO period</Label>
              <Textarea
                id="goalsNextPo"
                value={goalsNextPo}
                onChange={(e) => setGoalsNextPo(e.target.value)}
                rows={6}
                required
                placeholder="Describe goals and focus for the next authorization period…"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit renewal (creates pending PO)'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InstructorPoRenewalPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-2xl py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PoRenewalForm />
    </Suspense>
  );
}
