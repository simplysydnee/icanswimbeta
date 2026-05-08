'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { WaiverViewer } from '../WaiverViewer';
import { LEGAL_DOCUMENTS } from '@/constants/legal-text';

interface CancellationPolicySectionProps {
  formData: {
    cancellationSignature: string;
    cancellationAgreed?: boolean;
  };
  handleChange: (field: string, value: string) => void;
  handleCheckboxChange?: (field: string, checked: boolean) => void;
  errors?: {
    cancellationSignature?: string;
    cancellationAgreed?: string;
  };
  onBlur?: (field: string) => void;
}

const baseInputClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
const inputClasses = (error?: string) =>
  `${baseInputClasses} ${error ? 'border-red-500' : 'border-gray-300'}`;

export function CancellationPolicySection({ formData, handleChange, handleCheckboxChange, errors = {}, onBlur }: CancellationPolicySectionProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Cancellation Policy</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${formData.cancellationSignature
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'}`}>
            {formData.cancellationSignature ? 'Agreed' : 'Review Required'}
          </span>
        </div>

        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setViewerOpen(true)}
            className="mb-4"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Full Cancellation Policy Document
          </Button>
          <p className="text-gray-600 mb-4">
            <strong>Summary:</strong> I understand and agree to the cancellation policy. I acknowledge that
            cancellations must be made at least 24 hours in advance through the parent portal or online.
            Late cancellations or no-calls/no-shows may result in drop of services.
          </p>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.cancellationAgreed || false}
              onChange={(e) => handleCheckboxChange ? handleCheckboxChange('cancellationAgreed', e.target.checked) : handleChange('cancellationAgreed', e.target.checked.toString())}
              aria-invalid={!!errors.cancellationAgreed}
              className={`h-4 w-4 text-blue-600 ${errors.cancellationAgreed ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
              required
            />
            <span className="ml-2 text-sm text-gray-700">
              I consent to use electronic signatures under the California Uniform Electronic Transactions Act (UETA) and agree to the Cancellation Policy terms above.
            </span>
          </label>
          {errors.cancellationAgreed && (
            <p className="text-red-500 text-sm mt-1">{errors.cancellationAgreed}</p>
          )}
        </div>

        <div>
          <label htmlFor="cancellationSignature" className="block text-sm font-medium text-gray-700 mb-2">
            Your Full Name (Electronic Signature) *
          </label>
          <input
            type="text"
            id="cancellationSignature"
            name="cancellationSignature"
            value={formData.cancellationSignature}
            onChange={(e) => handleChange('cancellationSignature', e.target.value)}
            onBlur={() => onBlur?.('cancellationSignature')}
            aria-invalid={!!errors.cancellationSignature}
            className={inputClasses(errors.cancellationSignature)}
            placeholder="Type your full name to sign"
            required
          />
          {errors.cancellationSignature && (
            <p className="text-red-500 text-sm mt-1">{errors.cancellationSignature}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            By typing your name above, you electronically agree to the full Cancellation Policy document.
          </p>
        </div>
      </div>

      <WaiverViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={LEGAL_DOCUMENTS.CANCELLATION_POLICY.title}
        content={LEGAL_DOCUMENTS.CANCELLATION_POLICY.content}
      />
    </>
  );
}