import { NavigationConfig } from '@/types/navigation';

// Auto-discover all pages with navigation configs
export async function discoverNavigationPages(): Promise<Record<string, NavigationConfig>> {
  const navigationPages: Record<string, NavigationConfig> = {};

  try {
    // Define all the pages that should have navigation configs
    const pageRoutes = [
      '/testnav',
      '/testnav/analytics', 
      '/testnav/analytics/reports',
      '/testnav/analytics/reports/users',
      '/testnav/settings',
      '/testnav/settings/profile'
    ];

    // Dynamically import navigation configs from each page
    for (const route of pageRoutes) {
      try {
        const modulePath = `@/app${route}/page`;
        const pageModule = await import(modulePath);
        
        if (pageModule.navigationConfig) {
          navigationPages[route] = pageModule.navigationConfig;
        }
      } catch (error) {
        // Skip pages that don't exist or don't have navigation configs
        console.warn(`Could not load navigation config for ${route}:`, error);
      }
    }

    return navigationPages;
  } catch (error) {
    console.error('Error discovering navigation pages:', error);
    return {};
  }
}

// For development: scan file system to find pages (Next.js specific)
export function getTestNavPageRoutes(): string[] {
  // For now, return static list - could be enhanced with fs scanning later
  return [
    '/testnav',
    '/testnav/analytics', 
    '/testnav/analytics/reports',
    '/testnav/analytics/reports/users',
    '/testnav/settings',
    '/testnav/settings/profile'
  ];
}