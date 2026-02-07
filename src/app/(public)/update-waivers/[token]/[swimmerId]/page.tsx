'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { WaiverUpdateForm } from '@/components/waiver-update/WaiverUpdateForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSwimmersNeedingWaivers } from '@/hooks/useSwimmersNeedingWaivers';
import type { SwimmerWaiverStatus } from '@/lib/db/waivers';

export default function SwimmerWaiverPage({
  params
}: {
  params: Promise<{ token: string; swimmerId: string }>
}) {
  const { token, swimmerId } = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useSwimmersNeedingWaivers(token, true);

  const handleComplete = () => {
    // Find next incomplete swimmer
    const swimmers: SwimmerWaiverStatus[] = data?.swimmers || [];
    const currentIndex = swimmers.findIndex((s: SwimmerWaiverStatus) => s.id === swimmerId);

    // Look for next incomplete swimmer after current position
    let nextSwimmer: SwimmerWaiverStatus | null = null;
    for (let i = currentIndex + 1; i < swimmers.length; i++) {
      if (!swimmers[i].isComplete) {
        nextSwimmer = swimmers[i];
        break;
      }
    }

    // If not found after current position, check from beginning
    if (!nextSwimmer) {
      for (let i = 0; i < currentIndex; i++) {
        if (!swimmers[i].isComplete) {
          nextSwimmer = swimmers[i];
          break;
        }
      }
    }

    if (nextSwimmer) {
      // Navigate to next incomplete swimmer
      router.push(`/update-waivers/${token}/${nextSwimmer.id}`);
    } else {
      // All swimmers complete, go back to main page
      router.push(`/update-waivers/${token}`);
    }
  };

  // Find the specific swimmer
  const swimmer = data?.swimmers?.find((s: SwimmerWaiverStatus) => s.id === swimmerId);
  const swimmerName = swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Swimmer';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
          <span className="ml-3 text-gray-600">Loading swimmer information...</span>
        </div>
      </div>
    );
  }

  if (error || !swimmer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => router.push(`/update-waivers/${token}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Swimmers
        </Button>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            {error ? 'Error loading swimmer' : 'Swimmer not found'}
          </h2>
          <p className="text-gray-600">
            {error ? 'Please try again or contact us at (209) 778-7877 or email info@icanswim209.com.' : 'This swimmer could not be found or is not associated with this link. Please contact us at (209) 778-7877 or email info@icanswim209.com for assistance.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Button
        variant="ghost"
        onClick={() => router.push(`/update-waivers/${token}`)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Swimmers
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Update Waivers for {swimmerName}</h1>
        <p className="text-gray-600">
          Complete all three waiver sections below. This takes about 3-5 minutes.
        </p>
      </div>

      <WaiverUpdateForm
        token={token}
        swimmerId={swimmerId}
        swimmerName={swimmerName}
        onComplete={handleComplete}
      />
    </div>
  );
}