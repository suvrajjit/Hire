import { useState, useEffect } from 'react';
import { analyzeResume, AuditResult } from '../services/gemini';
import { auth, db } from '../firebase';
import { ref, set, get, remove } from 'firebase/database';

export type AuditStatus = 'idle' | 'analyzing' | 'success' | 'error';

export function useResumeAudit() {
  const [status, setStatus] = useState<AuditStatus>('idle');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
        if (!auth.currentUser) return;
        const auditRef = ref(db, `users/${auth.currentUser.uid}/active_session/audit`);
        try {
            const snapshot = await get(auditRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                setResult(data);
                setStatus('success');
            }
        } catch (err) {
            console.error("Failed to restore session:", err);
        }
    };
    
    // Listen for auth state to ensure we have a UID before fetching
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) restoreSession();
    });
    return () => unsubscribe();
  }, []);

  const audit = async (resumeText: string) => {
    if (!resumeText.trim()) {
      setError("Resume cannot be empty.");
      return;
    }

    setStatus('analyzing');
    setError(null);
    setResult(null);

    try {
      const data = await analyzeResume(resumeText);
      setResult(data);
      setStatus('success');

      // Save to Active Session (Overwrite)
      if (auth.currentUser) {
        const sessionRef = ref(db, `users/${auth.currentUser.uid}/active_session/audit`);
        await set(sessionRef, {
          timestamp: Date.now(),
          originalText: resumeText,
          ...data
        });
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setStatus('error');
    }
  };

  const reset = async () => {
    setStatus('idle');
    setResult(null);
    setError(null);
    
    // Wipe the entire active session (Audit, Roadmap, Chats)
    if (auth.currentUser) {
        const sessionRef = ref(db, `users/${auth.currentUser.uid}/active_session`);
        await remove(sessionRef);
    }
  };

  return { status, result, error, audit, reset };
}
