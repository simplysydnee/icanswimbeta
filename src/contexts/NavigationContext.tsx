'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  NavigationState,
  NavigationConfig,
  SidebarSection,
  SidebarItem,
  BreadcrumbItem,
} from '@/types/navigation';
import { NAVIGATION_REGISTRY } from '@/lib/navigation-registry';

interface NavigationContextType extends NavigationState {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  registerPage: (path: string, config: NavigationConfig) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSections, setSidebarSections] = useState<SidebarSection[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [currentSection, setCurrentSection] = useState<string | undefined>();
  const [currentSubsection, setCurrentSubsection] = useState<string | undefined>();
  const [refreshNavigation, setRefreshNavigation] = useState(0);
  
  // Use ref for stable page configs storage - initialized with registry
  const pageConfigsRef = useRef<Record<string, NavigationConfig>>(NAVIGATION_REGISTRY);

  const buildNavigation = useCallback(() => {
    const buildSidebarSections = (): SidebarSection[] => {
      const sections = new Map<string, SidebarItem[]>();
      const pageConfigs = pageConfigsRef.current;

      Object.entries(pageConfigs).forEach(([path, config]) => {
        if (!config.sidebar?.enabled || !config.sidebar.section) return;

        const { section, subsection, icon } = config.sidebar;
        
        if (!sections.has(section)) {
          sections.set(section, []);
        }

        const sectionItems = sections.get(section)!;
        
        if (subsection) {
          // Find or create the parent item
          let parentItem = sectionItems.find(item => item.title === section);
          if (!parentItem) {
            // Create parent section item
            const basePath = path.split('/').slice(0, 3).join('/'); // /testnav/analytics
            parentItem = {
              title: section,
              href: basePath,
              icon: icon,
              children: [],
              isActive: pathname.startsWith(basePath),
            };
            sectionItems.push(parentItem);
          }
          
          // Add subsection as child
          if (!parentItem.children) parentItem.children = [];
          const existingChild = parentItem.children.find(child => child.title === subsection);
          if (!existingChild) {
            parentItem.children.push({
              title: subsection,
              href: path,
              isActive: pathname === path,
            });
          }
        } else {
          // This is a top-level section item (no subsection)
          const existingItem = sectionItems.find(item => item.title === section && !item.children?.length);
          if (!existingItem) {
            sectionItems.push({
              title: section,
              href: path,
              icon: icon,
              isActive: pathname === path,
            });
          }
        }
      });

      return Array.from(sections.entries()).map(([sectionName, items]) => ({
        section: sectionName,
        items,
      }));
    };

    const buildBreadcrumbs = (): BreadcrumbItem[] => {
      const pageConfigs = pageConfigsRef.current;
      const config = pageConfigs[pathname];
      if (!config?.breadcrumb?.path) return [];

      return config.breadcrumb.path.map((title, index) => {
        const isLast = index === config.breadcrumb!.path.length - 1;
        let href: string | undefined;

        if (!isLast) {
          const pathSegments = pathname.split('/').filter(Boolean);
          if (index === 0) {
            href = `/${pathSegments[0]}`;
          } else {
            href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          }
        }

        return {
          title,
          href,
          isActive: isLast,
        };
      });
    };

    // Update navigation state
    setSidebarSections(buildSidebarSections());
    setBreadcrumbs(buildBreadcrumbs());
    
    const currentConfig = pageConfigsRef.current[pathname];
    setCurrentSection(currentConfig?.sidebar?.section);
    setCurrentSubsection(currentConfig?.sidebar?.subsection);
  }, [pathname]);

  // Make registerPage stable and idempotent (for backwards compatibility / extensions)
  const registerPage = useCallback((path: string, config: NavigationConfig) => {
    const current = pageConfigsRef.current[path];
    // Only update if config has actually changed
    if (!current || JSON.stringify(current) !== JSON.stringify(config)) {
      pageConfigsRef.current = {
        ...pageConfigsRef.current,
        [path]: config
      };
      // Trigger navigation rebuild
      setRefreshNavigation(prev => prev + 1);
    }
  }, []);

  // Build navigation when pathname changes or refresh is triggered
  useEffect(() => {
    buildNavigation();
  }, [buildNavigation, refreshNavigation]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <NavigationContext.Provider
      value={{
        sidebarSections,
        breadcrumbs,
        currentSection,
        currentSubsection,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        registerPage,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}