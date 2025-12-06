'use client';

import { useState } from 'react';
import { SessionTypeStep } from '@/components/booking/steps/SessionTypeStep';
import { SessionType } from '@/types/booking';

export default function TestSessionTypeStepPage() {
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [isVmrcClient, setIsVmrcClient] = useState(false);

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
                isVmrcClient={isVmrcClient}
                onSelectType={setSelectedType}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold">Test Controls</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">VMRC Client Status</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVmrcClient(false)}
                    className={`px-3 py-1.5 text-sm rounded-md ${!isVmrcClient ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Private Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVmrcClient(true)}
                    className={`px-3 py-1.5 text-sm rounded-md ${isVmrcClient ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    VMRC Client
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
                    {isVmrcClient ? '$0 - State Funded' : '$75.00 per session'}
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
                  <h4 className="text-sm font-medium mb-1">isVmrcClient</h4>
                  <p className="text-sm text-muted-foreground">
                    Boolean indicating if swimmer is VMRC-funded
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