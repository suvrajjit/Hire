import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import ResumeAudit from './components/Audit/ResumeAudit';
import { auth } from './firebase';
import ClickSpark from './components/ClickSpark';
import Footer from './components/Footer';
import { db } from './firebase';
import { ref, get } from 'firebase/database';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'login' | 'audit'>('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Check onboarding status
          const userRef = ref(db, 'users/' + user.uid);
          const snapshot = await get(userRef);
          
          if (snapshot.exists() && snapshot.val().onboardingComplete) {
             setView('audit');
          } else {
             setView('login');
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          setView('login');
        }
      } else {
        setView('home');
      }
      setLoading(false);
    });

    // Safety timeout: If Firebase takes too long, just stop loading.
    const safetyTimer = setTimeout(() => {
       setLoading((prev) => {
         if (prev) {
           console.warn("Auth check timed out, forcing load completion.");
           return false;
         }
         return prev;
       });
    }, 2500);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-mono">LOADING SYSTEM...</div>;
  }

  return (
    <ClickSpark
      sparkColor='#fff'
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div className="w-full min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
        {view === 'home' ? (
          <Home onStart={() => setView('login')} />
        ) : view === 'login' ? (
          <Login onBack={() => setView('home')} onLoginSuccess={() => setView('audit')} />
        ) : (
          <ResumeAudit />
        )}
        
        {/* Global Footer */}
        <Footer />
      </div>
    </ClickSpark>
  );
};

export default App;