'use client';

import Link from 'next/link';
import { CoordinatorReferralForm } from '@/components/enrollment/coordinatorReferralForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CoordinatorReferralNewPage() {
  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/coordinator/referrals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to referrals
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-[#2a5e84]">Submit a referral</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Onboard a new swimmer by entering the child&apos;s information and parent / guardian contact details.
          The parent will receive an email with next steps (and login details if they are new to I Can Swim).
        </p>
      </div>

      <CoordinatorReferralForm />
    </div>
  );
}
