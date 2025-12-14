import React, { useState, useEffect } from 'react';
import { useResumeAudit } from '../../hooks/useResumeAudit';
import ExplodingCube from './ExplodingCube';
import { AlertTriangle, Trophy, BrainCircuit, RotateCcw, LogOut, Upload, MessagesSquare, Layout, GitPullRequestArrow, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, db } from '../../firebase';
import { ref, get, set } from 'firebase/database'; // Added get, set
import { extractTextFromPDF } from '../../utils/pdfParser';
import PillNav, { PillNavItem } from '../PillNav';
import Interview from '../Interview/Interview';
import Roadmap from '../Roadmap/Roadmap';
import { generateRoadmap, RoadmapItem } from '../../services/gemini';
import { ParticleCard } from '../MagicBento/MagicBento';

const ResumeAudit: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const { status, audit, result, error, reset } = useResumeAudit();
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'audit' | 'interview' | 'roadmap'>('audit');
  const [roadmap, setRoadmap] = useState<RoadmapItem[] | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  // Custom Scroll Logic
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 0);
    setCanScrollDown(Math.ceil(scrollTop + clientHeight) < scrollHeight);
  };

  useEffect(() => {
    checkScroll();
  }, [resumeText]);

  const handleScrollUp = () => {
    if (textareaRef.current) {
        textareaRef.current.scrollBy({ top: -50, behavior: 'smooth' });
    }
  };

  const handleScrollDown = () => {
    if (textareaRef.current) {
        textareaRef.current.scrollBy({ top: 50, behavior: 'smooth' });
    }
  };

  // Restore Roadmap on load
  useEffect(() => {
    const restoreRoadmap = async () => {
        if (!auth.currentUser) return;
        const roadmapRef = ref(db, `users/${auth.currentUser.uid}/active_session/roadmap`);
        try {
            const snapshot = await get(roadmapRef);
            if (snapshot.exists()) {
                setRoadmap(snapshot.val());
            }
        } catch (err) {
            console.error("Failed to restore roadmap:", err);
        }
    };
    if (auth.currentUser) restoreRoadmap();
  }, []);

  const handleAudit = () => {
    if (status === 'analyzing') return;
    audit(resumeText);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const handleGenerateRoadmap = async () => {
      if (!result) return;
      setIsGeneratingRoadmap(true);
      try {
          const plan = await generateRoadmap(resumeText, result.redFlags);
          setRoadmap(plan);
          setMode('roadmap');
          
          // Persist Roadmap to Active Session
          if (auth.currentUser) {
              const roadmapRef = ref(db, `users/${auth.currentUser.uid}/active_session/roadmap`);
              set(roadmapRef, plan).catch(err => console.error("Failed to persist roadmap:", err));
          }
      } catch (err) {
          console.error(err);
          alert("Failed to generate roadmap. Try again.");
      } finally {
          setIsGeneratingRoadmap(false);
      }
  };

  const pillNavItems: PillNavItem[] = React.useMemo(() => [
    { 
        label: "New Audit", 
        onClick: () => {
            reset();
            setResumeText('');
            setMode('audit');
            setRoadmap(null);
            setIsGeneratingRoadmap(false); // Fix: Reset loading state
        }
    },
    { 
        label: "Mock Interview", 
        onClick: () => {
            setMode('interview');
        } 
    },
    {
        label: "Roadmap",
        onClick: () => {
            if (roadmap) setMode('roadmap');
            else alert("Generate a roadmap first.");
        }
    },
    {
        label: "Logout",
        onClick: handleLogout
    }
  ], [reset, roadmap, setIsGeneratingRoadmap]); // Added dependency

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... existing logic
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert("Only PDF files are supported for extraction.");
        return;
    }

    setIsUploading(true);
    try {
        const text = await extractTextFromPDF(file);
        setResumeText(text);
    } catch (err) {
        console.error("PDF Extraction failed", err);
        alert("Failed to read PDF. Please copy/paste text manually.");
    } finally {
        setIsUploading(false);
    }
  };

  if (mode === 'interview') {
      return (
          <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden p-4">
              <PillNav items={pillNavItems} baseColor="#000" pillColor="#fff" pillTextColor="#000" hoveredPillTextColor="#000" />
               {/* Background Ambience */}
              <div className="absolute inset-0 bg-black pointer-events-none"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none" />
              
              <Interview resumeText={resumeText} onExit={() => setMode('audit')} />
          </div>
      );
  }

  if (mode === 'roadmap' && roadmap) {
      return (
          <div className="min-h-screen bg-black text-white relative overflow-y-auto custom-scrollbar">
              <PillNav items={pillNavItems} baseColor="#000" pillColor="#fff" pillTextColor="#000" hoveredPillTextColor="#000" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none fixed" />
              <Roadmap items={roadmap} onBack={() => setMode('audit')} />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center relative overflow-hidden">
        {/* Navigation */}
        <PillNav 
            items={pillNavItems} 
            baseColor="#000" 
            pillColor="#fff" 
            pillTextColor="#fff" 
            hoveredPillTextColor="#000" 
            activeHref={undefined} // Not using router logic
        />

        {/* ... Rest of Audit UI ... */}
        {/* Background Ambience (Matching Homepage) */}
        {/* Removed occluding bg-black */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black pointer-events-none" />
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>

        <div className="relative z-10 w-full max-w-7xl px-4 py-24 flex flex-col items-center">
        
            <header className="text-center mb-16 space-y-4">
                <div className="inline-block px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-900/10 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
                    System Node: Audit_Core_v2
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                RUTHLESS AUDIT
                </h1>
                <p className="text-gray-500 font-mono text-sm max-w-lg mx-auto uppercase tracking-widest">
                "Survival is opt-in. mediocrity is fatal."
                </p>
            </header>

            <div className="w-full flex flex-col lg:flex-row gap-16 items-start justify-center">
                
                {/* Input Section */}
                <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`flex-1 w-full transition-all duration-500 ${status === 'success' ? 'lg:w-1/3 opacity-30 grayscale' : 'lg:w-1/2'}`}
                >
                    <ParticleCard 
                        glowColor="0, 255, 255"
                        enableBorderGlow={true}
                        enableStars={true}
                        enableTilt={false}
                        enableMagnetism={true}
                        clickEffect={true}
                        particleCount={12}
                        className="magic-bento-card magic-bento-card--border-glow bg-zinc-900/30 border border-white/10 p-1 rounded-2xl backdrop-blur-xl h-auto aspect-auto"
                        style={{ '--glow-color': '0, 255, 255' } as React.CSSProperties}
                    >
                        <div className="bg-black/50 rounded-xl p-8 border border-white/5 space-y-6 h-full">
                            
                            {/* File Upload Area */}
                            <div className="relative border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-lg p-8 transition-colors group text-center cursor-pointer overflow-hidden">
                                <input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none relative z-10">
                                    <div className="p-3 bg-zinc-900 rounded-full group-hover:bg-cyan-900/20 transition-colors">
                                        <Upload className={`w-6 h-6 ${isUploading ? 'animate-bounce text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'}`} />
                                    </div>
                                    <span className="text-sm text-gray-300 font-mono tracking-wide">
                                        {isUploading ? "EXTRACTING DATA..." : "DROP PDF OR CLICK"}
                                    </span>
                                </div>
                            </div>

                            <div className="relative group/input">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                        Manual Override (Raw Text)
                                    </label>
                                    <span className="text-[10px] font-mono text-gray-600">{resumeText.length} chars</span>
                                </div>
                                
                                {/* Scroll Up Indicator */}
                                <div className={`absolute top-8 right-2 z-20 transition-opacity duration-300 ${canScrollUp ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                    <button 
                                        onClick={handleScrollUp}
                                        className="p-1 hovered-scroll-btn bg-black/80 backdrop-blur rounded shadow-lg border border-zinc-800 hover:border-cyan-500 hover:text-cyan-400 transition-all text-gray-500"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                </div>

                                <textarea
                                    ref={textareaRef}
                                    onScroll={checkScroll}
                                    className="w-full h-64 bg-black border border-zinc-800 rounded-lg p-4 font-mono text-xs text-gray-300 focus:outline-none focus:border-cyan-900 focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900 transition-all resize-none leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                    placeholder="// PASTE RESUME DATA STREAM HERE..."
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    disabled={status === 'analyzing'}
                                />
                                
                                {/* Scroll Down Indicator */}
                                <div className={`absolute bottom-2 right-2 z-20 transition-opacity duration-300 ${canScrollDown ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                    <button 
                                        onClick={handleScrollDown}
                                        className="p-1 hovered-scroll-btn bg-black/80 backdrop-blur rounded shadow-lg border border-zinc-800 hover:border-cyan-500 hover:text-cyan-400 transition-all text-gray-500"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleAudit}
                                disabled={status === 'analyzing' || !resumeText.trim()}
                                className="w-full py-5 bg-white hover:bg-gray-200 text-black font-bold uppercase tracking-widest text-sm rounded-lg transition-all transform hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10 flex items-center justify-center gap-3 group"
                            >
                                {status === 'analyzing' ? (
                                    <>
                                        <BrainCircuit className="animate-spin" size={18} /> PROCESSING...
                                    </>
                                ) : (
                                    <>
                                        INITIATE AUDIT <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </>
                                )}
                            </button>
                            {error && <p className="text-red-500 font-mono text-xs text-center border border-red-900/30 bg-red-900/10 p-2 rounded">{error}</p>}
                        </div>
                    </ParticleCard>
                </motion.div>

                {/* Visualization & Result Section */}
                <div className="flex-1 w-full flex flex-col items-center">
                    
                    {status !== 'success' && (
                        <div className="h-[500px] flex items-center justify-center w-full relative">
                             {/* Ambient Glow */}
                             <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                            <ExplodingCube status={status} />
                        </div>
                    )}

                    {status === 'success' && result && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full space-y-8"
                        >
                            {/* Score Card */}
                            <motion.div 
                                initial={{ opacity: 0, x: 100 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: false, amount: 0.2 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="flex flex-col md:flex-row items-center justify-between bg-zinc-900/80 border border-white/10 p-8 rounded-2xl relative overflow-hidden backdrop-blur-md"
                            >
                                <div className={`absolute top-0 right-0 p-40 bg-${result.score > 80 ? 'green' : result.score < 50 ? 'red' : 'yellow'}-500/10 blur-[80px] rounded-full`}></div>
                                <div className="relative z-10">
                                    <h2 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-1">Survival Probability</h2>
                                    <div className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-600 leading-none tracking-tighter">
                                        {result.score}%
                                    </div>
                                </div>
                                <div className="text-right max-w-xs relative z-10 mt-6 md:mt-0">
                                    <div className="text-4xl text-white/20 font-black mb-2">"</div>
                                    <p className="font-mono text-sm text-gray-300 leading-relaxed">{result.summary}</p>
                                </div>
                            </motion.div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={() => setMode('interview')}
                                    className="flex-1 py-5 bg-gradient-to-r from-indigo-900 to-purple-900 border border-purple-500/30 rounded-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    <MessagesSquare className="text-purple-300" />
                                    <span className="font-bold text-gray-200 uppercase tracking-widest text-xs lg:text-sm">Mock Interview</span>
                                </button>
                                
                                <button
                                    onClick={handleGenerateRoadmap}
                                    disabled={isGeneratingRoadmap}
                                    className="flex-1 py-5 bg-gradient-to-r from-emerald-900 to-teal-900 border border-emerald-500/30 rounded-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    {isGeneratingRoadmap ? (
                                        <BrainCircuit className="animate-spin text-emerald-300" />
                                    ) : (
                                        <GitPullRequestArrow className="text-emerald-300" />
                                    )}
                                    <span className="font-bold text-gray-200 uppercase tracking-widest text-xs lg:text-sm">
                                        {isGeneratingRoadmap ? "Compiling..." : "Generate Roadmap"}
                                    </span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {/* Red Flags */}
                                {result.redFlags.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-xs border-b border-red-900/30 pb-2">
                                            <AlertTriangle size={14} /> Fatal Flaws
                                        </h3>
                                        {result.redFlags.map((flag, idx) => (
                                            <motion.div 
                                                key={idx} 
                                                className="relative group"
                                                initial={{ opacity: 0, x: 100 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: false, amount: 0.2 }}
                                                transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                                            >
                                                 <ParticleCard
                                                    glowColor="255, 50, 50"
                                                    enableBorderGlow={true}
                                                    enableTilt={false}
                                                    enableStars={true}
                                                    particleCount={8}
                                                    className="magic-bento-card--border-glow bg-red-950/20 border border-red-500/20 p-5 rounded-lg h-full"
                                                    style={{ '--glow-color': '255, 50, 50' } as React.CSSProperties}
                                                 >
                                                    <h4 className="font-bold text-red-400 mb-2 font-mono text-sm tracking-wide group-hover:text-red-300 relative z-10">{flag.title}</h4>
                                                    <p className="text-xs text-gray-400 leading-relaxed relative z-10">{flag.description}</p>
                                                 </ParticleCard>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Green Flags */}
                                {result.greenFlags.length > 0 && (
                                    <div className="space-y-4 mt-4">
                                        <h3 className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs border-b border-emerald-900/30 pb-2">
                                            <Trophy size={14} /> Saving Graces
                                        </h3>
                                        {result.greenFlags.map((flag, idx) => (
                                            <motion.div 
                                                key={idx} 
                                                className="relative group"
                                                initial={{ opacity: 0, x: 100 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: false, amount: 0.2 }}
                                                transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                                            >
                                                <ParticleCard
                                                    glowColor="50, 255, 128"
                                                    enableBorderGlow={true}
                                                    enableTilt={false}
                                                    enableStars={true}
                                                    particleCount={8}
                                                    className="magic-bento-card--border-glow bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-lg h-full"
                                                    style={{ '--glow-color': '50, 255, 128' } as React.CSSProperties}
                                                >
                                                    <h4 className="font-bold text-emerald-400 mb-2 font-mono text-sm tracking-wide group-hover:text-emerald-300 relative z-10">{flag.title}</h4>
                                                    <p className="text-xs text-gray-400 leading-relaxed relative z-10">{flag.description}</p>
                                                </ParticleCard>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-white/5 flex justify-center">
                                <button 
                                    onClick={reset}
                                    className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white font-mono uppercase tracking-widest text-xs rounded-full border border-zinc-800 transition-all flex items-center gap-2"
                                >
                                    <RotateCcw size={14} /> Restart Simulation
                                </button>
                            </div>

                        </motion.div>
                    )}
                </div>
            </div>
            
            {/* Direct Logout Button (Backup) */}
            <div className="fixed bottom-6 right-6 z-40 lg:hidden">
                 <button 
                   onClick={handleLogout}
                   className="w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center border border-red-500/20"
                >
                  <LogOut size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default ResumeAudit;
