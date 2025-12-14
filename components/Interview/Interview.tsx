import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, User, Cpu, StopCircle } from 'lucide-react';
import { startInterviewSession, Persona } from '../../services/gemini';
import { ChatSession } from '@google/generative-ai';
import { auth, db } from '../../firebase';
import { ref, push, set } from 'firebase/database';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface InterviewProps {
  resumeText: string;
  onExit: () => void;
}

const PERSONAS: { id: Persona; name: string; desc: string; color: string }[] = [
    { id: 'grumpy_cto', name: "The Grumpy CTO", desc: "Cynical, tech-focused, hates bs.", color: "text-red-400" },
    { id: 'behavioral_hr', name: "Behavioral HR", desc: "Strict, focus on culture & soft skills.", color: "text-blue-400" },
    { id: 'visionary_founder', name: "The Visionary Founder", desc: "Intense, high-energy, demanding.", color: "text-purple-400" }
];

const Interview: React.FC<InterviewProps> = ({ resumeText, onExit }) => {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessage = async (msg: Message, iId: string) => {
      if (!auth.currentUser) return;
      const msgRef = ref(db, `users/${auth.currentUser.uid}/active_session/interviews/${iId}/messages`);
      await push(msgRef, msg);
  };

  const [initError, setInitError] = useState<string | null>(null);

  // Safety valve: unexpected hang protection
  useEffect(() => {
    let safetyTimer: NodeJS.Timeout;
    if (isThinking) {
        safetyTimer = setTimeout(() => {
            if (isThinking) {
                 setIsThinking(false);
                 setMessages(prev => [...prev, { id: 'timeout', role: 'model', text: "SYSTEM ALERT: Operation timed out. Please try again.", timestamp: Date.now() }]);
            }
        }, 15000); // 15s absolute max
    }
    return () => clearTimeout(safetyTimer);
  }, [isThinking]);

  const initSession = async (p: Persona) => {
    setPersona(p);
    setIsThinking(true);
    setInitError(null);
    setMessages([]); // Clear previous
    let currentInterviewId = interviewId;

    try {
        // Step 1: Firebase (Active Session Scope)
        setMessages([{ id: 'sys_1', role: 'model', text: ">> ESTABLISHING SECURE CONNECTION...", timestamp: Date.now() }]);
        
        if (auth.currentUser) {
            try {
                const interviewsRef = ref(db, `users/${auth.currentUser.uid}/active_session/interviews`);
                
                // Create a promise that rejects after 3 seconds
                const timeoutDetails = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Firebase Write Timeout")), 3000)
                );

                const dbOperation = push(interviewsRef, {
                    timestamp: Date.now(),
                    persona: p,
                    resumeContext: resumeText.substring(0, 100) + '...'
                });

                // Race the DB write against the clock
                const newInterviewRef: any = await Promise.race([dbOperation, timeoutDetails]);
                
                currentInterviewId = newInterviewRef.key;
                setInterviewId(currentInterviewId);
            } catch (fbErr) {
                console.warn("Firebase persistence skipped:", fbErr);
                setMessages(prev => [...prev, { id: 'sys_warn', role: 'model', text: ">> WARNING: DATABASE SLOW. SKIPPING PERSISTENCE...", timestamp: Date.now() }]);
            }
        }

        // Step 2: Gemini Init
        setMessages(prev => [...prev, { id: 'sys_2', role: 'model', text: ">> LOADING PERSONA MATRIX...", timestamp: Date.now() }]);
        
        // Truncate resume text to prevent token overflow/hangs
        const safeResumeText = resumeText.slice(0, 20000); 
        const session = await startInterviewSession(p, safeResumeText);
        setChatSession(session);
        
        // Step 3: First Message Handshake
        setMessages(prev => [...prev, { id: 'sys_3', role: 'model', text: ">> HANDSHAKE PROTOCOL INITIATED...", timestamp: Date.now() }]);
        
        const apiCall = session.sendMessage("Hello. I am ready.");
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini AI Handshake Timed Out")), 10000));
        
        const result: any = await Promise.race([apiCall, timeout]);
        const text = result.response.text();
        
        // Success! Clear system messages and show real response
        const initMsg: Message = { id: 'init', role: 'model', text, timestamp: Date.now() };
        setMessages([initMsg]); // Replace system logs with the actual greeting
        
        if (currentInterviewId) saveMessage(initMsg, currentInterviewId);

    } catch (err: any) {
        console.error("Interview Init Failed:", err);
        setInitError(err.message);
        setMessages(prev => [...prev, { id: 'error', role: 'model', text: `SYSTEM FAILURE: ${err.message || "Unknown Connection Error"}`, timestamp: Date.now() }]);
    } finally {
        setIsThinking(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;
    
    // Optimistic User Msg
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    if (interviewId) saveMessage(userMsg, interviewId);

    try {
        const result = await chatSession.sendMessage(input);
        const text = result.response.text();
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text, timestamp: Date.now() };
        
        setMessages(prev => [...prev, aiMsg]);
        if (interviewId) saveMessage(aiMsg, interviewId);

    } catch (err) {
        console.error(err);
        const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: "Error: Connection lost.", timestamp: Date.now() };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsThinking(false);
    }
  };

  if (!persona) {
     return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 animation-fade-in">
             <h2 className="text-3xl font-black mb-8 tracking-tighter">SELECT YOUR INTERVIEWER</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                {PERSONAS.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => initSession(p.id)}
                        className="group bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-gray-500 transition-all text-left relative overflow-hidden"
                    >
                         <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-current ${p.color}`}></div>
                         <h3 className={`text-xl font-bold mb-2 ${p.color}`}>{p.name}</h3>
                         <p className="text-sm text-gray-400 font-mono">{p.desc}</p>
                    </button>
                ))}
             </div>
             <button onClick={onExit} className="mt-12 text-sm text-gray-500 hover:text-white uppercase tracking-widest">Cancel</button>
        </div>
     );
  }

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-5xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Cockpit Header */}
        <div className="bg-black p-4 border-b border-zinc-800 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full animate-pulse ${persona === 'grumpy_cto' ? 'bg-red-500' : persona === 'behavioral_hr' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                 <span className="font-mono text-sm uppercase tracking-widest text-gray-400">
                    Connected: <span className="text-white font-bold">{PERSONAS.find(p => p.id === persona)?.name}</span>
                 </span>
            </div>
            <button onClick={onExit} className="text-gray-500 hover:text-red-500 transition-colors">
                <StopCircle size={20} />
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative custom-scrollbar" ref={scrollRef}>
            {/* Ambient Orb */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                 <div className={`w-64 h-64 rounded-full blur-[80px] ${isThinking ? 'animate-pulse scale-110' : 'scale-100'} transition-all duration-1000 ${String(PERSONAS.find(p => p.id === persona)?.color).replace('text-', 'bg-')}-500`}></div>
            </div>

            {messages.map((msg) => (
                <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
                >
                    <div className={`max-w-[70%] p-5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-white text-black rounded-tr-none' 
                        : 'bg-zinc-900 border border-zinc-800 text-gray-200 rounded-tl-none font-mono shadow-lg'
                    }`}>
                         {msg.text}
                    </div>
                    {msg.role === 'model' && (
                         <div className="absolute -left-10 top-0 opacity-20 hover:opacity-100 transition-opacity">
                            <Cpu size={16} />
                         </div>
                    )}
                </motion.div>
            ))}
             {isThinking && (
                 <div className="flex justify-start">
                     <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl rounded-tl-none flex gap-1">
                         <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-0"></span>
                         <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                         <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                     </div>
                 </div>
             )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black border-t border-zinc-800">
            <div className="flex gap-4 items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 focus-within:border-gray-600 transition-colors">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your response..."
                    className="flex-1 bg-transparent px-4 py-3 text-white focus:outline-none font-mono text-sm"
                    disabled={isThinking}
                 />
                 <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    className="p-3 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                    <Send size={18} />
                 </button>
            </div>
        </div>
    </div>
  );
};

export default Interview;
