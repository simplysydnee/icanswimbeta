import React from 'react';

interface CancellationPolicySectionProps {
  formData: {
    cancellationPolicySignature: string;
  };
  handleChange: (field: string, value: string) => void;
}

export function CancellationPolicySection({ formData, handleChange }: CancellationPolicySectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Cancellation Policy</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Not Agreed
        </span>
      </div>
      <p className="text-gray-600 mb-4">
        I understand and agree to the cancellation policy. I acknowledge that
        cancellations must be made at least 24 hours in advance, and that missed
        sessions may still be charged according to the policy.
      </p>
      <div>
        <label htmlFor="cancellationSignature" className="block text-sm font-medium text-gray-700 mb-2">
          Your Full Name (Electronic Signature)
        </label>
        <input
          type="text"
          id="cancellationSignature"
          name="cancellationSignature"
          value={formData.cancellationPolicySignature}
          onChange={(e) => handleChange('cancellationPolicySignature', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Type your full name to sign"
          required
        />
      </div>
    </div>
  );
}