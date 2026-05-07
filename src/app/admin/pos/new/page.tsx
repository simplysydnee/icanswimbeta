'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingButton } from '@/components/ui/loading-button';
import { cn } from '@/lib/utils';
import { getAllFundingSources, type FundingSource } from '@/lib/funding-utils';

type SwimmerOption = { id: string; fullName: string };

export default function AdminNewPOPage() {
  const router = useRouter();

  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [loadingFunding, setLoadingFunding] = useState(true);

  const [swimmerId, setSwimmerId] = useState('');
  const [swimmerLabel, setSwimmerLabel] = useState('');
  const [swimmerOpen, setSwimmerOpen] = useState(false);
  const [swimmerSearch, setSwimmerSearch] = useState('');
  const [swimmerOptions, setSwimmerOptions] = useState<SwimmerOption[]>([]);
  const [swimmersLoading, setSwimmersLoading] = useState(false);

  const [poType, setPoType] = useState<'assessment' | 'lesson'>('lesson');
  const [fundingSourceId, setFundingSourceId] = useState('');
  const [authorizationNumber, setAuthorizationNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessionsAuthorized, setSessionsAuthorized] = useState<number>(12);
  const [serviceCode, setServiceCode] = useState('');
  const [serviceSubcode, setServiceSubcode] = useState('');
  const [notes, setNotes] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingFunding(true);
      const list = await getAllFundingSources();
      if (!cancelled) {
        setFundingSources(list);
        setLoadingFunding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchEnrolledSwimmers = useCallback(async (search: string) => {
    setSwimmersLoading(true);
    try {
      const q = search.trim();
      if (q) {
        const params = new URLSearchParams({
          search: q,
          limit: '20',
          page: '1',
        });
        const res = await fetch(`/api/swimmers?${params}`);
        if (!res.ok) {
          setSwimmerOptions([]);
          return;
        }
        const data = await res.json();
        const rows = (data.swimmers || []) as {
          id: string;
          firstName: string;
          lastName: string;
        }[];
        setSwimmerOptions(
          rows.map((s) => ({
            id: s.id,
            fullName: `${s.firstName} ${s.lastName}`.trim(),
          }))
        );
        return;
      }

      const params = new URLSearchParams({
        status: 'enrolled',
        limit: '75',
        page: '1',
        sortBy: 'name',
        sortOrder: 'asc',
      });
      const res = await fetch(`/api/admin/swimmers?${params}`);
      if (!res.ok) {
        setSwimmerOptions([]);
        return;
      }
      const data = await res.json();
      const rows = (data.swimmers || []) as { id: string; fullName: string }[];
      setSwimmerOptions(rows.map((s) => ({ id: s.id, fullName: s.fullName })));
    } finally {
      setSwimmersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!swimmerOpen) return;
    const delay = swimmerSearch.trim() ? 300 : 0;
    const t = window.setTimeout(() => {
      fetchEnrolledSwimmers(swimmerSearch);
    }, delay);
    return () => window.clearTimeout(t);
  }, [swimmerOpen, swimmerSearch, fetchEnrolledSwimmers]);

  useEffect(() => {
    if (poType === 'assessment') {
      setSessionsAuthorized(1);
    } else {
      setSessionsAuthorized(12);
    }
  }, [poType]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};

    if (!swimmerId) err.swimmer_id = 'Select a swimmer';
    if (!poType) err.po_type = 'Select a PO type';
    if (!fundingSourceId) err.funding_source_id = 'Select a funding source';
    if (!startDate) err.start_date = 'Start date is required';
    if (!endDate) err.end_date = 'End date is required';

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (end < start) {
          err.end_date = 'End date must be on or after start date';
        } else if (poType === 'lesson' && end <= start) {
          err.end_date = 'End date must be after start date';
        }
      }
    }

    if (poType === 'lesson') {
      const n = Number(sessionsAuthorized);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
        err.sessions_authorized = 'Sessions authorized must be a whole number greater than 0';
      }
    }

    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        swimmer_id: swimmerId,
        po_type: poType,
        funding_source_id: fundingSourceId,
        authorization_number: authorizationNumber.trim() || null,
        start_date: startDate,
        end_date: endDate,
        sessions_authorized: poType === 'assessment' ? 1 : sessionsAuthorized,
        service_code: serviceCode.trim() || null,
        service_subcode: serviceSubcode.trim() || null,
        notes: notes.trim() || null,
      };

      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(typeof body.error === 'string' ? body.error : 'Failed to create purchase order');
        return;
      }

      setSuccess(true);
      window.setTimeout(() => {
        router.push('/admin/pos');
      }, 1500);
    } catch {
      setSubmitError('Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const selectSwimmer = (s: SwimmerOption) => {
    setSwimmerId(s.id);
    setSwimmerLabel(s.fullName);
    setSwimmerOpen(false);
    setSwimmerSearch('');
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert className="border-green-600/50 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100">
          <AlertTitle>Purchase Order created successfully</AlertTitle>
          <AlertDescription>Taking you back to Purchase Orders…</AlertDescription>
        </Alert>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
          <Link href="/admin/pos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Purchase Order</h1>
        <p className="text-muted-foreground mt-1">Manually add a funding authorization for an enrolled swimmer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PO details</CardTitle>
          <CardDescription>Required fields are marked with *</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Swimmer *</Label>
              <Popover
                open={swimmerOpen}
                onOpenChange={(open) => {
                  setSwimmerOpen(open);
                  if (open) setSwimmerSearch('');
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={swimmerOpen}
                    className={cn(
                      'w-full justify-between font-normal',
                      !swimmerId && 'text-muted-foreground'
                    )}
                  >
                    {swimmerId ? swimmerLabel : 'Search enrolled swimmers…'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Type to search…"
                      value={swimmerSearch}
                      onChange={(e) => setSwimmerSearch(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {swimmersLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : swimmerOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-2 py-4 text-center">No swimmers found</p>
                    ) : (
                      swimmerOptions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={cn(
                            'w-full flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent',
                            swimmerId === s.id && 'bg-accent'
                          )}
                          onClick={() => selectSwimmer(s)}
                        >
                          <Check
                            className={cn('h-4 w-4 shrink-0', swimmerId === s.id ? 'opacity-100' : 'opacity-0')}
                          />
                          <span className="truncate">{s.fullName}</span>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {fieldErrors.swimmer_id && (
                <p className="text-sm text-destructive">{fieldErrors.swimmer_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="po_type">PO type *</Label>
              <Select value={poType} onValueChange={(v) => setPoType(v as 'assessment' | 'lesson')}>
                <SelectTrigger id="po_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson">Lesson</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.po_type && <p className="text-sm text-destructive">{fieldErrors.po_type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth">Authorization number</Label>
              <Input
                id="auth"
                value={authorizationNumber}
                onChange={(e) => setAuthorizationNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Funding source *</Label>
              {loadingFunding ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading funding sources…
                </div>
              ) : (
                <Select value={fundingSourceId} onValueChange={setFundingSourceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select funding source" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundingSources.map((fs) => (
                      <SelectItem key={fs.id} value={fs.id}>
                        {fs.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {fieldErrors.funding_source_id && (
                <p className="text-sm text-destructive">{fieldErrors.funding_source_id}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white"
                />
                {fieldErrors.start_date && (
                  <p className="text-sm text-destructive">{fieldErrors.start_date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white"
                />
                {fieldErrors.end_date && (
                  <p className="text-sm text-destructive">{fieldErrors.end_date}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions">Sessions authorized *</Label>
              <Input
                id="sessions"
                type="number"
                min={1}
                step={1}
                disabled={poType === 'assessment'}
                value={sessionsAuthorized}
                onChange={(e) => setSessionsAuthorized(parseInt(e.target.value, 10) || 0)}
                className="bg-white"
              />
              {poType === 'assessment' && (
                <p className="text-xs text-muted-foreground">Assessments always use 1 session.</p>
              )}
              {fieldErrors.sessions_authorized && (
                <p className="text-sm text-destructive">{fieldErrors.sessions_authorized}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_code">Service code</Label>
                <Input
                  id="service_code"
                  value={serviceCode}
                  onChange={(e) => setServiceCode(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_subcode">Service subcode</Label>
                <Input
                  id="service_subcode"
                  value={serviceSubcode}
                  onChange={(e) => setServiceSubcode(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>

            {submitError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <LoadingButton type="submit" loading={submitting} loadingText="Creating…" disabled={loadingFunding}>
                Create purchase order
              </LoadingButton>
              <Button type="button" variant="outline" asChild disabled={submitting}>
                <Link href="/admin/pos">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
