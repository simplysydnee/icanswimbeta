'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  funding_source_id: string | null;
  funding_source?: {
    id: string;
    name: string;
    short_name: string;
  };
}

interface FundingSource {
  id: string;
  name: string;
  short_name: string;
  type: string;
}

interface CreatePODialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePODialog({ open, onClose, onSuccess }: CreatePODialogProps) {
  const [loading, setLoading] = useState(false);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [selectedSwimmer, setSelectedSwimmer] = useState<string>('');
  const [selectedFundingSource, setSelectedFundingSource] = useState<string>('');
  const [poType, setPOType] = useState<'assessment' | 'lessons'>('lessons');
  const [sessionsAuthorized, setSessionsAuthorized] = useState<number>(12);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addMonths(new Date(), 3));
  const [authorizationNumber, setAuthorizationNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<string>('pending');

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  // Auto-update funding source when swimmer selected
  useEffect(() => {
    if (selectedSwimmer) {
      const swimmer = swimmers.find(s => s.id === selectedSwimmer);
      if (swimmer?.funding_source_id) {
        setSelectedFundingSource(swimmer.funding_source_id);
      }
    }
  }, [selectedSwimmer, swimmers]);

  // Auto-update sessions and dates based on PO type
  useEffect(() => {
    if (poType === 'assessment') {
      setSessionsAuthorized(1);
      setEndDate(startDate);
    } else {
      setSessionsAuthorized(12);
      setEndDate(addMonths(startDate, 3));
    }
  }, [poType, startDate]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Fetch swimmers with funding sources
      const swimmersRes = await fetch('/api/swimmers?funded=true');
      const swimmersData = await swimmersRes.json();
      setSwimmers(swimmersData.data || []);

      // Fetch funding sources
      const fundingRes = await fetch('/api/funding-sources');
      const fundingData = await fundingRes.json();
      setFundingSources(fundingData.data?.filter((f: FundingSource) => f.type !== 'private_pay') || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSwimmer || !selectedFundingSource) {
      alert('Please select a swimmer and funding source');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swimmer_id: selectedSwimmer,
          funding_source_id: selectedFundingSource,
          po_type: poType,
          sub_code: poType === 'assessment' ? 'ASMT' : null,
          sessions_authorized: sessionsAuthorized,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          authorization_number: authorizationNumber || null,
          notes: notes || null,
          status: authorizationNumber ? 'active' : status
        })
      });

      if (response.ok) {
        onSuccess();
        resetForm();
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSwimmer('');
    setSelectedFundingSource('');
    setPOType('lessons');
    setSessionsAuthorized(12);
    setStartDate(new Date());
    setEndDate(addMonths(new Date(), 3));
    setAuthorizationNumber('');
    setNotes('');
    setStatus('pending');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Manually create a new purchase order for a funded swimmer.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* Swimmer Selection */}
            <div className="grid gap-2">
              <Label htmlFor="swimmer">Swimmer *</Label>
              <Select value={selectedSwimmer} onValueChange={setSelectedSwimmer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select swimmer" />
                </SelectTrigger>
                <SelectContent>
                  {swimmers.map((swimmer) => (
                    <SelectItem key={swimmer.id} value={swimmer.id}>
                      {swimmer.first_name} {swimmer.last_name}
                      {swimmer.funding_source?.short_name && ` (${swimmer.funding_source.short_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Funding Source */}
            <div className="grid gap-2">
              <Label htmlFor="funding">Funding Source *</Label>
              <Select value={selectedFundingSource} onValueChange={setSelectedFundingSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select funding source" />
                </SelectTrigger>
                <SelectContent>
                  {fundingSources.map((fs) => (
                    <SelectItem key={fs.id} value={fs.id}>
                      {fs.name} ({fs.short_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PO Type */}
            <div className="grid gap-2">
              <Label>PO Type *</Label>
              <Select value={poType} onValueChange={(v) => setPOType(v as 'assessment' | 'lessons')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assessment">Assessment (1 session)</SelectItem>
                  <SelectItem value="lessons">Lessons (12 sessions)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sessions Authorized */}
            <div className="grid gap-2">
              <Label>Sessions Authorized</Label>
              <Input
                type="number"
                value={sessionsAuthorized}
                onChange={(e) => setSessionsAuthorized(parseInt(e.target.value) || 1)}
                min={1}
                max={50}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Authorization Number */}
            <div className="grid gap-2">
              <Label>Authorization Number (optional)</Label>
              <Input
                placeholder="Enter auth number if available"
                value={authorizationNumber}
                onChange={(e) => setAuthorizationNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If provided, PO will be set to Active status
              </p>
            </div>

            {/* Status (only show if no auth number) */}
            {!authorizationNumber && (
              <div className="grid gap-2">
                <Label>Initial Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved_pending_auth">Approved (Pending Auth#)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingData}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}