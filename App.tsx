import React, { useState } from 'react';
import Home from './components/Home';
import Login from './components/Login';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'login'>('home');

  return (
    <div className="w-full min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
      {view === 'home' ? (
        <Home onStart={() => setView('login')} />
      ) : (
        <Login onBack={() => setView('home')} />
      )}
    </div>
  );
};

export default App;