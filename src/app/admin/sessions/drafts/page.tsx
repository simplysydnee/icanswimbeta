'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DraftSessionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/sessions?status=draft');
  }, [router]);

  return null;
}