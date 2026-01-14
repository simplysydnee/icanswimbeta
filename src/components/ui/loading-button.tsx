'use client';

import * as React from 'react';
import { Button } from './button';
import type { ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
};

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, loading, loadingText, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? (loadingText || 'Please wait...') : children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };