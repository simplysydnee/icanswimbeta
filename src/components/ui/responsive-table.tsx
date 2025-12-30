'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => ReactNode
  hideOnMobile?: boolean
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  onRowClick?: (item: T) => void
  mobileCard?: (item: T) => ReactNode
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  onRowClick,
  mobileCard,
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item) => (
          <Card
            key={String(item[keyField])}
            className={onRowClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              {mobileCard ? mobileCard(item) : (
                <div className="space-y-2">
                  {columns.filter(col => !col.hideOnMobile).map((col) => (
                    <div key={String(col.key)} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{col.label}</span>
                      <span className="font-medium">
                        {col.render ? col.render(item) : String(item[col.key] || '-')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {data.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No data found</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={String(item[keyField])}
              className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <TableCell key={String(col.key)}>
                  {col.render ? col.render(item) : String(item[col.key] || '-')}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                No data found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}