import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useParentInvitation() {
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  const inviteParent = async (
    swimmerId: string,
    parentEmail: string,
    parentName?: string
  ) => {
    setIsInviting(true);

    try {
      const response = await fetch(
        `/api/admin/swimmers/${swimmerId}/invite-parent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parent_email: parentEmail,
            parent_name: parentName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      return {
        success: true,
        linked: data.linked,
        isResend: data.isResend,
        message: data.message,
      };
    } catch (error) {
      toast({
        title: 'Failed to send invitation',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsInviting(false);
    }
  };

  return { inviteParent, isInviting };
}