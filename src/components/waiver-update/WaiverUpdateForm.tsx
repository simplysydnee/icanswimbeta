'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LiabilityWaiverSection } from './sections';
import { PhotoPermissionSection } from './sections';
import { CancellationPolicySection } from './sections';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface WaiverUpdateFormProps {
  token: string;
  swimmerId: string;
  swimmerName: string;
  onComplete: () => void;
}

export function WaiverUpdateForm({
  token,
  swimmerId,
  swimmerName,
  onComplete
}: WaiverUpdateFormProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    liabilitySignature: '',
    photoPermission: false,
    photoSignature: '',
    cancellationSignature: ''
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/waivers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          swimmerId,
          ...formData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Waivers Updated Successfully!',
        description: `All waivers for ${swimmerName} have been saved.`
      });

      setTimeout(() => onComplete(), 2000);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const isValid =
    formData.liabilitySignature.length > 0 &&
    formData.cancellationSignature.length > 0 &&
    (!formData.photoPermission || formData.photoSignature.length > 0);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 1 of 3: Liability Waiver</h3>
        <LiabilityWaiverSection
          formData={{
            liabilityWaiverSignature: formData.liabilitySignature
          }}
          handleChange={(field, value) =>
            setFormData(prev => ({ ...prev, liabilitySignature: value }))
          }
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 2 of 3: Photo/Video Permission</h3>
        <PhotoPermissionSection
          formData={{
            photoVideoPermission: formData.photoPermission,
            photoVideoSignature: formData.photoSignature
          }}
          handleChange={(field, value) =>
            setFormData(prev => ({
              ...prev,
              [field === 'photoVideoPermission' ? 'photoPermission' : 'photoSignature']: value
            }))
          }
          handleCheckboxChange={(field, checked) =>
            setFormData(prev => ({ ...prev, photoPermission: checked }))
          }
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 3 of 3: Cancellation Policy</h3>
        <CancellationPolicySection
          formData={{
            cancellationPolicySignature: formData.cancellationSignature
          }}
          handleChange={(field, value) =>
            setFormData(prev => ({ ...prev, cancellationSignature: value }))
          }
        />
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          <strong>Electronic Signature Consent:</strong> By typing your name in the signature fields,
          you consent to using electronic signatures in lieu of handwritten signatures,
          in accordance with the ESIGN Act and applicable state laws.
        </p>
      </div>

      <Button
        onClick={() => updateMutation.mutate()}
        disabled={!isValid || updateMutation.isPending}
        className="w-full"
        size="lg"
      >
        {updateMutation.isPending ? 'Submitting...' : 'Submit All Waivers'}
      </Button>
    </div>
  );
}