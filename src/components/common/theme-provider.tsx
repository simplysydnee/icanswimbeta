'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

type Attribute = 'class' | 'data-theme' | 'data-color-scheme';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: Attribute | Attribute[];
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  themes?: string[];
  forcedTheme?: string;
  enableColorScheme?: boolean;
  storageKey?: string;
  nonce?: string;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}