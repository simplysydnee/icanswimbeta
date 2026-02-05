import React from 'react';

interface LiabilityWaiverSectionProps {
  formData: {
    liabilityWaiverSignature: string;
  };
  handleChange: (field: string, value: string) => void;
}

export function LiabilityWaiverSection({ formData, handleChange }: LiabilityWaiverSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Liability Waiver</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Not Signed
        </span>
      </div>
      <p className="text-gray-600 mb-4">
        I understand and agree to the terms of the liability waiver. By signing below,
        I acknowledge the risks associated with swimming lessons and release I Can Swim
        from liability for injuries that may occur during lessons.
      </p>
      <div>
        <label htmlFor="liabilitySignature" className="block text-sm font-medium text-gray-700 mb-2">
          Your Full Name (Electronic Signature)
        </label>
        <input
          type="text"
          id="liabilitySignature"
          name="liabilitySignature"
          value={formData.liabilityWaiverSignature}
          onChange={(e) => handleChange('liabilityWaiverSignature', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Type your full name to sign"
          required
        />
      </div>
    </div>
  );
}