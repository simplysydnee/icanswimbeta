'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from './button';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showStrength?: boolean;
  showRequirements?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, showRequirements = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [capsLockOn, setCapsLockOn] = React.useState(false);
    const [strength, setStrength] = React.useState<'weak' | 'medium' | 'strong' | null>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
      setCapsLockOn(e.getModifierState('CapsLock'));
    };

    const calculateStrength = (password: string) => {
      if (!password) return null;
      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^a-zA-Z\d]/.test(password)) score++;

      if (score <= 2) return 'weak';
      if (score <= 3) return 'medium';
      return 'strong';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showStrength) {
        setStrength(calculateStrength(e.target.value));
      }
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-20 text-sm ring-offset-background placeholder:text-muted-foreground transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              setCapsLockOn(false);
              props.onBlur?.(e);
            }}
            onChange={handleChange}
            {...props}
          />

          {/* Caps Lock Warning */}
          {capsLockOn && isFocused && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}

          {/* Show/Hide Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>

        {/* Caps Lock Warning Text */}
        {capsLockOn && isFocused && (
          <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Caps Lock is ON
          </p>
        )}

        {/* Password Strength Bar */}
        {showStrength && strength && (
          <div className="mt-2">
            <div className="flex gap-1">
              <div className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                strength === 'weak' ? 'bg-red-500' :
                strength === 'medium' ? 'bg-amber-500' : 'bg-green-500'
              )} />
              <div className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                strength === 'medium' ? 'bg-amber-500' :
                strength === 'strong' ? 'bg-green-500' : 'bg-gray-200'
              )} />
              <div className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                strength === 'strong' ? 'bg-green-500' : 'bg-gray-200'
              )} />
            </div>
            <p className={cn(
              "mt-1 text-xs",
              strength === 'weak' ? 'text-red-600' :
              strength === 'medium' ? 'text-amber-600' : 'text-green-600'
            )}>
              {strength === 'weak' && 'Weak password'}
              {strength === 'medium' && 'Medium strength'}
              {strength === 'strong' && 'Strong password'}
            </p>
          </div>
        )}

        {/* Password Requirements */}
        {showRequirements && isFocused && (
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Password should include:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>At least 8 characters</li>
              <li>Upper and lowercase letters</li>
              <li>At least one number</li>
              <li>At least one special character</li>
            </ul>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };