'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react'

interface EditImportantNotesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  swimmerId: string
  importantNotes: string[]
  onSuccess?: () => void
}

async function updateSwimmerImportantNotes(
  swimmerId: string,
  importantNotes: string[]
) {
  const supabase = createClient()

  try {
    // Filter out empty notes and trim whitespace
    const filteredNotes = importantNotes
      .map(note => note.trim())
      .filter(note => note.length > 0)

    const { data, error } = await supabase
      .from('swimmers')
      .update({
        important_notes: filteredNotes.length > 0 ? filteredNotes : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', swimmerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating important notes:', error)
      throw new Error(`Failed to update important notes: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in updateSwimmerImportantNotes:', error)
    throw error
  }
}

export default function EditImportantNotesModal({
  open,
  onOpenChange,
  swimmerId,
  importantNotes,
  onSuccess
}: EditImportantNotesModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState<string[]>([''])

  // Initialize notes when modal opens or props change
  useEffect(() => {
    if (open) {
      if (importantNotes && importantNotes.length > 0) {
        setNotes([...importantNotes, '']) // Add empty field for new note
      } else {
        setNotes(['']) // Start with one empty field
      }
    }
  }, [open, importantNotes])

  const updateMutation = useMutation({
    mutationFn: () => updateSwimmerImportantNotes(swimmerId, notes),
    onSuccess: () => {
      toast({
        title: 'Important notes updated',
        description: 'Swimmer important notes have been saved successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['swimmerDetail', swimmerId] })
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update important notes',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...notes]
    newNotes[index] = value
    setNotes(newNotes)
  }

  const addNoteField = () => {
    setNotes([...notes, ''])
  }

  const removeNote = (index: number) => {
    if (notes.length === 1) {
      // Don't remove the last field, just clear it
      setNotes([''])
    } else {
      const newNotes = notes.filter((_, i) => i !== index)
      setNotes(newNotes)
    }
  }

  const handleSubmit = () => {
    // Filter out empty notes
    const nonEmptyNotes = notes.filter(note => note.trim().length > 0)

    if (nonEmptyNotes.length === 0) {
      // If all notes are empty, we'll save as empty array (which will become null in DB)
      setNotes([''])
    }

    setIsSubmitting(true)
    updateMutation.mutate()
  }

  const handleCancel = () => {
    // Reset to initial state
    if (importantNotes && importantNotes.length > 0) {
      setNotes([...importantNotes, ''])
    } else {
      setNotes([''])
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Edit Important Notes
          </DialogTitle>
          <DialogDescription>
            Add or edit important notices that will be displayed prominently for this swimmer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Important Notes</Label>
            <div className="space-y-3">
              {notes.map((note, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={note}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                    placeholder="Enter important note (e.g., medical alert, behavior note, special instructions)..."
                    rows={2}
                    className="flex-1 resize-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeNote(index)}
                    className="h-10 w-10 shrink-0 text-gray-400 hover:text-red-600"
                    disabled={notes.length === 1 && note === ''}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addNoteField}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Note
            </Button>

            <p className="text-sm text-gray-500">
              Each note will appear as a bullet point in the important notice header.
              Leave empty to remove all important notes.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Notes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}