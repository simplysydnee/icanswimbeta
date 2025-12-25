'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  pay_rate_cents: number;
  employment_type: string;
}

interface EditPayRateModalProps {
  instructor: Instructor;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditPayRateModal({ instructor, open, onClose, onSaved }: EditPayRateModalProps) {
  const [payRate, setPayRate] = useState<string>((instructor.pay_rate_cents / 100).toString());
  const [employmentType, setEmploymentType] = useState<string>(instructor.employment_type);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);

      const payRateCents = Math.round(parseFloat(payRate) * 100);
      if (isNaN(payRateCents) || payRateCents < 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid pay rate',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`/api/team/${instructor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payRateCents,
          employmentType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update instructor');
      }

      toast({
        title: 'Success',
        description: 'Instructor pay rate updated successfully',
      });

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error updating instructor:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update instructor',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setPayRate((instructor.pay_rate_cents / 100).toString());
    setEmploymentType(instructor.employment_type);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Pay Rate</DialogTitle>
          <DialogDescription>
            Update pay rate and employment type for {instructor.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="instructor-name">Instructor</Label>
            <Input
              id="instructor-name"
              value={instructor.full_name}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-rate">Pay Rate ($/hour)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="pay-rate"
                type="number"
                step="0.01"
                min="0"
                value={payRate}
                onChange={(e) => setPayRate(e.target.value)}
                className="pl-8"
                placeholder="25.00"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Current: ${(instructor.pay_rate_cents / 100).toFixed(2)}/hour
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employment-type">Employment Type</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger id="employment-type">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}