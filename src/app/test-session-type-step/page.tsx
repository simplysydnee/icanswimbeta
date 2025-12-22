'use client';

import { useState } from 'react';
import { SessionTypeStep } from '@/components/booking/steps/SessionTypeStep';
import { SessionType } from '@/types/booking';

export default function TestSessionTypeStepPage() {
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [hasFundingSource, setHasFundingSource] = useState(false);
  const [fundingSourceName, setFundingSourceName] = useState('Funded');

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Session Type Step Test</h1>
          <p className="text-muted-foreground">
            Test the session type selection component for the booking wizard
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-lg border p-6">
              <SessionTypeStep
                selectedType={selectedType}
                hasFundingSource={hasFundingSource}
                fundingSourceName={fundingSourceName}
                isFlexibleSwimmer={false}
                onSelectType={setSelectedType}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold">Test Controls</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">Funding Source Status</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHasFundingSource(false)}
                    className={`px-3 py-1.5 text-sm rounded-md ${!hasFundingSource ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Private Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasFundingSource(true)}
                    className={`px-3 py-1.5 text-sm rounded-md ${hasFundingSource ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Authorized Client
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Funding Source Name</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFundingSourceName('Funded')}
                    className={`px-3 py-1.5 text-sm rounded-md ${fundingSourceName === 'Funded' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Funded
                  </button>
                  <button
                    type="button"
                    onClick={() => setFundingSourceName('Regional Center')}
                    className={`px-3 py-1.5 text-sm rounded-md ${fundingSourceName === 'Regional Center' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Regional Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setFundingSourceName('Insurance')}
                    className={`px-3 py-1.5 text-sm rounded-md ${fundingSourceName === 'Insurance' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Insurance
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Type</label>
                <div className="p-3 rounded-md bg-muted">
                  <code className="text-sm">
                    {selectedType ? `"${selectedType}"` : 'null'}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Price Display</label>
                <div className="p-3 rounded-md bg-muted">
                  <code className="text-sm">
                    {hasFundingSource ? `$0 - ${fundingSourceName} Funded` : '$75.00 per session'}
                  </code>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold">Component Props</h3>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">selectedType</h4>
                  <p className="text-sm text-muted-foreground">
                    Current selected session type: &apos;single&apos; | &apos;recurring&apos; | null
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">hasFundingSource</h4>
                  <p className="text-sm text-muted-foreground">
                    Boolean indicating if swimmer has a funding source
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">fundingSourceName</h4>
                  <p className="text-sm text-muted-foreground">
                    Name of the funding source (e.g., Funded, Regional Center)
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">isFlexibleSwimmer</h4>
                  <p className="text-sm text-muted-foreground">
                    Boolean indicating if swimmer has flexible status
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">onSelectType</h4>
                  <p className="text-sm text-muted-foreground">
                    Callback when user selects a session type
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}