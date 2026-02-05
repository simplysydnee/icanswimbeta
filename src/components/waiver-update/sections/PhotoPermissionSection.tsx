import React from 'react';

interface PhotoPermissionSectionProps {
  formData: {
    photoVideoPermission: boolean;
    photoVideoSignature: string;
  };
  handleChange: (field: string, value: string) => void;
  handleCheckboxChange: (field: string, checked: boolean) => void;
}

export function PhotoPermissionSection({
  formData,
  handleChange,
  handleCheckboxChange
}: PhotoPermissionSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Photo/Video Release</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Not Granted
        </span>
      </div>
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="photoPermission"
          name="photoPermission"
          checked={formData.photoVideoPermission}
          onChange={(e) => handleCheckboxChange('photoVideoPermission', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="photoPermission" className="ml-2 block text-sm text-gray-900">
          I grant permission for I Can Swim to use photos and videos of my child for
          promotional materials, social media, and educational purposes.
        </label>
      </div>
      {formData.photoVideoPermission && (
        <div>
          <label htmlFor="photoSignature" className="block text-sm font-medium text-gray-700 mb-2">
            Your Full Name (Electronic Signature)
          </label>
          <input
            type="text"
            id="photoSignature"
            name="photoSignature"
            value={formData.photoVideoSignature}
            onChange={(e) => handleChange('photoVideoSignature', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Type your full name to sign"
            required
          />
        </div>
      )}
    </div>
  );
}