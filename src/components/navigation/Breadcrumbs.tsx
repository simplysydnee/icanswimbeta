'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { breadcrumbs } = useNavigation();

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            )}
            {item.href && !item.isActive ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors font-medium"
              >
                {item.title}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-medium',
                  item.isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.title}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}