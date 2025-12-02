export interface NavigationConfig {
  title: string;
  sidebar?: {
    enabled: boolean;
    section: string;
    subsection?: string;
    icon?: string;
  };
  breadcrumb?: {
    path: string[];
  };
}

export interface SidebarItem {
  title: string;
  href: string;
  icon?: string;
  children?: SidebarSubItem[];
  isActive?: boolean;
}

export interface SidebarSubItem {
  title: string;
  href: string;
  isActive?: boolean;
}

export interface SidebarSection {
  section: string;
  items: SidebarItem[];
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
  isActive?: boolean;
}

export interface NavigationState {
  sidebarSections: SidebarSection[];
  breadcrumbs: BreadcrumbItem[];
  currentSection?: string;
  currentSubsection?: string;
  sidebarOpen: boolean;
}