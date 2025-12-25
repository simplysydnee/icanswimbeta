'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';
import { 
  ChevronDown, 
  ChevronRight,
  Home,
  BarChart3,
  Settings,
  Users,
  FileText,
  User,
  PanelLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap = {
  Home,
  BarChart3,
  Settings,
  Users,
  FileText,
  User,
};

interface SidebarProps {
  className?: string;
  onToggle?: () => void;
}

export function Sidebar({ className, onToggle }: SidebarProps) {
  const { sidebarSections, sidebarOpen, toggleSidebar } = useNavigation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName || !iconMap[iconName as keyof typeof iconMap]) return null;
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return <IconComponent className="h-4 w-4" />;
  };

  // Always render sidebar, but change width based on open state

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'transform transition-all duration-200 ease-in-out',
        sidebarOpen ? 'w-64 translate-x-0' : 'w-16 translate-x-0',
        'md:relative md:top-0 md:z-0 md:h-auto',
        className
      )}
    >
      {/* Sidebar Header */}
      <div className={cn(
        "flex items-center border-b border-border/50",
        sidebarOpen ? "justify-between p-4" : "justify-center p-2"
      )}>
        {sidebarOpen && (
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-sm text-foreground">Navigation</h3>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle || toggleSidebar}
          className="h-7 w-7 hover:bg-accent"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">{sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}</span>
        </Button>
      </div>

      {sidebarOpen ? (
        <div className="flex h-full flex-col overflow-y-auto p-4">
          <nav className="space-y-2">
            {sidebarSections.map((section) => (
              <div key={section.section} className="space-y-1">
                {section.items.map((item) => (
                  <div key={item.title}>
                    {item.children && item.children.length > 0 ? (
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-between px-3 py-2 h-auto"
                          onClick={() => toggleSection(item.title)}
                        >
                          <div className="flex items-center space-x-3">
                            {renderIcon(item.icon)}
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          {expandedSections.has(item.title) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        {expandedSections.has(item.title) && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.title}
                                href={child.href}
                                className={cn(
                                  'block px-3 py-2 text-sm rounded-md transition-all duration-200',
                                  child.isActive
                                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm'
                                )}
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-all duration-200',
                          item.isActive
                            ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm'
                        )}
                      >
                        {renderIcon(item.icon)}
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center py-2 space-y-1">
          {sidebarSections.map((section) => (
            <div key={section.section} className="space-y-1">
              {section.items.map((item) => (
                <div key={item.title}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200 group',
                      item.isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm'
                    )}
                    title={item.title}
                  >
                    {renderIcon(item.icon)}
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}