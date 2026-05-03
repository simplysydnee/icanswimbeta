'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2 } from 'lucide-react';

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
  const { toast } = useToast();

  const supabase = createClient();

  // Get current user for created_by
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
      const currentUserId = await getCurrentUserId();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('swimmer_notes')
        .insert({
          swimmer_id: swimmerId,
          note_text: newNote.trim(),
          created_by: currentUserId,
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
            {notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-4 space-y-1"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {note.created_by ? note.author_name || 'Admin' : 'Airtable'}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatNoteDate(
                      note.created_by
                        ? note.created_at
                        : (note.airtable_comment_date || note.created_at)
                    )}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
