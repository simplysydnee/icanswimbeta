'use client';

import { useState } from 'react';
import { SwimmerCard } from '@/components/booking/SwimmerCard';
import type { Swimmer } from '@/types/booking';

export default function TestSwimmerCardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mockSwimmers: Swimmer[] = [
    {
      id: '1',
      firstName: 'Emma',
      lastName: 'Smith',
      dateOfBirth: '2018-05-15',
      enrollmentStatus: 'enrolled',
      assessmentStatus: null,
      currentLevelId: null,
      currentLevelName: 'White',
      paymentType: 'private_pay',
      fundingSourceId: null,
      fundingSourceName: undefined,
      fundingSourceShortName: undefined,
    },
    {
      id: '2',
      firstName: 'Liam',
      lastName: 'Johnson',
      dateOfBirth: '2019-08-22',
      enrollmentStatus: 'waitlist',
      assessmentStatus: 'completed',
      currentLevelId: 'level-2',
      currentLevelName: 'Red',
      paymentType: 'funding_source',
      fundingSourceId: 'funding-source-1',
      fundingSourceName: 'Valley Mountain Regional Center',
      fundingSourceShortName: 'VMRC',
      sessionsUsed: 3,
      sessionsAuthorized: 12,
    },
    {
      id: '3',
      firstName: 'Olivia',
      lastName: 'Williams',
      dateOfBirth: '2017-11-30',
      enrollmentStatus: 'pending_enrollment',
      assessmentStatus: 'scheduled',
      currentLevelId: null,
      paymentType: 'private_pay',
      fundingSourceId: null,
      fundingSourceName: undefined,
      fundingSourceShortName: undefined,
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    },
    {
      id: '4',
      firstName: 'Noah',
      lastName: 'Brown',
      dateOfBirth: '2020-02-14',
      enrollmentStatus: 'inactive',
      assessmentStatus: null,
      currentLevelId: 'level-1',
      currentLevelName: 'White',
      paymentType: 'private_pay',
      fundingSourceId: null,
      fundingSourceName: undefined,
      fundingSourceShortName: undefined,
    },
    {
      id: '5',
      firstName: 'Ava',
      lastName: 'Jones',
      dateOfBirth: '2016-07-08',
      enrollmentStatus: 'declined',
      assessmentStatus: 'failed',
      currentLevelId: null,
      paymentType: 'funding_source',
      fundingSourceId: 'funding-source-1',
      fundingSourceName: 'Valley Mountain Regional Center',
      fundingSourceShortName: 'VMRC',
      sessionsUsed: 0,
      sessionsAuthorized: 1,
    },
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">SwimmerCard Component Test</h1>
      <p className="mb-8 text-muted-foreground">
        Testing the SwimmerCard component with different swimmer states and data.
      </p>

      <div className="mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Selected Swimmer</h2>
        <p className="text-sm text-muted-foreground">
          {selectedId
            ? `Selected: ${mockSwimmers.find(s => s.id === selectedId)?.firstName} ${mockSwimmers.find(s => s.id === selectedId)?.lastName}`
            : 'No swimmer selected'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockSwimmers.map(swimmer => (
          <SwimmerCard
            key={swimmer.id}
            swimmer={swimmer}
            isSelected={selectedId === swimmer.id}
            onClick={() => {
              console.log('Clicked swimmer:', swimmer.firstName);
              setSelectedId(swimmer.id === selectedId ? null : swimmer.id);
            }}
          />
        ))}
      </div>

      <div className="mt-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Test Cases</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Emma Smith:</strong> Private pay, enrolled, White level, no photo
          </li>
          <li>
            <strong>Liam Johnson:</strong> Authorized client (VMRC), waitlist, Red level, session counter
          </li>
          <li>
            <strong>Olivia Williams:</strong> Private pay, pending enrollment, has avatar photo
          </li>
          <li>
            <strong>Noah Brown:</strong> Private pay, inactive, White level
          </li>
          <li>
            <strong>Ava Jones:</strong> Authorized client (VMRC), declined, assessment failed
          </li>
        </ul>
      </div>
    </div>
  );
}