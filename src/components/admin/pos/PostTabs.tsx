'use client';

import { cn } from '@/lib/utils';
import { FileText, DollarSign } from 'lucide-react';

export type POSTab = 'purchase-orders' | 'monthly-billing';

interface PostTabsProps {
  activeTab: POSTab;
  onTabChange: (tab: POSTab) => void;
}

export function PostTabs({ activeTab, onTabChange }: PostTabsProps) {
  return (
    <div className="border-b">
      <nav className="flex space-x-8">
        <button
          onClick={() => onTabChange('purchase-orders')}
          className={cn(
            'inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'purchase-orders'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
          )}
        >
          <FileText className="h-4 w-4" />
          Purchase Orders
        </button>
        <button
          onClick={() => onTabChange('monthly-billing')}
          className={cn(
            'inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'monthly-billing'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
          )}
        >
          <DollarSign className="h-4 w-4" />
          Monthly Billing
        </button>
      </nav>
    </div>
  );
}