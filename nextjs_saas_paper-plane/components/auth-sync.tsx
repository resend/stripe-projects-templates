'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export function AuthSync() {
  const { isLoaded, isSignedIn, sessionId } = useAuth();
  const lastSyncedSessionID = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !sessionId || lastSyncedSessionID.current === sessionId) {
      return;
    }

    lastSyncedSessionID.current = sessionId;

    void fetch('/auth/sync', {
      credentials: 'same-origin',
      method: 'POST',
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { userId?: string };

        if (payload.userId) {
          posthog.identify(payload.userId);
        }

        posthog.capture('user_signed_in');
      })
      .catch(() => {
        lastSyncedSessionID.current = null;
      });
  }, [isLoaded, isSignedIn, sessionId]);

  return null;
}
