'use client';

import { useState, useEffect, useCallback } from 'react';

interface HoldState {
  isHolding: boolean;
  holdUntil: Date | null;
  timeRemaining: number; // seconds
  error: string | null;
}

export function useSessionHold(sessionId: string | null) {
  const [holdState, setHoldState] = useState<HoldState>({
    isHolding: false,
    holdUntil: null,
    timeRemaining: 0,
    error: null,
  });

  // Countdown timer
  useEffect(() => {
    if (!holdState.holdUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((holdState.holdUntil!.getTime() - Date.now()) / 1000));

      if (remaining <= 0) {
        setHoldState(prev => ({
          ...prev,
          isHolding: false,
          holdUntil: null,
          timeRemaining: 0,
        }));
        clearInterval(interval);
      } else {
        setHoldState(prev => ({ ...prev, timeRemaining: remaining }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdState.holdUntil]);

  const holdSession = useCallback(async () => {
    if (!sessionId) return false;

    try {
      const response = await fetch('/api/sessions/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setHoldState(prev => ({ ...prev, error: data.error }));
        return false;
      }

      setHoldState({
        isHolding: true,
        holdUntil: new Date(data.holdUntil),
        timeRemaining: data.holdDurationSeconds,
        error: null,
      });

      return true;
    } catch (error) {
      setHoldState(prev => ({ ...prev, error: 'Failed to hold session' }));
      return false;
    }
  }, [sessionId]);

  const releaseHold = useCallback(async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/sessions/hold?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      setHoldState({
        isHolding: false,
        holdUntil: null,
        timeRemaining: 0,
        error: null,
      });
    } catch (error) {
      console.error('Failed to release hold:', error);
    }
  }, [sessionId]);

  return {
    ...holdState,
    holdSession,
    releaseHold,
    formatTimeRemaining: () => {
      const minutes = Math.floor(holdState.timeRemaining / 60);
      const seconds = holdState.timeRemaining % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  };
}