'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { WaiverViewer } from '../WaiverViewer';
import { LEGAL_DOCUMENTS } from '@/constants/legal-text';

interface LiabilityWaiverSectionProps {
  formData: {
    liabilitySignature: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    liabilityConsent?: boolean;
  };
  handleChange: (field: string, value: string) => void;
  handleCheckboxChange?: (field: string, checked: boolean) => void;
}

export function LiabilityWaiverSection({ formData, handleChange, handleCheckboxChange }: LiabilityWaiverSectionProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Liability Waiver</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${formData.liabilitySignature
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'}`}>
            {formData.liabilitySignature ? 'Signed' : 'Not Signed'}
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
            View Full Liability Waiver Document
          </Button>
          <p className="text-gray-600 mb-4">
            <strong>Summary:</strong> I understand and agree to the terms of the liability waiver. By signing below,
            I acknowledge the risks associated with swimming lessons and release I Can Swim
            from liability for injuries that may occur during lessons. I also provide emergency contact information.
          </p>
        </div>

        {/* Emergency Contact Fields */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900">Emergency Contact Information</h4>
          <p className="text-sm text-gray-600">
            Please provide emergency contact details for {formData.emergencyContactName || 'your swimmer'}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="emergencyContactName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Emergency contact's full name"
                required
              />
            </div>

            <div>
              <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="(209) 555-1234"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Swimmer *
            </label>
            <input
              type="text"
              id="emergencyContactRelationship"
              name="emergencyContactRelationship"
              value={formData.emergencyContactRelationship}
              onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Parent, Guardian, Relative, etc."
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.liabilityConsent || false}
              onChange={(e) => handleCheckboxChange ? handleCheckboxChange('liabilityConsent', e.target.checked) : handleChange('liabilityConsent', e.target.checked.toString())}
              className="h-4 w-4 text-blue-600"
              required
            />
            <span className="ml-2 text-sm text-gray-700">
              I consent to use electronic signatures under the California Uniform Electronic Transactions Act (UETA)
              and understand this creates a legally binding waiver of liability.
            </span>
          </label>
        </div>

        {/* Signature Field */}
        <div>
          <label htmlFor="liabilitySignature" className="block text-sm font-medium text-gray-700 mb-2">
            Your Full Name (California Electronic Signature) *
          </label>
          <input
            type="text"
            id="liabilitySignature"
            name="liabilitySignature"
            value={formData.liabilitySignature}
            onChange={(e) => handleChange('liabilitySignature', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Type your full name to sign"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            By typing your name above, you electronically sign the full Liability Waiver document.
          </p>
        </div>
      </div>

      <WaiverViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={LEGAL_DOCUMENTS.LIABILITY_WAIVER.title}
        content={LEGAL_DOCUMENTS.LIABILITY_WAIVER.content}
      />
    </>
  );
}