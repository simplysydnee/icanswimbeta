'use client'

import { AlertTriangle, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImportantNoticeHeaderProps {
  importantNotes: string[]
  isAdmin: boolean
  onEdit?: () => void
}

export default function ImportantNoticeHeader({
  importantNotes,
  isAdmin,
  onEdit
}: ImportantNoticeHeaderProps) {
  // If no notes and not admin, don't show anything
  if (!importantNotes || importantNotes.length === 0) {
    if (!isAdmin) {
      return null
    }
    // Admin view with no notes - show empty state
    return (
      <div className="bg-amber-50 border-b border-amber-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="shrink-0 pt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-amber-800 text-sm">IMPORTANT NOTES</h3>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={onEdit}
                      className="h-11 px-3 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Add Important Notes
                    </Button>
                  )}
                </div>
                <p className="text-amber-700 text-xs leading-relaxed">
                  No important safety notes yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="shrink-0 pt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-amber-800 text-sm">IMPORTANT NOTES</h3>
                {isAdmin && onEdit && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={onEdit}
                    className="h-11 px-3 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Notes
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                {importantNotes.map((note, index) => (
                  <p key={index} className="text-amber-700 text-xs leading-relaxed">
                    • {note}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Close button for mobile? Or keep always visible? */}
          {/* <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button> */}
        </div>
      </div>
    </div>
  )
}