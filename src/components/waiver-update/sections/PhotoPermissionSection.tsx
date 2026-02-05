'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { WaiverViewer } from '../WaiverViewer';
import { LEGAL_DOCUMENTS } from '@/constants/legal-text';

interface PhotoPermissionSectionProps {
  formData: {
    photoPermission: boolean;
    photoSignature: string;
  };
  handleChange: (field: string, value: string) => void;
  handleCheckboxChange: (field: string, checked: boolean) => void;
}

export function PhotoPermissionSection({
  formData,
  handleChange,
  handleCheckboxChange,
}: PhotoPermissionSectionProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  const handlePermissionChange = (value: boolean) => {
    handleCheckboxChange('photoPermission', value);
    // Clear signature if switching to "No"
    if (!value) {
      handleChange('photoSignature', '');
    }
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Photo/Video Release</h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            {formData.photoPermission ? 'Granted - Needs Signature' : 'Not Granted'}
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
            View Full Photo/Video Release Document
          </Button>
          <p className="text-gray-600 mb-4">
            <strong>Summary:</strong> This release grants permission for I Can Swim to use photos and videos of your child
            for promotional materials, social media, and educational purposes.
          </p>
        </div>

        {/* Yes/No Radio Buttons */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="radio"
                id="photoPermissionYes"
                name="photoPermission"
                checked={formData.photoPermission === true}
                onChange={() => handlePermissionChange(true)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="photoPermissionYes" className="ml-2 block text-sm text-gray-900">
                <span className="font-medium">Yes, I grant permission</span>
                <span className="text-gray-600 ml-1">- Photos/videos may be used for promotional purposes</span>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="photoPermissionNo"
                name="photoPermission"
                checked={formData.photoPermission === false}
                onChange={() => handlePermissionChange(false)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="photoPermissionNo" className="ml-2 block text-sm text-gray-900">
                <span className="font-medium">No, I do not grant permission</span>
                <span className="text-gray-600 ml-1">- Photos/videos will not be used</span>
              </label>
            </div>
          </div>
        </div>

        {/* Signature Field (only shown when permission is granted) */}
        {formData.photoPermission && (
          <div>
            <label htmlFor="photoSignature" className="block text-sm font-medium text-gray-700 mb-2">
              Your Full Name (Electronic Signature) *
            </label>
            <input
              type="text"
              id="photoSignature"
              name="photoSignature"
              value={formData.photoSignature}
              onChange={(e) => handleChange('photoSignature', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Type your full name to sign"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              By typing your name above, you electronically sign the Photo/Video Release document.
            </p>
          </div>
        )}

        {/* Display message when permission not granted */}
        {!formData.photoPermission && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mt-4">
            <p className="text-sm text-gray-700">
              <strong>No permission granted.</strong> Photos and videos of your child will not be used for promotional purposes.
            </p>
          </div>
        )}
      </div>

      <WaiverViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={LEGAL_DOCUMENTS.PHOTO_RELEASE.title}
        content={LEGAL_DOCUMENTS.PHOTO_RELEASE.content}
      />
    </>
  );
}