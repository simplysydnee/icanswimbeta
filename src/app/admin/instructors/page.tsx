'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstructorsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/staff');
  }, [router]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting to Staff Management...</p>
        </div>
      </div>
    </div>
  );
}