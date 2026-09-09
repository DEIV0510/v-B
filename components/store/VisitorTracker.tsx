'use client';

import { useEffect } from 'react';
import { incrementVisitorCount } from '@/app/actions/track';

const SESSION_KEY = 'vb_visit_counted';

export default function VisitorTracker() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // si sessionStorage falla (modo privado, etc.) simplemente no contamos esta visita
      return;
    }
    incrementVisitorCount();
  }, []);

  return null;
}
