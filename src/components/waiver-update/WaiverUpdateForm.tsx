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
    // Liability Waiver
    liabilitySignature: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',

    // Photo Release
    photoPermission: false,
    photoSignature: '',

    // Cancellation Policy
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
          liabilitySignature: formData.liabilitySignature,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          emergencyContactRelationship: formData.emergencyContactRelationship,
          photoPermission: formData.photoPermission,
          photoSignature: formData.photoPermission ? formData.photoSignature : undefined,
          cancellationSignature: formData.cancellationSignature
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const isValid =
    // Liability Waiver: signature + all emergency contact fields
    formData.liabilitySignature.length > 0 &&
    formData.emergencyContactName.length > 0 &&
    formData.emergencyContactPhone.length > 0 &&
    formData.emergencyContactRelationship.length > 0 &&

    // Cancellation Policy: signature required
    formData.cancellationSignature.length > 0 &&

    // Photo Release: if permission granted, signature required
    (!formData.photoPermission || formData.photoSignature.length > 0);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 1 of 3: Liability Waiver</h3>
        <LiabilityWaiverSection
          formData={{
            liabilitySignature: formData.liabilitySignature,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            emergencyContactRelationship: formData.emergencyContactRelationship
          }}
          handleChange={handleChange}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 2 of 3: Photo/Video Permission</h3>
        <PhotoPermissionSection
          formData={{
            photoPermission: formData.photoPermission,
            photoSignature: formData.photoSignature
          }}
          handleChange={handleChange}
          handleCheckboxChange={handleCheckboxChange}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 3 of 3: Cancellation Policy</h3>
        <CancellationPolicySection
          formData={{
            cancellationSignature: formData.cancellationSignature
          }}
          handleChange={handleChange}
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