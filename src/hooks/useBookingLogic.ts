import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Swimmer {
  id: string;
  name: string;
  paymentType?: "private_pay" | "vmrc" | "scholarship" | "other";
  vmrcSessionsUsed?: number;
  vmrcSessionsAuthorized?: number;
}

interface InstructorData {
  instructorId: string;
  instructorName: string;
  conflictDates: Date[];
  availableForAll: boolean;
}

export const useBookingLogic = (selectedSwimmers: Swimmer[] = []) => {
  const { toast } = useToast();
  const [skipConflicts, setSkipConflicts] = useState(false);

  const pricePerSession = 65;

  // Payment type calculations
  const hasVmrcClients = selectedSwimmers.some((s) => s.paymentType === "vmrc");
  const allVmrcClients = selectedSwimmers.every((s) => s.paymentType === "vmrc");
  const privatePaySwimmers = selectedSwimmers.filter((s) => s.paymentType === "private_pay").length;

  // Calculate session count based on conflicts
  const calculateSessionCount = useCallback(
    (totalDates: number, instructorData?: InstructorData) => {
      if (!instructorData) return totalDates;
      return skipConflicts
        ? totalDates - instructorData.conflictDates.length
        : totalDates;
    },
    [skipConflicts]
  );

  // Calculate total price
  const calculateTotalPrice = useCallback(
    (sessionCount: number) => {
      return pricePerSession * sessionCount * privatePaySwimmers;
    },
    [privatePaySwimmers, pricePerSession]
  );

  // Calculate VMRC session info
  const calculateVmrcInfo = useCallback(
    (sessionCount: number) => {
      return selectedSwimmers
        .filter((s) => s.paymentType === "vmrc")
        .map((s) => {
          const currentUsed = s.vmrcSessionsUsed || 0;
          const authorized = s.vmrcSessionsAuthorized || 12;
          const afterBooking = currentUsed + sessionCount;
          const remaining = authorized - afterBooking;
          return { 
            name: s.name, 
            currentUsed,
            authorized,
            afterBooking,
            remaining, 
            needsRenewal: afterBooking >= authorized 
          };
        });
    },
    [selectedSwimmers]
  );

  // Handle booking confirmation
  const handleConfirmBooking = useCallback(
    async (
      swimmerId: string | undefined,
      parentId: string | undefined,
      selectedInstructor: string | null,
      sessionIds: string[]
    ) => {
      if (!swimmerId || !parentId || !selectedInstructor) {
        toast({
          title: "Missing Information",
          description: "Please complete your selection before confirming.",
          variant: "destructive",
        });
        return false;
      }

      const swimmerCount = selectedSwimmers.length || 1;
      const vmrcClientInfo = calculateVmrcInfo(sessionIds.length);

      let description = `Successfully booked ${sessionIds.length} session(s) for ${swimmerCount} swimmer${swimmerCount > 1 ? 's' : ''}.`;

      // Add VMRC session count info
      if (vmrcClientInfo.length > 0) {
        vmrcClientInfo.forEach((info) => {
          if (info.needsRenewal) {
            description += `\n\n⚠️ ${info.name}: You've used all ${info.authorized} authorized sessions. Please contact your VMRC coordinator to authorize more sessions before booking again.`;
          } else if (info.remaining <= 3) {
            description += `\n\n📊 ${info.name}: ${info.remaining} session${info.remaining !== 1 ? 's' : ''} remaining. Contact your coordinator soon for renewal.`;
          } else {
            description += `\n\n📊 ${info.name}: ${info.remaining} session${info.remaining !== 1 ? 's' : ''} remaining until coordinator renewal needed.`;
          }
        });
      }

      toast({
        title: "Booking Confirmed! 🎉",
        description,
      });

      return true;
    },
    [selectedSwimmers, toast, calculateVmrcInfo]
  );

  return {
    skipConflicts,
    setSkipConflicts,
    pricePerSession,
    hasVmrcClients,
    allVmrcClients,
    privatePaySwimmers,
    calculateSessionCount,
    calculateTotalPrice,
    calculateVmrcInfo,
    handleConfirmBooking,
  };
};