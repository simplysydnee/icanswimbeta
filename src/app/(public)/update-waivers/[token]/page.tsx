'use client';

import { use } from 'react';
import Link from 'next/link';
import { useWaiverToken } from '@/hooks/useWaiverToken';
import { useSwimmersNeedingWaivers } from '@/hooks/useSwimmersNeedingWaivers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function WaiverUpdatePage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params);

  const tokenQuery = useWaiverToken(token);
  const swimmersQuery = useSwimmersNeedingWaivers(
    token,
    tokenQuery.isSuccess && tokenQuery.data.valid
  );

  // Loading state
  if (tokenQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  // Error/Invalid token state
  if (tokenQuery.isError || !tokenQuery.data?.valid) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Link Invalid or Expired</h1>
          <p className="text-gray-600 mb-4">
            {tokenQuery.data?.error || 'This waiver update link is no longer valid.'}
          </p>
          <p className="text-sm">
            Please contact us at{' '}
            <a href="tel:2097787877" className="text-cyan-600 hover:underline">
              (209) 778-7877
            </a>
            {' '}or email{' '}
            <a href="mailto:info@icanswim209.com" className="text-cyan-600 hover:underline">
              info@icanswim209.com
            </a>
            {' '}to receive a new link.
          </p>
        </Card>
      </div>
    );
  }

  // Success - show swimmers
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Update Swim Waivers</h1>
        <p className="text-gray-600">
          Hi {tokenQuery.data?.parentName || ''}! Please update waivers for your enrolled swimmers.
        </p>
      </div>

      {swimmersQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {swimmersQuery.data?.swimmers.map((swimmer: any) => (
            <Card key={swimmer.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {swimmer.firstName} {swimmer.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {swimmer.isComplete ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        All waivers complete
                      </span>
                    ) : (
                      <span className="flex items-center text-yellow-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Needs waiver update
                      </span>
                    )}
                  </p>
                </div>

                {!swimmer.isComplete && (
                  <Button asChild>
                    <Link href={`/update-waivers/${token}/${swimmer.id}`}>
                      Complete Waivers
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}