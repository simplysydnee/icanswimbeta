'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  pageSlug: string;
  sectionKey: string;
  defaultContent: string;
  contentType?: 'text' | 'richtext';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  className?: string;
  children?: React.ReactNode;
}

export function EditableText({
  pageSlug,
  sectionKey,
  defaultContent,
  contentType = 'text',
  as: Component = 'p',
  className,
  children
}: EditableTextProps) {
  const { user, role } = useAuth();
  const { editMode } = useEditMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(defaultContent);

  const isAdmin = role === 'admin' && editMode;

  // Mutation to save content
  const updateContent = useMutation({
    mutationFn: async (newContent: string) => {
      const { data, error } = await supabase
        .from('page_content')
        .upsert({
          page_slug: pageSlug,
          section_key: sectionKey,
          content_type: contentType,
          content: newContent,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_slug,section_key'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content', pageSlug] });
      toast({
        title: 'Content Updated',
        description: 'Your changes have been saved successfully.',
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (editedContent.trim() === '') {
      toast({
        title: 'Cannot Save',
        description: 'Content cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    updateContent.mutate(editedContent);
  };

  const handleCancel = () => {
    setEditedContent(defaultContent);
    setIsEditing(false);
  };

  // If editing mode
  if (isEditing) {
    return (
      <div className="relative group">
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className={cn(
            'min-h-[100px] resize-y',
            className
          )}
          autoFocus
        />

        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateContent.isPending}
          >
            {updateContent.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Save
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateContent.isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Normal display mode
  return (
    <div className="relative group inline-block">
      <Component className={className}>
        {children || defaultContent}
      </Component>

      {/* Admin Edit Button */}
      {isAdmin && (
        <button
          onClick={() => setIsEditing(true)}
          className={cn(
            'absolute -right-8 top-0',
            'opacity-0 group-hover:opacity-100',
            'transition-opacity duration-200',
            'p-1 rounded hover:bg-gray-100',
            'text-gray-500 hover:text-blue-600'
          )}
          aria-label={`Edit ${sectionKey}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}