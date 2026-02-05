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

  const isAdmin = (role === 'admin' || (Array.isArray(role) && role.includes('admin'))) && editMode;

  // Debug logging
  console.log('[EditableText] Debug:', {
    pageSlug,
    sectionKey,
    role,
    roleType: typeof role,
    editMode,
    isAdmin,
    user: !!user,
    userEmail: user?.email
  });

  // Mutation to save content
  const updateContent = useMutation({
    mutationFn: async (newContent: string) => {
      console.log('[EditableText] Starting upsert:', {
        pageSlug,
        sectionKey,
        contentType,
        userId: user?.id,
        userEmail: user?.email,
        hasUser: !!user,
        editMode,
        role,
        isAdmin
      });

      // Check Supabase auth state
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        console.log('[EditableText] Supabase auth state:', {
          user: authData?.user?.id,
          authError: authError ? {
            message: authError.message,
            code: authError.code
          } : null
        });
      } catch (authErr) {
        console.error('[EditableText] Auth check error:', authErr);
      }

      try {
        // First, try a simple select to check if table exists and we have permissions
        const { data: testData, error: testError } = await supabase
          .from('page_content')
          .select('id')
          .eq('page_slug', pageSlug)
          .eq('section_key', sectionKey)
          .limit(1);

        console.log('[EditableText] Test query result:', {
          testData,
          testError: testError ? {
            message: testError.message,
            details: testError.details,
            hint: testError.hint,
            code: testError.code
          } : null
        });

        console.log('[EditableText] Attempting to save:', {
          page_slug: pageSlug,
          section_key: sectionKey,
          content_type: contentType,
          content_length: newContent?.length,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString()
        });

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

        if (error) {
          console.error('[EditableText] Raw error object:', error);
          console.error('[EditableText] Error constructor:', error?.constructor?.name);
          console.error('[EditableText] Error prototype chain:', Object.getPrototypeOf(error));
          console.error('[EditableText] Supabase upsert error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            originalError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            allKeys: Object.keys(error),
            errorType: typeof error,
            errorString: String(error)
          });
          throw error;
        }

        console.log('[EditableText] Upsert success:', data);
        return data;
      } catch (err) {
        // Safely extract error details from unknown type
        const errorDetails: Record<string, unknown> = {
          rawError: err,
          string: String(err),
          type: typeof err
        };

        // Try to extract properties from Error-like objects
        if (err instanceof Error) {
          errorDetails.name = err.name;
          errorDetails.message = err.message;
          errorDetails.stack = err.stack;
          errorDetails.cause = err.cause;
          errorDetails.constructorName = err.constructor.name;
        } else if (err && typeof err === 'object') {
          // For plain objects, try to extract known properties
          const obj = err as Record<string, unknown>;
          try {
            errorDetails.keys = Object.keys(obj);
          } catch (e) {
            errorDetails.keysError = String(e);
          }

          // Safely get properties that might exist
          if ('name' in obj) errorDetails.name = obj.name;
          if ('message' in obj) errorDetails.message = obj.message;
          if ('stack' in obj) errorDetails.stack = obj.stack;
          if ('cause' in obj) errorDetails.cause = obj.cause;
          if ('constructor' in obj && obj.constructor) {
            errorDetails.constructorName = (obj.constructor as { name?: string }).name;
          }
        }

        console.error('[EditableText] Catch block error details:', errorDetails);
        throw err;
      }
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
      // Safely extract error details
      const errorDetails: Record<string, unknown> = {
        rawError: error,
        string: String(error),
        type: typeof error
      };

      // Try to extract properties from Error-like objects
      if (error instanceof Error) {
        errorDetails.name = error.name;
        errorDetails.message = error.message;
        errorDetails.stack = error.stack;
        errorDetails.cause = error.cause;
        errorDetails.constructorName = error.constructor.name;
      } else if (error && typeof error === 'object') {
        // For plain objects, try to extract known properties
        const obj = error as Record<string, unknown>;
        try {
          errorDetails.keys = Object.keys(obj);
        } catch (e) {
          errorDetails.keysError = String(e);
        }

        // Safely get properties that might exist
        if ('name' in obj) errorDetails.name = obj.name;
        if ('message' in obj) errorDetails.message = obj.message;
        if ('stack' in obj) errorDetails.stack = obj.stack;
        if ('cause' in obj) errorDetails.cause = obj.cause;
        if ('constructor' in obj && obj.constructor) {
          errorDetails.constructorName = (obj.constructor as { name?: string }).name;
        }

        // Supabase PostgrestError properties
        if ('details' in obj) errorDetails.details = obj.details;
        if ('hint' in obj) errorDetails.hint = obj.hint;
        if ('code' in obj) errorDetails.code = obj.code;
      }

      // Log current user and auth state for debugging
      console.error('[EditableText] Mutation error details:', {
        errorDetails,
        userState: {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          role,
          editMode,
          isAdmin
        },
        pageInfo: {
          pageSlug,
          sectionKey,
          contentType
        }
      });

      // Safely get error message for toast
      let errorMessage = 'Unknown error occurred';
      if (typeof errorDetails.message === 'string') {
        errorMessage = errorDetails.message;
      } else if (typeof errorDetails.string === 'string') {
        errorMessage = errorDetails.string;
      } else if (errorDetails.message !== undefined) {
        errorMessage = String(errorDetails.message);
      }

      toast({
        title: 'Update Failed',
        description: errorMessage,
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