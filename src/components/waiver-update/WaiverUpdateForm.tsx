'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

type WaiverFieldName =
  | 'liabilitySignature'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'emergencyContactRelationship'
  | 'liabilityConsent'
  | 'cancellationSignature'
  | 'cancellationAgreed'
  | 'photoSignature'
  | 'photoSignatureConsent';

type WaiverFormData = {
  liabilitySignature: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  liabilityConsent: boolean;
  photoPermission: boolean;
  photoSignature: string;
  photoSignatureConsent: boolean;
  cancellationSignature: string;
  cancellationAgreed: boolean;
};

export type WaiverFieldErrors = Partial<Record<WaiverFieldName, string>>;

function getWaiverErrors(data: WaiverFormData): WaiverFieldErrors {
  const errors: WaiverFieldErrors = {};

  if (data.liabilitySignature.length < 3) {
    errors.liabilitySignature = 'Please type your full name to sign (at least 3 characters)';
  }
  if (data.emergencyContactName.length < 2) {
    errors.emergencyContactName = 'Emergency contact name is required';
  }
  if (data.emergencyContactPhone.length < 10) {
    errors.emergencyContactPhone = 'Enter a valid phone number (at least 10 digits)';
  }
  if (data.emergencyContactRelationship.length < 2) {
    errors.emergencyContactRelationship = 'Relationship to swimmer is required';
  }
  if (data.liabilityConsent !== true) {
    errors.liabilityConsent = 'You must consent to the Liability Waiver to continue';
  }
  if (data.cancellationSignature.length < 3) {
    errors.cancellationSignature = 'Please type your full name to sign (at least 3 characters)';
  }
  if (data.cancellationAgreed !== true) {
    errors.cancellationAgreed = 'You must agree to the Cancellation Policy to continue';
  }
  if (data.photoPermission) {
    if (data.photoSignature.length < 3) {
      errors.photoSignature = 'Photo release signature is required (at least 3 characters)';
    }
    if (data.photoSignatureConsent !== true) {
      errors.photoSignatureConsent = 'You must consent to the electronic signature for the photo release';
    }
  }

  return errors;
}

export function WaiverUpdateForm({
  token,
  swimmerId,
  swimmerName,
  onComplete
}: WaiverUpdateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    // Liability Waiver
    liabilitySignature: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    liabilityConsent: false,

    // Photo Release
    photoPermission: false,
    photoSignature: '',
    photoSignatureConsent: false,

    // Cancellation Policy
    cancellationSignature: '',
    cancellationAgreed: false
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const requestBody = {
        token,
        swimmerId,
        liabilitySignature: formData.liabilitySignature,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        liabilityConsent: formData.liabilityConsent,
        photoPermission: formData.photoPermission,
        photoSignature: formData.photoPermission ? formData.photoSignature : undefined,
        photoSignatureConsent: formData.photoSignatureConsent,
        cancellationSignature: formData.cancellationSignature,
        cancellationAgreed: formData.cancellationAgreed
      };
      console.log('Sending waiver update request:', { ...requestBody, liabilitySignature: '[REDACTED]', photoSignature: '[REDACTED]', cancellationSignature: '[REDACTED]' });
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
          liabilityConsent: formData.liabilityConsent,
          photoPermission: formData.photoPermission,
          photoSignature: formData.photoPermission ? formData.photoSignature : undefined,
          photoSignatureConsent: formData.photoSignatureConsent,
          cancellationSignature: formData.cancellationSignature,
          cancellationAgreed: formData.cancellationAgreed
        })
      });

      console.log('Waiver update response status:', response.status, response.statusText);
      if (!response.ok) {
        const error = await response.json();
        console.error('Waiver update error response:', error);
        throw new Error(error.error || 'Update failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Waivers Updated Successfully!',
        description: `All waivers for ${swimmerName} have been saved.`
      });

      queryClient.invalidateQueries({ queryKey: ['swimmers-needing-waivers', token] });

      // Short delay to show success message, then navigate
      setTimeout(() => onComplete(), 500);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const [touched, setTouched] = useState<Partial<Record<WaiverFieldName, boolean>>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const allErrors = getWaiverErrors(formData);
  const isValid = Object.keys(allErrors).length === 0;

  const visibleErrors: WaiverFieldErrors = {};
  (Object.keys(allErrors) as WaiverFieldName[]).forEach(field => {
    if (touched[field]) {
      visibleErrors[field] = allErrors[field];
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 1 of 3: Liability Waiver</h3>
        <LiabilityWaiverSection
          formData={{
            liabilitySignature: formData.liabilitySignature,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            emergencyContactRelationship: formData.emergencyContactRelationship,
            liabilityConsent: formData.liabilityConsent
          }}
          handleChange={handleChange}
          handleCheckboxChange={handleCheckboxChange}
          errors={visibleErrors}
          onBlur={handleBlur}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 2 of 3: Photo/Video Permission</h3>
        <PhotoPermissionSection
          formData={{
            photoPermission: formData.photoPermission,
            photoSignature: formData.photoSignature,
            photoSignatureConsent: formData.photoSignatureConsent
          }}
          handleChange={handleChange}
          handleCheckboxChange={handleCheckboxChange}
          errors={visibleErrors}
          onBlur={handleBlur}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section 3 of 3: Cancellation Policy</h3>
        <CancellationPolicySection
          formData={{
            cancellationSignature: formData.cancellationSignature,
            cancellationAgreed: formData.cancellationAgreed
          }}
          handleChange={handleChange}
          handleCheckboxChange={handleCheckboxChange}
          errors={visibleErrors}
          onBlur={handleBlur}
        />
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800 mb-2">
          <strong>California Electronic Signature Consent:</strong>
        </p>
        <ul className="text-xs text-blue-800 list-disc pl-4 space-y-1">
          <li>By typing your name, you consent to electronic signatures under California UETA</li>
          <li>Your electronic signature is legally equivalent to a handwritten signature</li>
          <li>You may request paper copies at any time by contacting (209) 778-7877</li>
          <li>You may withdraw consent to electronic records by contacting us in writing</li>
          <li>Signed documents will be retained in our secure electronic records</li>
          <li>To sign electronically, you need a device with a web browser and internet connection</li>
        </ul>
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