'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2, Pencil, Trash2, X, Check } from 'lucide-react';

interface Note {
  id: string;
  note_text: string;
  created_at: string;
  airtable_comment_date: string | null;
  created_by: string | null;
  author_name: string | null;
}

interface InternalNotesTabProps {
  swimmerId: string;
}

export function InternalNotesTab({ swimmerId }: InternalNotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const { toast } = useToast();

  const supabase = createClient();

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, [supabase]);

  // Get current user for created_by (used when adding notes)
  const getCurrentUserId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }, [supabase]);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('swimmer_notes')
        .select(`
          id,
          note_text,
          created_at,
          airtable_comment_date,
          created_by,
          profiles!swimmer_notes_created_by_fkey (
            full_name
          )
        `)
        .eq('swimmer_id', swimmerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes((data || []).map((item: Note & { profiles?: { full_name: string } | null }) => ({
        id: item.id,
        note_text: item.note_text,
        created_at: item.created_at,
        airtable_comment_date: item.airtable_comment_date,
        created_by: item.created_by,
        author_name: item.profiles?.full_name || null,
      })));
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [swimmerId, supabase]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const userId = await getCurrentUserId();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('swimmer_notes')
        .insert({
          swimmer_id: swimmerId,
          note_text: newNote.trim(),
          created_by: userId,
        })
        .select(`
          id,
          note_text,
          created_at,
          airtable_comment_date,
          created_by,
          profiles!swimmer_notes_created_by_fkey (
            full_name
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        const newEntry: Note = {
          id: data.id,
          note_text: data.note_text,
          created_at: data.created_at,
          airtable_comment_date: data.airtable_comment_date,
          created_by: data.created_by,
          author_name: data.profiles?.full_name || null,
        };
        setNotes(prev => [newEntry, ...prev]);
      }

      setNewNote('');
      toast({ title: 'Note added' });
    } catch (err) {
      console.error('Error adding note:', err);
      toast({
        title: 'Failed to add note',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (noteId: string) => {
    if (!editText.trim()) return;

    setSavingEditId(noteId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('swimmer_notes')
        .update({ note_text: editText.trim(), updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, note_text: editText.trim() } : n));
      setEditingId(null);
      setEditText('');
      toast({ title: 'Note updated' });
    } catch (err) {
      console.error('Error updating note:', err);
      toast({
        title: 'Failed to update note',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSavingEditId(null);
    }
  };

  const handleDelete = async (noteId: string) => {
    setSavingEditId(noteId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('swimmer_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(n => n.id !== noteId));
      setDeletingId(null);
      toast({ title: 'Note deleted' });
    } catch (err) {
      console.error('Error deleting note:', err);
      toast({
        title: 'Failed to delete note',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSavingEditId(null);
    }
  };

  const formatNoteDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
        timeZoneName: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Internal Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Note Section */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add an internal note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {newNote.length} character{newNote.length !== 1 ? 's' : ''}
            </span>
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Note
            </Button>
          </div>
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p>No notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const isOwned = note.created_by !== null && note.created_by === currentUserId;
              const isEditing = editingId === note.id;
              const isDeleting = deletingId === note.id;
              const isSaving = savingEditId === note.id;

              return (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 space-y-1 group relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <span className="font-semibold shrink-0">
                        {note.created_by ? note.author_name || 'Admin' : 'Airtable'}
                      </span>
                      <span className="text-muted-foreground text-xs shrink-0">
                        {formatNoteDate(
                          note.created_by
                            ? note.created_at
                            : (note.airtable_comment_date || note.created_at)
                        )}
                      </span>
                    </div>

                    {/* Action buttons — owned notes only */}
                    {isOwned && !isEditing && !isDeleting && (
                      <div className="flex items-center gap-0.5 shrink-0
                        md:opacity-0 md:group-hover:opacity-100
                        transition-opacity"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingId(note.id); setEditText(note.note_text); }}
                          aria-label="Edit note"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingId(note.id)}
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Edit mode */}
                  {isEditing ? (
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingId(null); setEditText(''); }}
                          disabled={isSaving}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEdit(note.id)}
                          disabled={!editText.trim() || isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    /* Delete confirmation */
                    <div className="space-y-2 mt-2">
                      <p className="text-sm text-muted-foreground">Delete this note?</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingId(null)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(note.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : null}
                          Confirm
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Read-only text */
                    <p className="text-sm whitespace-pre-wrap mt-1">{note.note_text}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
