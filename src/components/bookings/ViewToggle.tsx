'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, Calendar } from 'lucide-react'

interface ViewToggleProps {
  view: 'table' | 'calendar'
  onViewChange: (view: 'table' | 'calendar') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <Tabs value={view} onValueChange={(value) => onViewChange(value as 'table' | 'calendar')}>
        <TabsList>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Table View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}