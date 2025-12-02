'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export function LandingHeader() {
  return (
    <header className="container mx-auto px-4 py-6">
      <nav className="flex items-center justify-between flex-wrap gap-4">
        <Link href="/">
          <Image
            src="/images/logo-header.svg"
            alt="I Can Swim"
            width={160}
            height={40}
            className="h-12 w-auto object-contain"
          />
        </Link>
        <div className="flex gap-2 sm:gap-4 flex-wrap">
          <Link href="/login">
            <Button variant="outline" size="sm">Login</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}